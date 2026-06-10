import { supabase } from "./supabase";
import { normalizeState, type BracketState } from "./bracketState";
import { PREDICTION_LOCK_LABEL, predictionsLocked } from "./lock";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface League {
  id: string;
  code: string;
  name: string;
  owner: string;
  created_at: string;
}

export interface LeagueMemberView {
  user_id: string;
  profile: Profile | null;
  bracket: BracketState | null;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

function explainError(error: SupabaseErrorLike, fallback: string): Error {
  const parts = [error.message, error.details, error.hint].filter(Boolean);
  return new Error(parts.length ? parts.join(" ") : fallback);
}

function isMissingRpc(error: SupabaseErrorLike): boolean {
  const msg = error.message ?? "";
  return (
    error.code === "PGRST202" ||
    msg.includes("schema cache") ||
    msg.includes("function public.")
  );
}

function asLeague(data: unknown): League | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as League | undefined) ?? null;
  return data as League;
}

// ---- Bracket persistence ----

export async function getMyBracket(): Promise<BracketState | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("brackets")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) {
    console.warn("Could not load cloud bracket", error);
    return null;
  }
  if (!data) return null;
  return normalizeState(data.data);
}

export async function saveMyBracket(state: BracketState): Promise<void> {
  if (!supabase) return;
  if (predictionsLocked()) return;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from("brackets")
    .upsert(
      { user_id: uid, data: state, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) console.warn("Could not save cloud bracket", error);
}

// ---- Leagues ----

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export async function createLeague(name: string): Promise<League> {
  if (!supabase) throw new Error("Cloud not configured");
  if (predictionsLocked()) {
    throw new Error(`Predictions and leagues locked ${PREDICTION_LOCK_LABEL}`);
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");

  // Retry on the (rare) code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { data, error } = await supabase
      .from("leagues")
      .insert({ code, name: name.trim() || "My League", owner: uid })
      .select()
      .single();
    if (!error && data) {
      const { error: memErr } = await supabase
        .from("league_members")
        .insert({ league_id: data.id, user_id: uid });
      if (memErr) throw memErr;
      return data as League;
    }
    if (error && error.code !== "23505") throw error; // not a unique violation
  }
  throw new Error("Could not generate a unique league code, try again");
}

export async function joinLeague(code: string): Promise<League> {
  if (!supabase) throw new Error("Cloud not configured");
  if (predictionsLocked()) {
    throw new Error(`Predictions and leagues locked ${PREDICTION_LOCK_LABEL}`);
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");

  const clean = code.trim().toUpperCase();

  // Preferred path: the database joins by code in one security-definer function.
  // This works even if direct league reads are restricted before membership.
  const { data: joined, error: rpcError } = await supabase.rpc(
    "join_league_by_code",
    { p_code: clean }
  );
  if (!rpcError) {
    const league = asLeague(joined);
    if (league) return league;
  } else if (!isMissingRpc(rpcError)) {
    throw explainError(rpcError, "Could not join league");
  }

  // Backward-compatible fallback for databases that have not applied the RPC yet.
  const { data: league, error } = await supabase
    .from("leagues")
    .select("*")
    .eq("code", clean)
    .maybeSingle();
  if (error) throw explainError(error, "Could not look up league");
  if (!league) throw new Error("No league found with that code");

  // Plain INSERT avoids needing an UPDATE policy. If the user is already in the
  // league, the unique constraint error is harmless.
  const { error: joinErr } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: uid });
  if (joinErr && joinErr.code !== "23505") {
    throw explainError(joinErr, "Could not join league");
  }
  return league as League;
}

export async function myLeagues(): Promise<League[]> {
  if (!supabase) return [];
  const { data: rpcData, error: rpcError } = await supabase.rpc("my_leagues");
  if (!rpcError && rpcData) return (rpcData as League[]);
  if (rpcError && !isMissingRpc(rpcError)) {
    console.warn("Could not load leagues via RPC", rpcError);
  }

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("league_members")
    .select("leagues(*)")
    .eq("user_id", uid);
  if (error || !data) return [];
  return data
    .map((row: { leagues: League | League[] | null }) =>
      Array.isArray(row.leagues) ? row.leagues[0] : row.leagues
    )
    .filter((l): l is League => !!l)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function leagueMembers(
  leagueId: string
): Promise<LeagueMemberView[]> {
  if (!supabase) return [];
  // Fetch members, profiles and brackets separately — both profiles and
  // league_members FK to auth.users, so PostgREST can't auto-embed them.
  const { data: members, error } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId);
  if (error || !members) return [];

  const ids = members.map((m: { user_id: string }) => m.user_id);
  if (ids.length === 0) return [];

  const [{ data: profiles }, { data: brackets }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids),
    supabase.from("brackets").select("user_id, data").in("user_id", ids),
  ]);

  const profileById = new Map<string, Profile>(
    (profiles ?? []).map((p: Profile) => [p.id, p])
  );
  const bracketByUser = new Map<string, BracketState>(
    (brackets ?? []).map((b: { user_id: string; data: unknown }) => [
      b.user_id,
      normalizeState(b.data),
    ])
  );

  return members.map((m: { user_id: string }) => ({
    user_id: m.user_id,
    profile: profileById.get(m.user_id) ?? null,
    bracket: bracketByUser.get(m.user_id) ?? null,
  }));
}

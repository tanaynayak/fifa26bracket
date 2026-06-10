import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  createLeague,
  joinLeague,
  leagueMembers,
  myLeagues,
  type League,
  type LeagueMemberView,
} from "../lib/cloud";
import { computeBracket, summarize } from "../lib/bracketState";
import { teamById } from "../data/teams";
import Modal from "./Modal";
import TeamFlag from "./TeamFlag";
import KnockoutStage from "./KnockoutStage";

interface Props {
  open: boolean;
  onClose: () => void;
  locked?: boolean;
}

export default function LeaguesModal({ open, onClose, locked }: Props) {
  const { user, signInWithGoogle } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [active, setActive] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMemberView[]>([]);
  const [viewing, setViewing] = useState<LeagueMemberView | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLeagues = async () => setLeagues(await myLeagues());

  useEffect(() => {
    if (open && user) refreshLeagues();
    if (!open) {
      setActive(null);
      setViewing(null);
      setError(null);
    }
  }, [open, user]);

  useEffect(() => {
    if (active) leagueMembers(active.id).then(setMembers);
  }, [active]);

  const handleCreate = async () => {
    if (locked) {
      setError("Leagues are locked.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const league = await createLeague(name);
      setName("");
      await refreshLeagues();
      setActive(league);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create league");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (locked) {
      setError("Leagues are locked.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const league = await joinLeague(code);
      setCode("");
      await refreshLeagues();
      setActive(league);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join league");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={active ? active.name : "Leagues"}>
        {!user ? (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm text-slate-500">
              Sign in to create leagues, share a code with friends, and compare
              brackets.
            </p>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="rounded-xl bg-gradient-to-r from-pitch to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              Sign in to continue
            </button>
          </div>
        ) : active ? (
          <LeagueDetail
            league={active}
            members={members}
            onBack={() => setActive(null)}
            onViewMember={setViewing}
          />
        ) : (
          <div className="space-y-6">
            {/* My leagues */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                My leagues
              </h4>
              {leagues.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You're not in any leagues yet — create one or join with a code.
                </p>
              ) : (
                <ul className="space-y-2">
                  {leagues.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setActive(l)}
                        className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-emerald-50"
                      >
                        <span className="font-semibold text-slate-700">{l.name}</span>
                        <span className="font-display text-sm font-bold tracking-widest text-emerald-700">
                          {l.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Create + Join */}
            {locked && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                League creation and joining are locked.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 text-sm font-bold text-ink">Create a league</h4>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={locked}
                  placeholder="League name"
                  className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="button"
                  disabled={locked || busy || !name.trim()}
                  onClick={handleCreate}
                  className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  Create
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 text-sm font-bold text-ink">Join with a code</h4>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={locked}
                  placeholder="e.g. 7KQ2M9"
                  maxLength={6}
                  className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-display font-bold tracking-widest focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="button"
                  disabled={locked || busy || code.trim().length < 4}
                  onClick={handleJoin}
                  className="w-full rounded-lg bg-ink py-2 text-sm font-bold text-white transition hover:bg-ink-700 disabled:bg-slate-300"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Friend's bracket viewer */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        wide
        title={`${viewing?.profile?.display_name ?? "Player"}'s bracket`}
      >
        {viewing?.bracket ? (
          <KnockoutStage
            bracket={computeBracket(viewing.bracket)}
            onPick={() => {}}
            readOnly
          />
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">
            This player hasn't built a bracket yet.
          </p>
        )}
      </Modal>
    </>
  );
}

function LeagueDetail({
  league,
  members,
  onBack,
  onViewMember,
}: {
  league: League;
  members: LeagueMemberView[];
  onBack: () => void;
  onViewMember: (m: LeagueMemberView) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    await navigator.clipboard?.writeText(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        ← All leagues
      </button>

      <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-ink to-ink-700 px-4 py-3 text-white">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-300">
            Invite code
          </div>
          <div className="font-display text-2xl font-bold tracking-[0.3em] text-gold">
            {league.code}
          </div>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-bold transition hover:bg-white/25"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {members.length} {members.length === 1 ? "member" : "members"}
      </h4>
      <ul className="space-y-2">
        {members.map((m) => {
          const sum = m.bracket ? summarize(m.bracket) : null;
          const champ = sum?.champion ? teamById(sum.champion) : null;
          return (
            <li key={m.user_id}>
              <button
                type="button"
                onClick={() => onViewMember(m)}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-emerald-50"
              >
                {m.profile?.avatar_url ? (
                  <img
                    src={m.profile.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full ring-1 ring-slate-200"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                    {(m.profile?.display_name ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-700">
                    {m.profile?.display_name ?? "Player"}
                  </div>
                </div>
                {champ ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-amber-700">
                    🏆 <TeamFlag flag={champ.flag} size={16} /> {champ.name}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { GROUPS } from "../data/teams";
import { KNOCKOUT_MATCHES } from "../data/knockout";
import type { GroupId } from "../types";
import { assignThirdPlaces } from "./thirdPlace";
import { buildBracket, type Bracket, type Picks, type Standings } from "./bracket";

export const TOTAL_KNOCKOUT_PICKS = KNOCKOUT_MATCHES.length;

/** The full user prediction — the single blob we persist locally and to cloud. */
export interface BracketState {
  standings: Standings;
  thirdQualifiers: GroupId[];
  picks: Picks;
}

export function defaultStandings(): Standings {
  return Object.fromEntries(
    GROUPS.map((g) => [g.id, g.teams.map((t) => t.id)])
  ) as Standings;
}

export function defaultState(): BracketState {
  return { standings: defaultStandings(), thirdQualifiers: [], picks: {} };
}

/** Resolve a state into a fully-computed bracket. */
export function computeBracket(s: BracketState): Bracket {
  const assignment =
    s.thirdQualifiers.length === 8 ? assignThirdPlaces(s.thirdQualifiers) : null;
  return buildBracket(s.standings, assignment, s.picks);
}

export interface BracketSummary {
  champion: string | null;
  runnerUp: string | null;
  /** the four semi-finalists (teams that reached the semis), nulls filtered */
  semifinalists: string[];
  /** how many knockout matches the user has decided */
  decided: number;
}

/** A compact summary for league tables / share cards. */
export function summarize(s: BracketState): BracketSummary {
  const b = computeBracket(s);
  const final = b.results[104];
  const sf1 = b.results[101];
  const sf2 = b.results[102];
  const semifinalists = [sf1?.home, sf1?.away, sf2?.home, sf2?.away].filter(
    (x): x is string => !!x
  );
  const decided = Object.values(b.results).filter((r) => r.winner).length;
  return {
    champion: b.champion,
    runnerUp:
      b.champion && final
        ? final.home === b.champion
          ? final.away
          : final.home
        : null,
    semifinalists,
    decided,
  };
}

/** Defensive normaliser for blobs coming from storage/cloud. */
export function normalizeState(raw: unknown): BracketState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<BracketState>;
  return {
    standings: { ...base.standings, ...(r.standings ?? {}) },
    thirdQualifiers: Array.isArray(r.thirdQualifiers)
      ? (r.thirdQualifiers.slice(0, 8) as GroupId[])
      : [],
    picks: r.picks && typeof r.picks === "object" ? r.picks : {},
  };
}

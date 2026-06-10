import type { GroupId, SlotRef } from "../types";
import { KNOCKOUT_MATCHES } from "../data/knockout";

export type Standings = Record<GroupId, string[]>; // 4 team ids, finishing order
export type Picks = Record<number, string>; // match number → winning team id

export interface MatchResult {
  home: string | null;
  away: string | null;
  winner: string | null;
  loser: string | null;
}

export interface Bracket {
  results: Record<number, MatchResult>;
  champion: string | null;
}

/**
 * Resolve every knockout match given the group standings, the assignment of
 * third-placed groups to their slots, and the user's winner picks.
 *
 * Matches reference only lower match numbers, so a single ascending pass fully
 * resolves the tree. A pick is honoured only while the picked team is still one
 * of the two teams in that match, so upstream edits auto-invalidate stale picks.
 */
export function buildBracket(
  standings: Standings,
  thirdAssignment: Record<number, GroupId> | null,
  picks: Picks
): Bracket {
  const results: Record<number, MatchResult> = {};

  const resolve = (ref: SlotRef): string | null => {
    switch (ref.kind) {
      case "winner":
        return standings[ref.group]?.[0] ?? null;
      case "runnerUp":
        return standings[ref.group]?.[1] ?? null;
      case "third": {
        const group = thirdAssignment?.[ref.match];
        return group ? standings[group]?.[2] ?? null : null;
      }
      case "matchWinner":
        return results[ref.match]?.winner ?? null;
      case "matchLoser":
        return results[ref.match]?.loser ?? null;
    }
  };

  for (const m of KNOCKOUT_MATCHES) {
    const home = resolve(m.home);
    const away = resolve(m.away);
    const picked = picks[m.match];
    const winner = picked && (picked === home || picked === away) ? picked : null;
    const loser = winner ? (winner === home ? away : home) : null;
    results[m.match] = { home, away, winner, loser };
  }

  return { results, champion: results[104]?.winner ?? null };
}

import type { GroupId, KnockoutMatch } from "../types";

/**
 * Round of 32 → Final structure for the 2026 World Cup (matches 73–104),
 * per the official knockout bracket.
 *
 * Eight matches host a "best third-placed team" (matches 74, 77, 79, 80, 81,
 * 82, 85, 87). Each of those slots may only be filled by a third-placed team
 * from a specific set of groups — see THIRD_PLACE_SLOTS below.
 */
export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  // ---- Round of 32 ----
  { match: 73, round: "R32", home: { kind: "runnerUp", group: "A" }, away: { kind: "runnerUp", group: "B" } },
  { match: 74, round: "R32", home: { kind: "winner", group: "E" }, away: { kind: "third", match: 74 } },
  { match: 75, round: "R32", home: { kind: "winner", group: "F" }, away: { kind: "runnerUp", group: "C" } },
  { match: 76, round: "R32", home: { kind: "winner", group: "C" }, away: { kind: "runnerUp", group: "F" } },
  { match: 77, round: "R32", home: { kind: "winner", group: "I" }, away: { kind: "third", match: 77 } },
  { match: 78, round: "R32", home: { kind: "runnerUp", group: "E" }, away: { kind: "runnerUp", group: "I" } },
  { match: 79, round: "R32", home: { kind: "winner", group: "A" }, away: { kind: "third", match: 79 } },
  { match: 80, round: "R32", home: { kind: "winner", group: "L" }, away: { kind: "third", match: 80 } },
  { match: 81, round: "R32", home: { kind: "winner", group: "D" }, away: { kind: "third", match: 81 } },
  { match: 82, round: "R32", home: { kind: "winner", group: "G" }, away: { kind: "third", match: 82 } },
  { match: 83, round: "R32", home: { kind: "runnerUp", group: "K" }, away: { kind: "runnerUp", group: "L" } },
  { match: 84, round: "R32", home: { kind: "winner", group: "H" }, away: { kind: "runnerUp", group: "J" } },
  { match: 85, round: "R32", home: { kind: "winner", group: "B" }, away: { kind: "third", match: 85 } },
  { match: 86, round: "R32", home: { kind: "winner", group: "J" }, away: { kind: "runnerUp", group: "H" } },
  { match: 87, round: "R32", home: { kind: "winner", group: "K" }, away: { kind: "third", match: 87 } },
  { match: 88, round: "R32", home: { kind: "runnerUp", group: "D" }, away: { kind: "runnerUp", group: "G" } },

  // ---- Round of 16 ----
  { match: 89, round: "R16", home: { kind: "matchWinner", match: 74 }, away: { kind: "matchWinner", match: 77 } },
  { match: 90, round: "R16", home: { kind: "matchWinner", match: 73 }, away: { kind: "matchWinner", match: 75 } },
  { match: 91, round: "R16", home: { kind: "matchWinner", match: 76 }, away: { kind: "matchWinner", match: 78 } },
  { match: 92, round: "R16", home: { kind: "matchWinner", match: 79 }, away: { kind: "matchWinner", match: 80 } },
  { match: 93, round: "R16", home: { kind: "matchWinner", match: 83 }, away: { kind: "matchWinner", match: 84 } },
  { match: 94, round: "R16", home: { kind: "matchWinner", match: 81 }, away: { kind: "matchWinner", match: 82 } },
  { match: 95, round: "R16", home: { kind: "matchWinner", match: 86 }, away: { kind: "matchWinner", match: 88 } },
  { match: 96, round: "R16", home: { kind: "matchWinner", match: 85 }, away: { kind: "matchWinner", match: 87 } },

  // ---- Quarter-finals ----
  { match: 97, round: "QF", home: { kind: "matchWinner", match: 89 }, away: { kind: "matchWinner", match: 90 } },
  { match: 98, round: "QF", home: { kind: "matchWinner", match: 93 }, away: { kind: "matchWinner", match: 94 } },
  { match: 99, round: "QF", home: { kind: "matchWinner", match: 91 }, away: { kind: "matchWinner", match: 92 } },
  { match: 100, round: "QF", home: { kind: "matchWinner", match: 95 }, away: { kind: "matchWinner", match: 96 } },

  // ---- Semi-finals ----
  { match: 101, round: "SF", home: { kind: "matchWinner", match: 97 }, away: { kind: "matchWinner", match: 98 } },
  { match: 102, round: "SF", home: { kind: "matchWinner", match: 99 }, away: { kind: "matchWinner", match: 100 } },

  // ---- Third-place play-off ----
  { match: 103, round: "3RD", home: { kind: "matchLoser", match: 101 }, away: { kind: "matchLoser", match: 102 } },

  // ---- Final ----
  { match: 104, round: "F", home: { kind: "matchWinner", match: 101 }, away: { kind: "matchWinner", match: 102 } },
];

/**
 * Which group's third-placed team is allowed into each "third" slot.
 * A perfect matching always exists for any choice of 8 of the 12 groups
 * (FIFA designed Annex C this way).
 */
export const THIRD_PLACE_SLOTS: { match: number; winnerGroup: GroupId; allowed: GroupId[] }[] = [
  { match: 74, winnerGroup: "E", allowed: ["A", "B", "C", "D", "F"] },
  { match: 77, winnerGroup: "I", allowed: ["C", "D", "F", "G", "H"] },
  { match: 79, winnerGroup: "A", allowed: ["C", "E", "F", "H", "I"] },
  { match: 80, winnerGroup: "L", allowed: ["E", "H", "I", "J", "K"] },
  { match: 81, winnerGroup: "D", allowed: ["B", "E", "F", "I", "J"] },
  { match: 82, winnerGroup: "G", allowed: ["A", "E", "H", "I", "J"] },
  { match: 85, winnerGroup: "B", allowed: ["E", "F", "G", "I", "J"] },
  { match: 87, winnerGroup: "K", allowed: ["D", "E", "I", "J", "L"] },
];

export const ROUND_LABELS: Record<KnockoutMatch["round"], string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3RD": "Third place",
  F: "Final",
};

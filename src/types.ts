export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export interface Team {
  /** Stable unique id, e.g. "BRA". */
  id: string;
  name: string;
  /** flagcdn code, e.g. "br", "gb-eng". */
  flag: string;
}

export interface Group {
  id: GroupId;
  /** Teams in their drawn pot order (pot 1 → 4). */
  teams: Team[];
}

/** A reference to a knockout slot's occupant, resolved as the bracket fills in. */
export type SlotRef =
  | { kind: "winner"; group: GroupId } // group winner
  | { kind: "runnerUp"; group: GroupId } // group runner-up
  | { kind: "third"; match: number } // best-third assigned to this match
  | { kind: "matchWinner"; match: number } // winner of an earlier match
  | { kind: "matchLoser"; match: number }; // loser (used for 3rd-place playoff)

export interface KnockoutMatch {
  match: number;
  round: "R32" | "R16" | "QF" | "SF" | "3RD" | "F";
  home: SlotRef;
  away: SlotRef;
}

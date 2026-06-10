import { KNOCKOUT_MATCHES } from "../data/knockout";
import type { KnockoutMatch } from "../types";

// ---- Tunable geometry ----
export const CARD_W = 216;
export const CARD_H = 96;
export const V_GAP = 10;
export const H_GAP = 28;
export const HEADER_H = 32;
/** No left gutter — every card carries its own match label now. */
export const LEFT_PAD = 0;
/** Extra space above the 3rd-place card so it reads apart from the semis. */
export const THIRD_GAP = 28;

/** The 3rd-place play-off shares the Semi-finals column. */
export const COL_INDEX: Record<KnockoutMatch["round"], number> = {
  R32: 0,
  R16: 1,
  QF: 2,
  SF: 3,
  "3RD": 3,
  F: 4,
};

const byMatch = new Map(KNOCKOUT_MATCHES.map((m) => [m.match, m]));

/** Direct child match numbers feeding a match, in [home, away] order. */
function childMatches(m: KnockoutMatch): number[] {
  return [m.home, m.away]
    .filter((r) => r.kind === "matchWinner")
    .map((r) => (r as { match: number }).match);
}

/** In-order leaf (R32) traversal from the final — this is the row order. */
function leaves(match: number): number[] {
  const m = byMatch.get(match)!;
  const kids = childMatches(m);
  if (kids.length === 0) return [match];
  return kids.flatMap(leaves);
}

export interface TreeNode {
  match: number;
  round: KnockoutMatch["round"];
  x: number; // left
  y: number; // top
  cx: number; // center x
  cy: number; // center y
}

export interface TreeLayout {
  nodes: TreeNode[];
  connectors: string[]; // SVG path strings
  width: number;
  height: number;
}

export const COLUMNS = [0, 1, 2, 3, 4];

function build(): TreeLayout {
  const ROOT = 104;
  const order = leaves(ROOT); // 16 R32 matches, top → bottom
  const rowOf = new Map(order.map((m, i) => [m, i]));
  // A match's leftmost leaf row — used only to order matches within a column
  // so feeders stay grouped. The 3rd-place match has no leaves → sorts last.
  const firstLeafRow = (match: number) => {
    const r = rowOf.get(leaves(match)[0]);
    return r === undefined ? Infinity : r;
  };

  const treeMatches = KNOCKOUT_MATCHES.filter((m) => COL_INDEX[m.round] >= 0);

  // Pack every column's matches one below the other, top-aligned.
  const pos = new Map<number, TreeNode>();
  for (const col of COLUMNS) {
    const x = LEFT_PAD + col * (CARD_W + H_GAP);
    treeMatches
      .filter((m) => COL_INDEX[m.round] === col)
      .sort((a, b) => firstLeafRow(a.match) - firstLeafRow(b.match))
      .forEach((m, i) => {
        const extra = m.round === "3RD" ? THIRD_GAP : 0;
        const y = HEADER_H + i * (CARD_H + V_GAP) + extra;
        pos.set(m.match, {
          match: m.match,
          round: m.round,
          x,
          y,
          cx: x + CARD_W / 2,
          cy: y + CARD_H / 2,
        });
      });
  }

  const nodes = [...pos.values()];

  // Smooth curves from each child's right edge to its parent's left edge.
  const connectors: string[] = [];
  for (const m of treeMatches) {
    const parent = pos.get(m.match)!;
    for (const childNum of childMatches(m)) {
      const child = pos.get(childNum)!;
      const x1 = child.x + CARD_W;
      const y1 = child.cy;
      const x2 = parent.x;
      const y2 = parent.cy;
      const midX = (x1 + x2) / 2;
      connectors.push(`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
    }
  }

  const tallest = Math.max(
    ...COLUMNS.map((c) => treeMatches.filter((m) => COL_INDEX[m.round] === c).length)
  );
  const width = LEFT_PAD + 5 * CARD_W + 4 * H_GAP;
  const height = HEADER_H + tallest * (CARD_H + V_GAP) - V_GAP + THIRD_GAP;

  return { nodes, connectors, width, height };
}

export const TREE_LAYOUT = build();

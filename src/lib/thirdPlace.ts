import type { GroupId } from "../types";
import { THIRD_PLACE_SLOTS } from "../data/knockout";

/**
 * Assign the 8 qualifying third-placed groups to the 8 "third" knockout slots,
 * respecting each slot's allowed-groups constraint.
 *
 * Returns a map of slot match number → GroupId, or null if no valid assignment
 * exists (which shouldn't happen for a valid set of exactly 8 groups).
 *
 * Uses most-constrained-first backtracking so forced placements (e.g. a group
 * that only fits one slot) resolve first.
 */
export function assignThirdPlaces(
  qualified: GroupId[]
): Record<number, GroupId> | null {
  if (qualified.length !== 8) return null;

  const slots = THIRD_PLACE_SLOTS.map((s) => ({
    match: s.match,
    candidates: s.allowed.filter((g) => qualified.includes(g)),
  }));

  const used = new Set<GroupId>();
  const result: Record<number, GroupId> = {};

  function solve(remaining: typeof slots): boolean {
    if (remaining.length === 0) return used.size === 8;

    // Pick the slot with the fewest still-available candidates.
    let bestIdx = 0;
    let bestOpen = Infinity;
    remaining.forEach((slot, i) => {
      const open = slot.candidates.filter((g) => !used.has(g)).length;
      if (open < bestOpen) {
        bestOpen = open;
        bestIdx = i;
      }
    });

    const slot = remaining[bestIdx];
    const rest = remaining.filter((_, i) => i !== bestIdx);
    const options = slot.candidates.filter((g) => !used.has(g));

    for (const group of options) {
      used.add(group);
      result[slot.match] = group;
      if (solve(rest)) return true;
      used.delete(group);
      delete result[slot.match];
    }
    return false;
  }

  return solve(slots) ? result : null;
}

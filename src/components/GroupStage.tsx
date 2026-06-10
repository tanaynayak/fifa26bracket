import { GROUPS } from "../data/teams";
import type { GroupId } from "../types";
import type { Standings } from "../lib/bracket";
import SortableRanking from "./SortableRanking";

interface Props {
  standings: Standings;
  onReorder: (group: GroupId, order: string[]) => void;
}

export default function GroupStage({ standings, onReorder }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GROUPS.map((group) => (
        <section
          key={group.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
        >
          <header className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-ink">
              Group {group.id}
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              drag ⠿ to rank
            </span>
          </header>

          <SortableRanking
            order={standings[group.id]}
            onReorder={(order) => onReorder(group.id, order)}
          />

          <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> advance
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> 3rd place
            </span>
          </div>
        </section>
      ))}
    </div>
  );
}

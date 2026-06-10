import { GROUP_IDS, teamById } from "../data/teams";
import type { GroupId } from "../types";
import type { Standings } from "../lib/bracket";
import TeamFlag from "./TeamFlag";

interface Props {
  standings: Standings;
  selected: GroupId[];
  onToggle: (group: GroupId) => void;
  locked?: boolean;
}

export default function ThirdPlaceStage({
  standings,
  selected,
  onToggle,
  locked,
}: Props) {
  const full = selected.length >= 8;

  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-1 text-center">
        <p className="max-w-md text-sm text-slate-500">
          Eight of the twelve third-placed teams advance to the Round of 32.
          Pick the eight you think make it through.
        </p>
        <span
          className={`mt-1 rounded-full px-3.5 py-1 font-display text-base font-bold uppercase tracking-wide ${
            full ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {selected.length} / 8 selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GROUP_IDS.map((g) => {
          const teamId = standings[g][2];
          const team = teamById(teamId)!;
          const isSelected = selected.includes(g);
          const disabled = locked || (!isSelected && full);
          return (
            <button
              key={g}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(g)}
              className={[
                "relative flex items-center gap-3 rounded-xl p-3 text-left transition",
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-600"
                  : disabled
                    ? "cursor-not-allowed bg-white text-slate-300 ring-1 ring-slate-100"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300",
              ].join(" ")}
            >
              <TeamFlag flag={team.flag} size={30} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {team.name}
                </span>
                <span
                  className={`block text-xs ${isSelected ? "text-emerald-100" : "text-slate-400"}`}
                >
                  3rd · Group {g}
                </span>
              </span>
              <span
                className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isSelected ? "bg-white text-emerald-600" : "border border-slate-200 text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

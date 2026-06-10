import { useRef, useState } from "react";
import { teamById } from "../data/teams";
import TeamFlag from "./TeamFlag";

interface Props {
  order: string[];
  onReorder: (order: string[]) => void;
}

const POS_STYLES = [
  "bg-emerald-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-400 text-amber-950",
  "bg-slate-300 text-slate-600",
];

const ROW_TINT = [
  "bg-emerald-50/80",
  "bg-emerald-50/80",
  "bg-amber-50/80",
  "bg-slate-50",
];

function move(arr: string[], from: number, to: number) {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

interface DragState {
  from: number;
  to: number;
  dy: number;
  startY: number;
  step: number;
}

/** Pointer-based sortable list — works with both mouse and touch. */
export default function SortableRanking({ order, onReorder }: Props) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);

  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n));

  const onPointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rows = itemRefs.current;
    const a = rows[0]?.getBoundingClientRect();
    const b = rows[1]?.getBoundingClientRect();
    const step = a && b ? b.top - a.top : a ? a.height + 6 : 56;
    setDrag({ from: index, to: index, dy: 0, startY: e.clientY, step });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const to = clamp(drag.from + Math.round(dy / drag.step), 0, order.length - 1);
    setDrag({ ...drag, dy, to });
  };

  const onPointerUp = () => {
    if (!drag) return;
    if (drag.to !== drag.from) onReorder(move(order, drag.from, drag.to));
    setDrag(null);
  };

  // Visual offset applied to each row while a drag is in progress.
  const offsetFor = (i: number): number => {
    if (!drag) return 0;
    if (i === drag.from) return drag.dy;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -drag.step;
    if (drag.from > drag.to && i < drag.from && i >= drag.to) return drag.step;
    return 0;
  };

  return (
    <ul className="relative space-y-1.5">
      {order.map((teamId, idx) => {
        const team = teamById(teamId)!;
        const dragging = drag?.from === idx;
        return (
          <li
            key={teamId}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            style={{
              transform: `translateY(${offsetFor(idx)}px)`,
              transition: dragging ? "none" : "transform 160ms ease",
              zIndex: dragging ? 10 : 1,
            }}
            className={`relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${ROW_TINT[idx]} ${
              dragging ? "shadow-lg ring-2 ring-emerald-300" : ""
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${POS_STYLES[idx]}`}
            >
              {idx + 1}
            </span>
            <TeamFlag flag={team.flag} size={26} />
            <span className="flex-1 truncate text-sm font-semibold text-slate-700">
              {team.name}
            </span>
            <button
              type="button"
              aria-label={`Drag ${team.name} to reorder`}
              onPointerDown={(e) => onPointerDown(idx, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: "none" }}
              className="flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-emerald-600 active:cursor-grabbing"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <circle cx="5" cy="3" r="1.4" />
                <circle cx="11" cy="3" r="1.4" />
                <circle cx="5" cy="8" r="1.4" />
                <circle cx="11" cy="8" r="1.4" />
                <circle cx="5" cy="13" r="1.4" />
                <circle cx="11" cy="13" r="1.4" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

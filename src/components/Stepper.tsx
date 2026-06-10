interface Props {
  step: number;
  onJump: (step: number) => void;
  canAccess: (step: number) => boolean;
}

const STEPS = [
  { n: 1, label: "Group stage" },
  { n: 2, label: "Best 3rd-placed" },
  { n: 3, label: "Knockout" },
];

export default function Stepper({ step, onJump, canAccess }: Props) {
  return (
    <nav className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        const accessible = canAccess(s.n);
        return (
          <div key={s.n} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!accessible}
              onClick={() => accessible && onJump(s.n)}
              className={[
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-base font-semibold uppercase tracking-wide transition",
                active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : done
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : accessible
                      ? "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      : "cursor-not-allowed bg-white/60 text-slate-300 ring-1 ring-slate-100",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  active
                    ? "bg-white/20"
                    : done
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {done ? "✓" : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="h-px w-4 bg-slate-300 sm:w-8" aria-hidden />
            )}
          </div>
        );
      })}
    </nav>
  );
}

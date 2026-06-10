import { forwardRef } from "react";
import type { Team } from "../types";
import type { BracketState } from "../lib/bracketState";
import { computeBracket, summarize } from "../lib/bracketState";
import { teamById } from "../data/teams";
import BrandMark from "./BrandMark";

interface Props {
  state: BracketState;
  userName: string;
}

const flagUrl = (flag: string) => `https://flagcdn.com/w160/${flag}.png`;
const Flag = ({ flag, className }: { flag: string; className?: string }) => (
  <img
    src={flagUrl(flag)}
    crossOrigin="anonymous"
    alt=""
    className={`rounded-[3px] object-cover ${className ?? ""}`}
  />
);

function toTeams(ids: Array<string | null | undefined>): Team[] {
  return ids.map((id) => (id ? teamById(id) : null)).filter((t): t is Team => !!t);
}

function TeamPill({
  team,
  label,
  accent = "slate",
}: {
  team: Team;
  label: string;
  accent?: "gold" | "green" | "slate";
}) {
  const accentClass =
    accent === "gold"
      ? "bg-gold text-ink"
      : accent === "green"
        ? "bg-emerald-500 text-white"
        : "bg-white/15 text-white";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg bg-white/[0.08] p-2.5 ring-1 ring-white/10">
      <div className={`w-16 shrink-0 rounded-md px-2 py-1 text-center text-[10px] font-black uppercase ${accentClass}`}>
        {label}
      </div>
      <Flag flag={team.flag} className="h-9 w-12 shrink-0 ring-1 ring-white/25" />
      <div className="min-w-0 font-display text-2xl font-bold uppercase leading-none tracking-wide">
        {team.name}
      </div>
    </div>
  );
}

/**
 * The shareable infographic — a fixed 540×960 portrait card snapshotted to PNG.
 * Rendered with inline styles + Tailwind so html-to-image captures it cleanly.
 */
const ShareCard = forwardRef<HTMLDivElement, Props>(({ state, userName }, ref) => {
  const sum = summarize(state);
  const bracket = computeBracket(state);
  const champ = sum.champion ? teamById(sum.champion) : null;
  const runner = sum.runnerUp ? teamById(sum.runnerUp) : null;
  const semis = toTeams(sum.semifinalists);
  const quarters = toTeams(
    [97, 98, 99, 100].flatMap((m) => [
      bracket.results[m]?.home,
      bracket.results[m]?.away,
    ])
  );

  return (
    <div
      ref={ref}
      style={{ width: 540, height: 960 }}
      className="relative overflow-hidden text-white"
    >
      {/* base + shards */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#07131f 0%,#0d243a 55%,#0a1b2e 100%)" }} />
      <div className="absolute inset-0" style={{ clipPath: "polygon(0 0,40% 0,0 26%)", background: "linear-gradient(135deg,#1ba14e,#0c6c35)", opacity: 0.85 }} />
      <div className="absolute inset-0" style={{ clipPath: "polygon(100% 0,60% 0,100% 24%)", background: "linear-gradient(140deg,#3b82f6,#1d44c0)", opacity: 0.75 }} />
      <div className="absolute inset-0" style={{ clipPath: "polygon(100% 100%,66% 100%,100% 72%)", background: "linear-gradient(135deg,#f8cf57,#f3ad1d)", opacity: 0.62 }} />
      <div className="absolute inset-0" style={{ clipPath: "polygon(0 100%,38% 100%,0 76%)", background: "#d1192e", opacity: 0.5 }} />

      {/* content */}
      <div className="absolute inset-6 rounded-[18px] border-2 border-white/18" />
      <div className="absolute inset-[34px] rounded-xl border border-gold/30" />

      <div className="relative flex h-full flex-col px-8 py-8">
        <div className="flex items-center gap-4">
          <BrandMark size={76} className="shrink-0" />
          <div>
            <div className="font-display text-[32px] font-bold uppercase leading-none tracking-wide">
              World Cup 26 Bracket
            </div>
            <div className="mt-1 text-base font-semibold text-slate-300">
              {userName ? `${userName}'s prediction` : "My prediction"}
            </div>
          </div>
        </div>

        {/* champion hero */}
        <div className="mt-7 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-gold px-6 py-2 font-display text-xl font-bold uppercase tracking-[0.18em] text-ink shadow-lg">
            Champion
          </div>
          {champ ? (
            <>
              <div className="rounded-[18px] bg-white/12 p-3 shadow-2xl ring-2 ring-white/25">
                <Flag flag={champ.flag} className="h-[172px] w-[246px] ring-2 ring-white/40" />
              </div>
              <div className="mt-4 max-w-full truncate font-display text-[64px] font-bold uppercase leading-none tracking-wide">
                {champ.name}
              </div>
            </>
          ) : (
            <div className="my-20 font-display text-4xl font-bold uppercase text-slate-500">
              Not picked yet
            </div>
          )}
        </div>

        {/* the final */}
        <div className="mt-6 rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10">
          <div className="mb-2 text-center text-xs font-black uppercase tracking-[0.26em] text-gold">
            Final
          </div>
          {champ && runner ? (
            <div className="flex flex-col gap-2">
              <TeamPill team={champ} label="Winner" accent="gold" />
              <TeamPill team={runner} label="Runner" />
            </div>
          ) : (
            <div className="py-3 text-center text-sm font-semibold text-slate-400">
              Complete the final to fill this section.
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* semi-finalists */}
          <section className="rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <div className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
              Final four
            </div>
            {semis.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {semis.map((t) => (
                  <div key={t.id} className="flex flex-col items-center gap-1.5 rounded-lg bg-white/10 px-2 py-2">
                    <Flag flag={t.flag} className="h-8 w-11 ring-1 ring-white/20" />
                    <span className="max-w-[78px] truncate text-center text-xs font-bold">
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[74px] rounded-lg border border-dashed border-white/15" />
            )}
          </section>

          {/* quarter-finalists */}
          <section className="rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <div className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
              Quarter-finalists
            </div>
            {quarters.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {quarters.map((t) => (
                  <div key={t.id} className="rounded-md bg-white/10 p-1.5">
                    <Flag flag={t.flag} className="h-6 w-9 ring-1 ring-white/20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[74px] rounded-lg border border-dashed border-white/15" />
            )}
          </section>
        </div>

        <div className="mt-auto pt-5 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
          Build yours · World Cup 26 Bracket
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";
export default ShareCard;

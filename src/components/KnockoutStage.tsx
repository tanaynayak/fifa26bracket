import { useEffect, useRef, useState } from "react";
import { KNOCKOUT_MATCHES, ROUND_LABELS } from "../data/knockout";
import type { KnockoutMatch, SlotRef } from "../types";
import { teamById } from "../data/teams";
import type { Bracket } from "../lib/bracket";
import {
  TREE_LAYOUT,
  COL_INDEX,
  CARD_W,
  CARD_H,
  HEADER_H,
  H_GAP,
  LEFT_PAD,
} from "../lib/treeLayout";
import TeamFlag from "./TeamFlag";

interface Props {
  bracket: Bracket;
  onPick: (match: number, teamId: string) => void;
  /** read-only display (e.g. viewing a friend's bracket) */
  readOnly?: boolean;
  /** show a Share button in the banner (own bracket only) */
  onShare?: () => void;
}

const COLUMN_ORDER: KnockoutMatch["round"][] = ["R32", "R16", "QF", "SF", "F"];
const COL_LABELS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semis & 3rd place",
  "Final",
];

const matchOf = (n: number) => KNOCKOUT_MATCHES.find((m) => m.match === n)!;

function slotLabel(ref: SlotRef): string {
  switch (ref.kind) {
    case "winner":
      return `Winner Group ${ref.group}`;
    case "runnerUp":
      return `Runner-up Group ${ref.group}`;
    case "third":
      return "Best 3rd place";
    case "matchWinner":
      return `Winner M${ref.match}`;
    case "matchLoser":
      return `Loser M${ref.match}`;
  }
}

function TeamSlot({
  teamId,
  fallback,
  state,
  onClick,
}: {
  teamId: string | null;
  fallback: string;
  state: "winner" | "loser" | "neutral";
  onClick?: () => void;
}) {
  const team = teamId ? teamById(teamId) : null;
  const clickable = !!team && !!onClick;
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition",
        state === "winner"
          ? "bg-emerald-600 text-white"
          : state === "loser"
            ? "text-slate-400 line-through decoration-slate-300"
            : team
              ? "text-slate-700 hover:bg-emerald-50"
              : "text-slate-300",
      ].join(" ")}
    >
      {team ? (
        <TeamFlag flag={team.flag} size={24} />
      ) : (
        <span className="h-[18px] w-[24px] shrink-0 rounded-[2px] bg-slate-100 ring-1 ring-slate-200" />
      )}
      <span className="flex-1 truncate text-sm font-semibold">
        {team ? team.name : fallback}
      </span>
    </button>
  );
}

function MatchCard({
  match,
  bracket,
  onPick,
  style,
  label,
  readOnly,
}: {
  match: KnockoutMatch;
  bracket: Bracket;
  onPick: (match: number, teamId: string) => void;
  style?: React.CSSProperties;
  label: string;
  readOnly?: boolean;
}) {
  const r = bracket.results[match.match];
  const decided = !!r.winner;
  const stateFor = (teamId: string | null): "winner" | "loser" | "neutral" => {
    if (!r.winner || !teamId) return "neutral";
    return teamId === r.winner ? "winner" : "loser";
  };
  const pick = readOnly ? undefined : onPick;
  return (
    <div
      style={style}
      className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80"
    >
      <div
        className={[
          "flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
          decided ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400",
        ].join(" ")}
      >
        <span>{label}</span>
        {decided && <span aria-hidden>✓</span>}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-0.5 p-1">
        <TeamSlot
          teamId={r.home}
          fallback={slotLabel(match.home)}
          state={stateFor(r.home)}
          onClick={pick && r.home ? () => pick(match.match, r.home!) : undefined}
        />
        <TeamSlot
          teamId={r.away}
          fallback={slotLabel(match.away)}
          state={stateFor(r.away)}
          onClick={pick && r.away ? () => pick(match.match, r.away!) : undefined}
        />
      </div>
    </div>
  );
}

const cardLabel = (round: KnockoutMatch["round"], match: number) =>
  round === "3RD" ? "3rd-place" : `Match ${match}`;

export default function KnockoutStage({ bracket, onPick, readOnly, onShare }: Props) {
  const champion = bracket.champion ? teamById(bracket.champion) : null;
  const { nodes, width, height } = TREE_LAYOUT;
  // Group nodes into columns for the mobile one-screen-per-round view.
  const mobileColumns = [0, 1, 2, 3, 4].map((col) =>
    nodes.filter((n) => COL_INDEX[n.round] === col).sort((a, b) => a.y - b.y)
  );

  // Scale the desktop bracket to fit the available width — full size when there
  // is room, shrunk to fit otherwise, so it never needs horizontal scrolling.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div>
      {/* Champion banner */}
      <div
        className={[
          "mb-5 flex items-center gap-3 rounded-2xl px-4 py-4 transition",
          champion
            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-sm"
            : "bg-white text-slate-400 ring-1 ring-slate-200",
        ].join(" ")}
      >
        {champion ? (
          <>
            <span className="text-2xl">🏆</span>
            <div className="text-left">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Your World Champion
              </div>
              <div className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-wide">
                <TeamFlag flag={champion.flag} size={26} />
                {champion.name}
              </div>
            </div>
          </>
        ) : (
          <span className="flex-1 text-center text-sm font-medium">
            🏆 Pick winners through to the Final to crown a champion
          </span>
        )}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className={[
              "ml-auto flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition hover:brightness-105",
              champion
                ? "bg-ink text-white"
                : "bg-gradient-to-r from-gold to-amber-500 text-ink",
            ].join(" ")}
          >
            <span aria-hidden>↗</span> Share
          </button>
        )}
      </div>

      <p className="mb-2 text-center text-xs font-medium text-slate-400 sm:hidden">
        Swipe to the next round →
      </p>

      {/* Mobile: one round per screen, snap-scrolling between rounds */}
      <div className="scroll-slim flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:hidden">
        {mobileColumns.map((colNodes, col) => (
          <section key={col} className="w-full shrink-0 snap-center px-0.5">
            <h4 className="mb-2 text-center font-display text-base font-bold uppercase tracking-wider text-emerald-700">
              {COL_LABELS[col]}
            </h4>
            <div className="space-y-2.5">
              {colNodes.map((n) => (
                <MatchCard
                  key={n.match}
                  match={matchOf(n.match)}
                  bracket={bracket}
                  onPick={onPick}
                  readOnly={readOnly}
                  label={cardLabel(n.round, n.match)}
                  style={{ width: "100%" }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Desktop: rounds as columns, auto-fit to the available width */}
      <div ref={wrapRef} className="hidden pb-3 sm:block">
        <div style={{ height: height * scale }}>
        <div
          className="relative"
          style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {/* Round headers */}
          {COLUMN_ORDER.map((round, col) => (
            <div
              key={round}
              className="absolute text-center font-display text-sm font-bold uppercase tracking-wider text-emerald-700"
              style={{
                left: LEFT_PAD + col * (CARD_W + H_GAP),
                top: 0,
                width: CARD_W,
                height: HEADER_H,
              }}
            >
              {ROUND_LABELS[round]}
            </div>
          ))}

          {/* Match cards */}
          {nodes.map((n) => (
            <MatchCard
              key={n.match}
              match={matchOf(n.match)}
              bracket={bracket}
              onPick={onPick}
              readOnly={readOnly}
              label={cardLabel(n.round, n.match)}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: CARD_W,
                height: CARD_H,
              }}
            />
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

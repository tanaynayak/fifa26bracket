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
type DesktopView = "match" | "bracket";

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

// Mirrored desktop bracket: 16 teams on each side, winner paths converge into
// the center final. The third-place match is kept centered below the final.
const BRACKET_CARD_W = 152;
const BRACKET_CARD_H = 72;
const BRACKET_H_GAP = 18;
const BRACKET_TOP = 44;
const BRACKET_ROW_STEP = 88;
const BRACKET_COL_STEP = BRACKET_CARD_W + BRACKET_H_GAP;
const BRACKET_WIDTH = BRACKET_CARD_W * 9 + BRACKET_H_GAP * 8;
const BRACKET_HEIGHT = 760;

const BRACKET_LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82];
const BRACKET_RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87];

interface BracketTreeNode {
  match: number;
  side: "left" | "right" | "center";
  x: number;
  y: number;
  cx: number;
  cy: number;
}

function childMatches(match: number): number[] {
  const m = matchOf(match);
  return [m.home, m.away]
    .filter((r) => r.kind === "matchWinner")
    .map((r) => (r as { match: number }).match);
}

function buildBracketTreeNodes(): BracketTreeNode[] {
  const byMatch = new Map<number, BracketTreeNode>();
  const add = (match: number, side: BracketTreeNode["side"], col: number, y: number) => {
    const x = col * BRACKET_COL_STEP;
    byMatch.set(match, {
      match,
      side,
      x,
      y,
      cx: x + BRACKET_CARD_W / 2,
      cy: y + BRACKET_CARD_H / 2,
    });
  };

  BRACKET_LEFT_R32.forEach((match, i) =>
    add(match, "left", 0, BRACKET_TOP + i * BRACKET_ROW_STEP)
  );
  BRACKET_RIGHT_R32.forEach((match, i) =>
    add(match, "right", 8, BRACKET_TOP + i * BRACKET_ROW_STEP)
  );

  const addParent = (
    match: number,
    side: "left" | "right",
    col: number
  ) => {
    const kids = childMatches(match).map((m) => byMatch.get(m)!);
    const y =
      kids.reduce((sum, n) => sum + n.cy, 0) / kids.length - BRACKET_CARD_H / 2;
    add(match, side, col, y);
  };

  [89, 90, 93, 94].forEach((m) => addParent(m, "left", 1));
  [97, 98].forEach((m) => addParent(m, "left", 2));
  addParent(101, "left", 3);

  [91, 92, 95, 96].forEach((m) => addParent(m, "right", 7));
  [99, 100].forEach((m) => addParent(m, "right", 6));
  addParent(102, "right", 5);

  const semis = [byMatch.get(101)!, byMatch.get(102)!];
  add(104, "center", 4, semis.reduce((sum, n) => sum + n.cy, 0) / 2 - BRACKET_CARD_H / 2);
  add(103, "center", 4, byMatch.get(104)!.y + 104);

  return [...byMatch.values()];
}

const BRACKET_TREE_NODES = buildBracketTreeNodes();
const BRACKET_TREE_NODE_BY_MATCH = new Map(
  BRACKET_TREE_NODES.map((n) => [n.match, n])
);

function connectorPath(parent: BracketTreeNode, child: BracketTreeNode): string {
  const fromRight = child.x < parent.x;
  const x1 = fromRight ? child.x + BRACKET_CARD_W : child.x;
  const x2 = fromRight ? parent.x : parent.x + BRACKET_CARD_W;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${child.cy} H ${mid} V ${parent.cy} H ${x2}`;
}

function bracketConnectorPaths(): string[] {
  const paths: string[] = [];
  for (const parent of BRACKET_TREE_NODES) {
    if (parent.match === 103) continue;
    for (const child of childMatches(parent.match)) {
      const childNode = BRACKET_TREE_NODE_BY_MATCH.get(child);
      if (childNode) paths.push(connectorPath(parent, childNode));
    }
  }
  return paths;
}

const BRACKET_CONNECTORS = bracketConnectorPaths();

function TreeTeamSlot({
  teamId,
  fallback,
  state,
  onClick,
  mirror,
}: {
  teamId: string | null;
  fallback: string;
  state: "winner" | "loser" | "neutral";
  onClick?: () => void;
  mirror?: boolean;
}) {
  const team = teamId ? teamById(teamId) : null;
  const clickable = !!team && !!onClick;
  const flag = team ? <TeamFlag flag={team.flag} size={18} /> : null;
  const label = (
    <span className={`min-w-0 flex-1 truncate text-xs font-semibold ${mirror ? "text-right" : ""}`}>
      {team ? team.name : fallback}
    </span>
  );

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={[
        "flex h-6 w-full items-center gap-1.5 rounded px-1.5 transition",
        state === "winner"
          ? "bg-emerald-600 text-white"
          : state === "loser"
            ? "text-slate-400 line-through decoration-slate-300"
            : team && clickable
              ? "text-slate-700 hover:bg-emerald-50"
              : team
                ? "text-slate-700"
                : "text-slate-300",
      ].join(" ")}
    >
      {mirror ? (
        <>
          {label}
          {flag ?? <span className="h-[14px] w-[18px] shrink-0 rounded-[2px] bg-slate-100 ring-1 ring-slate-200" />}
        </>
      ) : (
        <>
          {flag ?? <span className="h-[14px] w-[18px] shrink-0 rounded-[2px] bg-slate-100 ring-1 ring-slate-200" />}
          {label}
        </>
      )}
    </button>
  );
}

function TreeMatchCard({
  match,
  bracket,
  onPick,
  style,
  readOnly,
  mirror,
}: {
  match: KnockoutMatch;
  bracket: Bracket;
  onPick: (match: number, teamId: string) => void;
  style: React.CSSProperties;
  readOnly?: boolean;
  mirror?: boolean;
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
      className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80"
    >
      <div
        className={[
          "flex h-[18px] items-center justify-between px-2 text-[9px] font-bold uppercase tracking-wider",
          decided ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400",
        ].join(" ")}
      >
        <span>{match.round === "3RD" ? "3rd" : ROUND_LABELS[match.round].replace("Round of ", "R")}</span>
        <span>M{match.match}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-0.5 p-1">
        <TreeTeamSlot
          teamId={r.home}
          fallback={slotLabel(match.home)}
          state={stateFor(r.home)}
          onClick={pick && r.home ? () => pick(match.match, r.home!) : undefined}
          mirror={mirror}
        />
        <TreeTeamSlot
          teamId={r.away}
          fallback={slotLabel(match.away)}
          state={stateFor(r.away)}
          onClick={pick && r.away ? () => pick(match.match, r.away!) : undefined}
          mirror={mirror}
        />
      </div>
    </div>
  );
}

function BracketTreeView({
  bracket,
  onPick,
  readOnly,
}: {
  bracket: Bracket;
  onPick: (match: number, teamId: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div
      className="relative"
      style={{ width: BRACKET_WIDTH, height: BRACKET_HEIGHT }}
    >
      <div
        className="absolute left-0 right-0 top-0 text-center font-display text-sm font-bold uppercase tracking-wider text-emerald-700"
      >
        Bracket view
      </div>
      <svg
        className="pointer-events-none absolute inset-0"
        width={BRACKET_WIDTH}
        height={BRACKET_HEIGHT}
        aria-hidden
      >
        {BRACKET_CONNECTORS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="rgba(22, 122, 65, 0.38)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {BRACKET_TREE_NODES.map((n) => (
        <TreeMatchCard
          key={n.match}
          match={matchOf(n.match)}
          bracket={bracket}
          onPick={onPick}
          readOnly={readOnly}
          mirror={n.side === "right"}
          style={{
            position: "absolute",
            left: n.x,
            top: n.y,
            width: BRACKET_CARD_W,
            height: BRACKET_CARD_H,
          }}
        />
      ))}
    </div>
  );
}

export default function KnockoutStage({ bracket, onPick, readOnly, onShare }: Props) {
  const champion = bracket.champion ? teamById(bracket.champion) : null;
  const [desktopView, setDesktopView] = useState<DesktopView>("match");
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
    const targetWidth = desktopView === "match" ? width : BRACKET_WIDTH;
    const update = () => setScale(Math.min(1, el.clientWidth / targetWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [desktopView, width]);

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

      <div className="mb-4 hidden justify-center sm:flex">
        <div className="rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {[
            ["match", "Match view"],
            ["bracket", "Bracket view"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDesktopView(id as DesktopView)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-bold transition",
                desktopView === id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
        <div style={{ height: (desktopView === "match" ? height : BRACKET_HEIGHT) * scale }}>
          {desktopView === "match" ? (
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
          ) : (
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <BracketTreeView bracket={bracket} onPick={onPick} readOnly={readOnly} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

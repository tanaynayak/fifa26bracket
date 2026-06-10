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

function nameSize(name: string, base: number, min: number): number {
  const over = Math.max(0, name.length - 8);
  return Math.max(min, base - over * 2.4);
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
  const labelBg = accent === "gold" ? "#f4b323" : accent === "green" ? "#1f8f4f" : "rgba(255,255,255,0.16)";
  const labelColor = accent === "gold" ? "#0a1b2e" : "#ffffff";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        height: 58,
        padding: "8px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.08)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 74,
          flexShrink: 0,
          borderRadius: 8,
          padding: "7px 0",
          textAlign: "center",
          background: labelBg,
          color: labelColor,
          fontSize: 11,
          fontWeight: 900,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <Flag flag={team.flag} className="h-9 w-12 shrink-0 ring-1 ring-white/25" />
      <div
        style={{
          minWidth: 0,
          flex: 1,
          overflow: "hidden",
          color: "#ffffff",
          fontFamily: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
          fontSize: nameSize(team.name, 31, 22),
          fontWeight: 800,
          lineHeight: 1,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {team.name}
      </div>
    </div>
  );
}

function SmallTeam({ team }: { team: Team }) {
  return (
    <div
      style={{
        height: 78,
        borderRadius: 10,
        background: "rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "8px 6px",
        boxSizing: "border-box",
      }}
    >
      <Flag flag={team.flag} className="h-7 w-10 ring-1 ring-white/20" />
      <div
        style={{
          maxWidth: "100%",
          color: "#ffffff",
          fontSize: nameSize(team.name, 14, 10),
          fontWeight: 800,
          lineHeight: 1.05,
          textAlign: "center",
          whiteSpace: "normal",
        }}
      >
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
  const championFont = champ ? nameSize(champ.name, 66, 46) : 38;

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        height: 960,
        position: "relative",
        overflow: "hidden",
        color: "#ffffff",
        fontFamily: '"Barlow", Arial, sans-serif',
        background: "#0a1b2e",
      }}
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

      <div
        style={{
          position: "relative",
          height: "100%",
          padding: "32px 36px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, height: 96 }}>
          <BrandMark size={66} className="shrink-0" />
          <div style={{ paddingTop: 5, minWidth: 0 }}>
            <div
              style={{
                fontFamily: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
                fontSize: 38,
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              <div>World Cup 26</div>
              <div>Bracket</div>
            </div>
            <div
              style={{
                marginTop: 8,
                color: "#cbd5e1",
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              {userName ? `${userName}'s prediction` : "My prediction"}
            </div>
          </div>
        </div>

        {/* champion hero */}
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              marginBottom: 16,
              borderRadius: 999,
              background: "#f4b323",
              padding: "10px 30px",
              color: "#0a1b2e",
              fontFamily: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 7,
              lineHeight: 1,
              textTransform: "uppercase",
              boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
            }}
          >
            Champion
          </div>
          {champ ? (
            <>
              <div
                style={{
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.12)",
                  padding: 12,
                  boxShadow: "0 20px 38px rgba(0,0,0,0.32), inset 0 0 0 2px rgba(255,255,255,0.22)",
                }}
              >
                <Flag flag={champ.flag} className="h-[158px] w-[226px] ring-2 ring-white/40" />
              </div>
              <div
                style={{
                  marginTop: 15,
                  width: "100%",
                  color: "#ffffff",
                  fontFamily: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
                  fontSize: championFont,
                  fontWeight: 800,
                  lineHeight: 0.95,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textAlign: "center",
                  whiteSpace: "normal",
                }}
              >
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
        <div
          style={{
            marginTop: 22,
            borderRadius: 14,
            background: "rgba(255,255,255,0.07)",
            padding: 12,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              marginBottom: 10,
              color: "#f4b323",
              fontSize: 13,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: 8,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            Final
          </div>
          {champ && runner ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <TeamPill team={champ} label="Winner" accent="gold" />
              <TeamPill team={runner} label="Runner" />
            </div>
          ) : (
            <div className="py-3 text-center text-sm font-semibold text-slate-400">
              Complete the final to fill this section.
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          {/* semi-finalists */}
          <section style={{ borderRadius: 14, background: "rgba(255,255,255,0.07)", padding: 12, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
            <div
              style={{
                marginBottom: 12,
                color: "#cbd5e1",
                fontSize: 12,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: 6,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              Final four
            </div>
            {semis.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {semis.map((t) => (
                  <SmallTeam key={t.id} team={t} />
                ))}
              </div>
            ) : (
              <div className="h-[74px] rounded-lg border border-dashed border-white/15" />
            )}
          </section>

          {/* quarter-finalists */}
          <section style={{ borderRadius: 14, background: "rgba(255,255,255,0.07)", padding: 12, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
            <div
              style={{
                marginBottom: 12,
                color: "#cbd5e1",
                fontSize: 12,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: 4,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              Quarter-finalists
            </div>
            {quarters.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
                {quarters.map((t) => (
                  <div key={t.id} className="rounded-md bg-white/10 p-1.5" style={{ display: "flex", justifyContent: "center" }}>
                    <Flag flag={t.flag} className="h-6 w-9 ring-1 ring-white/20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[74px] rounded-lg border border-dashed border-white/15" />
            )}
          </section>
        </div>

        <div
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            bottom: 25,
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 7,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Build yours · World Cup 26 Bracket
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";
export default ShareCard;

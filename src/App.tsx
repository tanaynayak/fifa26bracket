import { useEffect, useMemo, useRef, useState } from "react";
import type { GroupId } from "./types";
import type { Picks, Standings } from "./lib/bracket";
import {
  computeBracket,
  defaultStandings,
  normalizeState,
  type BracketState,
} from "./lib/bracketState";
import { useAuth } from "./lib/auth";
import { getMyBracket, saveMyBracket } from "./lib/cloud";
import { PREDICTION_LOCK_LABEL, predictionsLocked } from "./lib/lock";
import Stepper from "./components/Stepper";
import TeamFlag from "./components/TeamFlag";
import BrandMark from "./components/BrandMark";
import AuthButton from "./components/AuthButton";
import LockCountdown from "./components/LockCountdown";
import PitchBackground from "./components/PitchBackground";
import GroupStage from "./components/GroupStage";
import ThirdPlaceStage from "./components/ThirdPlaceStage";
import KnockoutStage from "./components/KnockoutStage";
import LeaguesModal from "./components/LeaguesModal";
import ShareModal from "./components/ShareModal";

const STORAGE_KEY = "wc26-bracket-v1";

function loadLocal(): { state: BracketState; step: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { state: normalizeState(parsed), step: parsed.step ?? 1 };
    }
  } catch {
    /* fall through to defaults */
  }
  return { state: normalizeState(null), step: 1 };
}

/**
 * Asymmetric triangular color shards anchored in the header corners — different
 * sizes on purpose, so it feels dynamic rather than balanced.
 */
const HEADER_SHARDS: { clip: string; bg: string; opacity: number }[] = [
  // big green wedge, bottom-left
  { clip: "polygon(0 100%, 0 34%, 48% 100%)", bg: "linear-gradient(135deg,#1ba14e,#0c6c35)", opacity: 0.72 },
  // tall blue wedge, top-right
  { clip: "polygon(100% 0, 55% 0, 100% 70%)", bg: "linear-gradient(140deg,#3b82f6,#1d44c0)", opacity: 0.6 },
  // small gold sliver overlapping the blue, top-right
  { clip: "polygon(100% 0, 81% 0, 100% 32%)", bg: "linear-gradient(135deg,#f8cf57,#f3ad1d)", opacity: 0.9 },
  // thin red flick, bottom-right
  { clip: "polygon(100% 100%, 72% 100%, 100% 52%)", bg: "#d1192e", opacity: 0.55 },
  // tiny teal nick, top-left corner
  { clip: "polygon(0 0, 14% 0, 0 46%)", bg: "linear-gradient(135deg,#15b5a6,#0d7c70)", opacity: 0.5 },
];

const STEP_TITLES = [
  "Predict the group stage",
  "Choose the 8 best third-placed teams",
  "Build your knockout bracket",
];

export default function App() {
  const initial = useMemo(loadLocal, []);
  const [step, setStep] = useState(initial.step);
  const [standings, setStandings] = useState<Standings>(initial.state.standings);
  const [thirdQualifiers, setThirdQualifiers] = useState<GroupId[]>(
    initial.state.thirdQualifiers
  );
  const [picks, setPicks] = useState<Picks>(initial.state.picks);

  const { user } = useAuth();
  const userName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email ? user.email.split("@")[0] : "");

  const [leaguesOpen, setLeaguesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [predictionsAreLocked, setPredictionsAreLocked] = useState(() =>
    predictionsLocked()
  );

  // Measure the fixed header so the pitch background can start beneath it.
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const state: BracketState = useMemo(
    () => ({ standings, thirdQualifiers, picks }),
    [standings, thirdQualifiers, picks]
  );
  const bracket = useMemo(() => computeBracket(state), [state]);

  // Always keep a local copy (guest mode + offline cache).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, step }));
  }, [state, step]);

  // On sign-in: load the cloud bracket if present, else seed it from local.
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const cloud = await getMyBracket();
      if (!active) return;
      if (cloud) {
        setStandings(cloud.standings);
        setThirdQualifiers(cloud.thirdQualifiers);
        setPicks(cloud.picks);
      } else if (!predictionsLocked()) {
        await saveMyBracket(stateRef.current);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Debounced cloud autosave while signed in.
  useEffect(() => {
    if (!user || predictionsAreLocked) return;
    const t = setTimeout(() => void saveMyBracket(state), 800);
    return () => clearTimeout(t);
  }, [user?.id, predictionsAreLocked, state]);

  const canAccess = (s: number) => s <= 2 || thirdQualifiers.length === 8;

  const reorder = (group: GroupId, order: string[]) => {
    if (predictionsAreLocked) return;
    setStandings((prev) => ({ ...prev, [group]: order }));
  };

  const toggleThird = (group: GroupId) => {
    if (predictionsAreLocked) return;
    setThirdQualifiers((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : prev.length < 8
          ? [...prev, group]
          : prev
    );
  };

  const pick = (match: number, teamId: string) => {
    if (predictionsAreLocked) return;
    setPicks((prev) =>
      prev[match] === teamId
        ? // tapping the current winner again clears the pick
          Object.fromEntries(Object.entries(prev).filter(([k]) => +k !== match))
        : { ...prev, [match]: teamId }
    );
  };

  const reset = () => {
    if (predictionsAreLocked) return;
    if (!confirm("Clear your whole bracket and start over?")) return;
    setStandings(defaultStandings());
    setThirdQualifiers([]);
    setPicks({});
    setStep(1);
  };

  return (
    <div className="min-h-full">
      <PitchBackground top={headerH} />
      {/* Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-20 text-white shadow-lg shadow-ink/20"
      >
        {/* multicolor accent stripe — a nod to the "We Are 26" identity */}
        <div className="h-1 w-full bg-gradient-to-r from-flame via-gold to-azure" />
        <div className="app-header relative overflow-hidden">
          {/* asymmetric geometric shards */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {HEADER_SHARDS.map((s, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{ clipPath: s.clip, background: s.bg, opacity: s.opacity }}
              />
            ))}
          </div>
          <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3.5">
              <BrandMark size={56} />
              <div className="leading-tight">
                <div className="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
                  World Cup&nbsp;26 Bracket
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 sm:text-sm">
                  <TeamFlag flag="ca" size={16} />
                  <TeamFlag flag="mx" size={16} />
                  <TeamFlag flag="us" size={16} />
                  <span className="ml-0.5">Canada · Mexico · USA</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={predictionsAreLocked}
                onClick={reset}
                title={
                  predictionsAreLocked
                    ? `Predictions locked ${PREDICTION_LOCK_LABEL}`
                    : "Reset bracket"
                }
                className="hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:block"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setLeaguesOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/20"
              >
                <span aria-hidden>🛡️</span>
                <span className="hidden sm:inline">Leagues</span>
              </button>
              <AuthButton />
            </div>
          </div>
          <div className="relative z-10 mx-auto flex max-w-7xl justify-end px-4 pb-3 sm:px-6">
            <LockCountdown onLockChange={setPredictionsAreLocked} />
          </div>
          <div className="relative z-10 border-t border-white/10 py-2.5">
            <Stepper step={step} onJump={setStep} canAccess={canAccess} />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h2 className="mb-5 text-center font-display text-2xl font-bold uppercase tracking-wide text-ink sm:text-3xl">
          {STEP_TITLES[step - 1]}
        </h2>

        {step === 1 && (
          <GroupStage
            standings={standings}
            onReorder={reorder}
            locked={predictionsAreLocked}
          />
        )}
        {step === 2 && (
          <ThirdPlaceStage
            standings={standings}
            selected={thirdQualifiers}
            onToggle={toggleThird}
            locked={predictionsAreLocked}
          />
        )}
        {step === 3 && (
          <KnockoutStage
            bracket={bracket}
            onPick={pick}
            readOnly={predictionsAreLocked}
            onShare={() => setShareOpen(true)}
          />
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 disabled:invisible"
          >
            ← Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 2 && !canAccess(3)}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-xl bg-gradient-to-r from-pitch to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              {step === 2 ? "Build bracket →" : "Continue →"}
            </button>
          ) : null}
        </div>
      </main>

      <LeaguesModal
        open={leaguesOpen}
        onClose={() => setLeaguesOpen(false)}
        locked={predictionsAreLocked}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        state={state}
        userName={userName}
      />

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-8 text-center text-[11px] text-slate-400 sm:px-6">
        Group draw &amp; knockout structure per the official 2026 World Cup
        bracket. Third-placed slotting follows the allowed-group rules.
      </footer>
    </div>
  );
}

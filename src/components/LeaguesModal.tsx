import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  createLeague,
  joinLeague,
  leagueMembers,
  myLeagues,
  type League,
  type LeagueMemberView,
} from "../lib/cloud";
import { computeBracket, summarize, type BracketState } from "../lib/bracketState";
import { GROUPS, GROUP_IDS, teamById } from "../data/teams";
import Modal from "./Modal";
import TeamFlag from "./TeamFlag";
import KnockoutStage from "./KnockoutStage";

type ViewerTab = "groups" | "third" | "knockout";

interface Props {
  open: boolean;
  onClose: () => void;
  currentBracket: BracketState;
  locked?: boolean;
}

export default function LeaguesModal({
  open,
  onClose,
  currentBracket,
  locked,
}: Props) {
  const { user, signInWithGoogle } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [active, setActive] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMemberView[]>([]);
  const [viewing, setViewing] = useState<LeagueMemberView | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLeagues = async () => setLeagues(await myLeagues());

  useEffect(() => {
    if (open && user) refreshLeagues();
    if (!open) {
      setActive(null);
      setViewing(null);
      setError(null);
    }
  }, [open, user]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const refreshMembers = async () => {
      const next = await leagueMembers(active.id);
      if (!cancelled) setMembers(next);
    };
    void refreshMembers();
    const id = window.setInterval(refreshMembers, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active]);

  const handleCreate = async () => {
    if (locked) {
      setError("Leagues are locked.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const league = await createLeague(name);
      setName("");
      await refreshLeagues();
      setActive(league);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create league");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (locked) {
      setError("Leagues are locked.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const league = await joinLeague(code);
      setCode("");
      await refreshLeagues();
      setActive(league);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join league");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={active ? active.name : "Leagues"}>
        {!user ? (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm text-slate-500">
              Sign in to create leagues, share a code with friends, and compare
              brackets.
            </p>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="rounded-xl bg-gradient-to-r from-pitch to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              Sign in to continue
            </button>
          </div>
        ) : active ? (
          <LeagueDetail
            league={active}
            members={members}
            currentUserId={user.id}
            currentBracket={currentBracket}
            onBack={() => setActive(null)}
            onViewMember={setViewing}
          />
        ) : (
          <div className="space-y-6">
            {/* My leagues */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                My leagues
              </h4>
              {leagues.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You're not in any leagues yet — create one or join with a code.
                </p>
              ) : (
                <ul className="space-y-2">
                  {leagues.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setActive(l)}
                        className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-emerald-50"
                      >
                        <span className="font-semibold text-slate-700">{l.name}</span>
                        <span className="font-display text-sm font-bold tracking-widest text-emerald-700">
                          {l.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Create + Join */}
            {locked && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                League creation and joining are locked.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 text-sm font-bold text-ink">Create a league</h4>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={locked}
                  placeholder="League name"
                  className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="button"
                  disabled={locked || busy || !name.trim()}
                  onClick={handleCreate}
                  className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  Create
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 text-sm font-bold text-ink">Join with a code</h4>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={locked}
                  placeholder="e.g. 7KQ2M9"
                  maxLength={6}
                  className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-display font-bold tracking-widest focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="button"
                  disabled={locked || busy || code.trim().length < 4}
                  onClick={handleJoin}
                  className="w-full rounded-lg bg-ink py-2 text-sm font-bold text-white transition hover:bg-ink-700 disabled:bg-slate-300"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Friend's bracket viewer */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        wide
        title={`${viewing?.profile?.display_name ?? "Player"}'s bracket`}
      >
        {viewing?.bracket ? (
          <MemberBracketViewer state={viewing.bracket} />
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">
            This player hasn't built a bracket yet.
          </p>
        )}
      </Modal>
    </>
  );
}

function MemberBracketViewer({ state }: { state: BracketState }) {
  const [tab, setTab] = useState<ViewerTab>("groups");
  const tabs: { id: ViewerTab; label: string }[] = [
    { id: "groups", label: "Groups" },
    { id: "third", label: "Third-place" },
    { id: "knockout", label: "Knockout" },
  ];

  return (
    <div>
      <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-bold transition",
              tab === t.id
                ? "bg-white text-ink shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "groups" && <GroupPredictionsView state={state} />}
      {tab === "third" && <ThirdPlacePredictionsView state={state} />}
      {tab === "knockout" && (
        <KnockoutStage
          bracket={computeBracket(state)}
          onPick={() => {}}
          readOnly
        />
      )}
    </div>
  );
}

function GroupPredictionsView({ state }: { state: BracketState }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GROUPS.map((group) => (
        <section
          key={group.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
        >
          <h4 className="mb-3 font-display text-lg font-bold uppercase tracking-wider text-ink">
            Group {group.id}
          </h4>
          <ol className="space-y-1.5">
            {state.standings[group.id].map((teamId, index) => {
              const team = teamById(teamId);
              if (!team) return null;
              return (
                <li
                  key={team.id}
                  className={[
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                    index < 2
                      ? "bg-emerald-50/80"
                      : index === 2
                        ? "bg-amber-50/80"
                        : "bg-slate-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      index < 2
                        ? "bg-emerald-500 text-white"
                        : index === 2
                          ? "bg-amber-400 text-amber-950"
                          : "bg-slate-300 text-slate-600",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <TeamFlag flag={team.flag} size={26} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {team.name}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function ThirdPlacePredictionsView({ state }: { state: BracketState }) {
  return (
    <div>
      <div className="mb-4 text-center">
        <span className="rounded-full bg-emerald-100 px-3.5 py-1 font-display text-base font-bold uppercase tracking-wide text-emerald-700">
          {state.thirdQualifiers.length} / 8 selected
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GROUP_IDS.map((g) => {
          const team = teamById(state.standings[g][2]);
          const selected = state.thirdQualifiers.includes(g);
          if (!team) return null;
          return (
            <div
              key={g}
              className={[
                "flex items-center gap-3 rounded-xl p-3 ring-1",
                selected
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : "bg-white text-slate-400 ring-slate-100",
              ].join(" ")}
            >
              <TeamFlag flag={team.flag} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {team.name}
                </span>
                <span className={selected ? "block text-xs text-emerald-100" : "block text-xs text-slate-400"}>
                  3rd · Group {g}
                </span>
              </span>
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  selected ? "bg-white text-emerald-600" : "border border-slate-200 text-transparent",
                ].join(" ")}
              >
                ✓
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeagueDetail({
  league,
  members,
  currentUserId,
  currentBracket,
  onBack,
  onViewMember,
}: {
  league: League;
  members: LeagueMemberView[];
  currentUserId: string;
  currentBracket: BracketState;
  onBack: () => void;
  onViewMember: (m: LeagueMemberView) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    await navigator.clipboard?.writeText(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        ← All leagues
      </button>

      <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-ink to-ink-700 px-4 py-3 text-white">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-300">
            Invite code
          </div>
          <div className="font-display text-2xl font-bold tracking-[0.3em] text-gold">
            {league.code}
          </div>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-bold transition hover:bg-white/25"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {members.length} {members.length === 1 ? "member" : "members"}
      </h4>
      <ul className="space-y-2">
        {members.map((m) => {
          const bracket = m.user_id === currentUserId ? currentBracket : m.bracket;
          const sum = bracket ? summarize(bracket) : null;
          const champ = sum?.champion ? teamById(sum.champion) : null;
          const progress = bracketProgress(bracket);
          return (
            <li key={m.user_id}>
              <button
                type="button"
                onClick={() => onViewMember({ ...m, bracket })}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-emerald-50"
              >
                {m.profile?.avatar_url ? (
                  <img
                    src={m.profile.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full ring-1 ring-slate-200"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                    {(m.profile?.display_name ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-700">
                    {m.profile?.display_name ?? "Player"}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {progress}
                  </div>
                </div>
                {champ ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-amber-700">
                    🏆 <TeamFlag flag={champ.flag} size={16} /> {champ.name}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function bracketProgress(bracket: BracketState | null): string {
  if (!bracket) return "No bracket yet";

  const resolved = computeBracket(bracket);
  if (resolved.results[104]?.winner) return "Bracket complete";
  if (resolved.results[104]?.home && resolved.results[104]?.away) {
    return "Final ready";
  }
  if (resolved.results[101]?.winner || resolved.results[102]?.winner) {
    return "Semi-finals in progress";
  }
  if ([97, 98, 99, 100].some((m) => resolved.results[m]?.winner)) {
    return "Quarter-finals in progress";
  }
  if ([89, 90, 91, 92, 93, 94, 95, 96].some((m) => resolved.results[m]?.winner)) {
    return "Round of 16 in progress";
  }
  if (
    [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88].some(
      (m) => resolved.results[m]?.winner
    )
  ) {
    return "Round of 32 in progress";
  }
  if (bracket.thirdQualifiers.length === 8) return "Knockout ready";
  if (bracket.thirdQualifiers.length > 0) {
    return `${bracket.thirdQualifiers.length}/8 third-place teams selected`;
  }
  return "Group stage rankings saved";
}

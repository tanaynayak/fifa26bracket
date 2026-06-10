import { useEffect, useState } from "react";
import {
  formatCountdown,
  PREDICTION_LOCK_AT,
  PREDICTION_LOCK_LABEL,
  predictionsLocked,
} from "../lib/lock";

interface Props {
  onLockChange?: (locked: boolean) => void;
}

export default function LockCountdown({ onLockChange }: Props) {
  const [now, setNow] = useState(() => new Date());
  const locked = predictionsLocked(now);
  const remaining = PREDICTION_LOCK_AT.getTime() - now.getTime();

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, locked ? 30000 : 1000);
    return () => window.clearInterval(id);
  }, [locked]);

  useEffect(() => {
    onLockChange?.(locked);
  }, [locked, onLockChange]);

  return (
    <div
      className={[
        "flex shrink-0 flex-col rounded-lg px-3 py-1.5 text-right ring-1",
        locked
          ? "bg-flame/85 text-white ring-white/20"
          : "bg-white/10 text-white ring-white/15",
      ].join(" ")}
      title={`Predictions lock ${PREDICTION_LOCK_LABEL}`}
    >
      <span className="text-[10px] font-bold uppercase leading-none tracking-wider text-white/70">
        {locked ? "Predictions locked" : "Lock countdown"}
      </span>
      <span className="mt-0.5 font-display text-lg font-bold leading-none tracking-wide">
        {locked ? "Locked" : formatCountdown(remaining)}
      </span>
    </div>
  );
}

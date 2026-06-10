import { useState } from "react";

interface Props {
  /** rendered height in px */
  size?: number;
  className?: string;
}

const SRC = "/brand/emblem.png";

/**
 * Renders the official World Cup 26 emblem (placed at `public/brand/emblem.png`)
 * with its real colours intact, but "processed" so it pops on the dark header:
 * a soft light bloom sits behind it, and the artwork itself gets a slight
 * saturation/contrast lift plus a thin white edge-halo for separation.
 * Falls back to a custom "26" mark when no emblem file is present.
 */
export default function BrandMark({ size = 40, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-gold to-amber-500 font-black text-ink shadow-inner ${className}`}
        style={{ height: size, width: size, fontSize: size * 0.4 }}
      >
        26
      </span>
    );
  }

  // A crisp solid keyline around the mark (stacked zero-blur offsets in 8
  // directions) — separates the logo from the navy without any soft glow.
  const O = "#ffffff";
  const d = 1.5;
  const outline = [
    `${d}px 0 0 ${O}`,
    `-${d}px 0 0 ${O}`,
    `0 ${d}px 0 ${O}`,
    `0 -${d}px 0 ${O}`,
    `${d}px ${d}px 0 ${O}`,
    `-${d}px -${d}px 0 ${O}`,
    `${d}px -${d}px 0 ${O}`,
    `-${d}px ${d}px 0 ${O}`,
  ]
    .map((s) => `drop-shadow(${s})`)
    .join(" ");

  return (
    <img
      src={SRC}
      alt="World Cup 26"
      onError={() => setFailed(true)}
      className={`block ${className}`}
      style={{
        height: size,
        width: "auto",
        filter: `saturate(1.12) contrast(1.03) ${outline}`,
      }}
    />
  );
}

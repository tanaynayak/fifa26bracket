/**
 * Subtle full-page football-pitch watermark. Drawn horizontally on laptop and
 * rotated to a vertical pitch on mobile (the markings are transposed, not just
 * CSS-rotated, so line weights stay correct). Sits behind all content.
 */

const W = 1050;
const H = 680;
const R = 84; // centre-circle radius
const PEN_D = 165; // penalty-area depth
const PEN_H = 300; // penalty-area width
const GOAL_D = 55;
const GOAL_H = 150;

const STROKE = "rgba(15,94,51,0.13)";
const FILL = "rgba(15,94,51,0.2)";

function Pitch({ vertical, className }: { vertical: boolean; className?: string }) {
  const vbW = vertical ? H : W;
  const vbH = vertical ? W : H;
  const tx = (x: number, y: number): [number, number] => (vertical ? [y, x] : [x, y]);

  const L = (x1: number, y1: number, x2: number, y2: number, k: string) => {
    const [a, b] = tx(x1, y1);
    const [c, d] = tx(x2, y2);
    return <line key={k} x1={a} y1={b} x2={c} y2={d} />;
  };
  const Rt = (x: number, y: number, w: number, h: number, k: string) => {
    const [a, b] = tx(x, y);
    return <rect key={k} x={a} y={b} width={vertical ? h : w} height={vertical ? w : h} rx={2} />;
  };
  const Dot = (cx: number, cy: number, k: string) => {
    const [a, b] = tx(cx, cy);
    return <circle key={k} cx={a} cy={b} r={4} fill={FILL} stroke="none" />;
  };
  const Circle = (cx: number, cy: number, r: number, k: string) => {
    const [a, b] = tx(cx, cy);
    return <circle key={k} cx={a} cy={b} r={r} />;
  };

  const penTop = (H - PEN_H) / 2;
  const goalTop = (H - GOAL_H) / 2;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke={STROKE}
      strokeWidth={1.8}
      aria-hidden
    >
      {Rt(12, 12, W - 24, H - 24, "border")}
      {L(W / 2, 12, W / 2, H - 12, "half")}
      {Circle(W / 2, H / 2, R, "centre")}
      {Dot(W / 2, H / 2, "centreSpot")}
      {Rt(12, penTop, PEN_D, PEN_H, "penL")}
      {Rt(W - 12 - PEN_D, penTop, PEN_D, PEN_H, "penR")}
      {Rt(12, goalTop, GOAL_D, GOAL_H, "goalL")}
      {Rt(W - 12 - GOAL_D, goalTop, GOAL_D, GOAL_H, "goalR")}
      {Dot(120, H / 2, "penSpotL")}
      {Dot(W - 120, H / 2, "penSpotR")}
    </svg>
  );
}

export default function PitchBackground({ top = 0 }: { top?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 overflow-hidden"
      style={{ top }}
    >
      <Pitch vertical={false} className="hidden h-full w-full md:block" />
      <Pitch vertical className="h-full w-full md:hidden" />
    </div>
  );
}

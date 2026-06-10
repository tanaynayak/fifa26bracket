import type { Team } from "../types";
import type { BracketState } from "./bracketState";
import { computeBracket, summarize } from "./bracketState";
import { teamById } from "../data/teams";

const W = 540;
const H = 960;
const OUTPUT_SCALE = 2;

const FONT = "Arial, Helvetica, sans-serif";
const FONT_HEAVY = '"Arial Black", Arial, Helvetica, sans-serif';

const flagUrl = (flag: string) => `https://flagcdn.com/w320/${flag}.png`;

function toTeams(ids: Array<string | null | undefined>): Team[] {
  return ids.map((id) => (id ? teamById(id) : null)).filter((t): t is Team => !!t);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  lineWidth: number
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function polygon(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  fill: string | CanvasGradient,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 4
) {
  if (!img) {
    fillRoundRect(ctx, x, y, w, h, radius, "rgba(255,255,255,0.12)");
    return;
  }

  const image = img as HTMLImageElement;
  const imgW = image.naturalWidth || w;
  const imgH = image.naturalHeight || h;
  const scale = Math.max(w / imgW, h / imgH);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (imgW - sw) / 2;
  const sy = (imgH - sh) / 2;

  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function font(size: number, weight = 700, family = FONT) {
  return `${weight} ${size}px ${family}`;
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  min: number,
  weight = 900,
  family = FONT_HEAVY
) {
  let size = start;
  while (size > min) {
    ctx.font = font(size, weight, family);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawFitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  start: number,
  min: number,
  color = "#ffffff",
  align: CanvasTextAlign = "left",
  weight = 900,
  family = FONT_HEAVY
) {
  const size = fitFont(ctx, text, maxWidth, start, min, weight, family);
  ctx.font = font(size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawCenteredLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  color: string
) {
  fillRoundRect(ctx, x, y, w, h, h / 2, fill);
  ctx.font = font(18, 900, FONT_HEAVY);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

function drawTeamRow(
  ctx: CanvasRenderingContext2D,
  team: Team,
  flag: HTMLImageElement | null,
  label: string,
  x: number,
  y: number,
  w: number,
  labelFill: string
) {
  fillRoundRect(ctx, x, y, w, 58, 10, "rgba(255,255,255,0.08)");
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  strokeRoundRect(ctx, x, y, w, 58, 10, "rgba(255,255,255,0.1)", 1);

  fillRoundRect(ctx, x + 12, y + 15, 76, 28, 8, labelFill);
  ctx.font = font(11, 900, FONT_HEAVY);
  ctx.fillStyle = labelFill === "#f4b323" ? "#0a1b2e" : "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 50, y + 29);

  drawCoverImage(ctx, flag, x + 106, y + 12, 48, 34, 4);
  strokeRoundRect(ctx, x + 106, y + 12, 48, 34, 4, "rgba(255,255,255,0.25)", 1);
  drawFitText(ctx, team.name.toUpperCase(), x + 172, y + 39, w - 190, 30, 20);
}

function drawSmallTeam(
  ctx: CanvasRenderingContext2D,
  team: Team,
  flag: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number
) {
  fillRoundRect(ctx, x, y, w, h, 10, "rgba(255,255,255,0.1)");
  drawCoverImage(ctx, flag, x + (w - 44) / 2, y + 10, 44, 31, 4);
  strokeRoundRect(ctx, x + (w - 44) / 2, y + 10, 44, 31, 4, "rgba(255,255,255,0.2)", 1);
  drawFitText(
    ctx,
    team.name,
    x + w / 2,
    y + h - 13,
    w - 10,
    13,
    9,
    "#ffffff",
    "center",
    800,
    FONT
  );
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render share image"));
    }, "image/png");
  });
}

export async function renderShareImageBlob(
  state: BracketState,
  userName: string
): Promise<Blob> {
  const summary = summarize(state);
  const bracket = computeBracket(state);
  const champ = summary.champion ? teamById(summary.champion) : null;
  const runner = summary.runnerUp ? teamById(summary.runnerUp) : null;
  const semis = toTeams(summary.semifinalists);
  const quarters = toTeams(
    [97, 98, 99, 100].flatMap((m) => [
      bracket.results[m]?.home,
      bracket.results[m]?.away,
    ])
  );

  const teams = [champ, runner, ...semis, ...quarters].filter((t): t is Team => !!t);
  const uniqueTeams = Array.from(new Map(teams.map((t) => [t.id, t])).values());
  const [emblem, ...flags] = await Promise.all([
    loadImage("/brand/emblem.png"),
    ...uniqueTeams.map((t) => loadImage(flagUrl(t.flag))),
  ]);
  const flagById = new Map(uniqueTeams.map((t, i) => [t.id, flags[i] ?? null]));

  const canvas = document.createElement("canvas");
  canvas.width = W * OUTPUT_SCALE;
  canvas.height = H * OUTPUT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.scale(OUTPUT_SCALE, OUTPUT_SCALE);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#07131f");
  bg.addColorStop(0.58, "#0d243a");
  bg.addColorStop(1, "#0a1b2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const green = ctx.createLinearGradient(0, 0, 250, 250);
  green.addColorStop(0, "#1ba14e");
  green.addColorStop(1, "#0c6c35");
  polygon(ctx, [[0, 0], [216, 0], [0, 267]], green, 0.88);

  const blue = ctx.createLinearGradient(310, 0, 540, 240);
  blue.addColorStop(0, "#3b82f6");
  blue.addColorStop(1, "#1d44c0");
  polygon(ctx, [[540, 0], [325, 0], [540, 246]], blue, 0.82);

  const gold = ctx.createLinearGradient(360, 700, 540, 960);
  gold.addColorStop(0, "#f8cf57");
  gold.addColorStop(1, "#f3ad1d");
  polygon(ctx, [[540, 960], [342, 960], [540, 705]], gold, 0.68);
  polygon(ctx, [[0, 960], [190, 960], [0, 744]], "#d1192e", 0.58);

  strokeRoundRect(ctx, 25, 25, 490, 910, 18, "rgba(255,255,255,0.22)", 2);
  strokeRoundRect(ctx, 35, 35, 470, 890, 14, "rgba(244,179,35,0.45)", 1);

  if (emblem) {
    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 4;
    ctx.drawImage(emblem, 43, 34, 62, 62);
    ctx.restore();
  } else {
    drawCenteredLabel(ctx, "26", 43, 39, 62, 52, "#f4b323", "#0a1b2e");
  }

  ctx.font = font(35, 900, FONT_HEAVY);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("WORLD CUP 26", 126, 62);
  ctx.fillText("BRACKET", 126, 96);
  ctx.font = font(15, 800, FONT);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(userName ? `${userName}'s prediction` : "My prediction", 126, 119);

  drawCenteredLabel(ctx, "CHAMPION", 172, 153, 196, 44, "#f4b323", "#0a1b2e");

  if (champ) {
    fillRoundRect(ctx, 139, 216, 262, 183, 20, "rgba(255,255,255,0.12)");
    ctx.shadowColor = "rgba(0,0,0,0.34)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 12;
    drawCoverImage(ctx, flagById.get(champ.id) ?? null, 151, 228, 238, 159, 5);
    ctx.shadowColor = "transparent";
    strokeRoundRect(ctx, 151, 228, 238, 159, 5, "rgba(255,255,255,0.42)", 2);
    drawFitText(
      ctx,
      champ.name.toUpperCase(),
      W / 2,
      454,
      456,
      66,
      40,
      "#ffffff",
      "center",
      900,
      FONT_HEAVY
    );
  } else {
    drawFitText(ctx, "NOT PICKED YET", W / 2, 330, 420, 36, 28, "#64748b", "center");
  }

  fillRoundRect(ctx, 32, 500, 476, 156, 16, "rgba(255,255,255,0.07)");
  strokeRoundRect(ctx, 32, 500, 476, 156, 16, "rgba(255,255,255,0.1)", 1);
  ctx.font = font(13, 900, FONT_HEAVY);
  ctx.fillStyle = "#f4b323";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("FINAL", W / 2, 528);

  if (champ && runner) {
    drawTeamRow(ctx, champ, flagById.get(champ.id) ?? null, "WINNER", 44, 542, 452, "#f4b323");
    drawTeamRow(ctx, runner, flagById.get(runner.id) ?? null, "RUNNER", 44, 606, 452, "rgba(255,255,255,0.16)");
  } else {
    ctx.font = font(16, 700, FONT);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Complete the final to fill this section.", W / 2, 590);
  }

  const panelY = 688;
  const panelH = 210;
  fillRoundRect(ctx, 32, panelY, 236, panelH, 16, "rgba(255,255,255,0.07)");
  fillRoundRect(ctx, 282, panelY, 226, panelH, 16, "rgba(255,255,255,0.07)");
  strokeRoundRect(ctx, 32, panelY, 236, panelH, 16, "rgba(255,255,255,0.1)", 1);
  strokeRoundRect(ctx, 282, panelY, 226, panelH, 16, "rgba(255,255,255,0.1)", 1);

  ctx.font = font(12, 900, FONT_HEAVY);
  ctx.fillStyle = "#cbd5e1";
  ctx.textAlign = "center";
  ctx.fillText("FINAL FOUR", 150, panelY + 30);
  ctx.fillText("QUARTER-FINALISTS", 395, panelY + 30);

  semis.slice(0, 4).forEach((team, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawSmallTeam(
      ctx,
      team,
      flagById.get(team.id) ?? null,
      44 + col * 106,
      panelY + 48 + row * 80,
      96,
      70
    );
  });

  quarters.slice(0, 8).forEach((team, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 296 + col * 48;
    const y = panelY + 54 + row * 48;
    fillRoundRect(ctx, x, y, 39, 32, 7, "rgba(255,255,255,0.1)");
    drawCoverImage(ctx, flagById.get(team.id) ?? null, x + 4, y + 5, 31, 22, 4);
  });

  ctx.font = font(12, 900, FONT);
  ctx.fillStyle = "#94a3b8";
  ctx.textAlign = "center";
  ctx.fillText("BUILD YOURS · WORLD CUP 26 BRACKET", W / 2, 920);

  return blobFromCanvas(canvas);
}

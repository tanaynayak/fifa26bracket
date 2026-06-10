import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { BracketState } from "../lib/bracketState";
import Modal from "./Modal";
import ShareCard from "./ShareCard";

interface Props {
  open: boolean;
  onClose: () => void;
  state: BracketState;
  userName: string;
}

async function renderPng(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#0a1b2e",
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

export default function ShareModal({ open, onClose, state, userName }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const withCard = async (fn: (blob: Blob) => Promise<void>, label: string) => {
    if (!cardRef.current) return;
    setBusy(true);
    setStatus(null);
    try {
      // two passes — first lets remote images load into the clone reliably
      await renderPng(cardRef.current);
      const blob = await renderPng(cardRef.current);
      await fn(blob);
    } catch {
      setStatus(`Couldn't ${label}. Try the download button.`);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = () =>
    withCard(async (blob) => {
      const file = new File([blob], "wc26-bracket.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My World Cup 26 Bracket",
          text: "My World Cup 26 bracket prediction 🏆",
        });
      } else {
        downloadBlob(blob);
        setStatus("Sharing isn't supported here — saved the image instead.");
      }
    }, "share");

  const handleDownload = () =>
    withCard(async (blob) => {
      downloadBlob(blob);
      setStatus("Image saved.");
    }, "download");

  const handleCopy = () =>
    withCard(async (blob) => {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("no clipboard");
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("Copied to clipboard — paste it anywhere.");
    }, "copy");

  return (
    <Modal open={open} onClose={onClose} title="Share your bracket">
      <div className="flex flex-col items-center">
        {/* scaled preview; the captured node stays full-res */}
        <div className="mb-5 overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200">
          <div style={{ width: 270, height: 480 }}>
            <div style={{ transform: "scale(0.5)", transformOrigin: "top left" }}>
              <ShareCard ref={cardRef} state={state} userName={userName} />
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleShare}
            className="rounded-xl bg-gradient-to-r from-pitch to-emerald-600 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            Share
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleCopy}
            className="rounded-xl bg-ink py-2.5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-60"
          >
            Copy
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDownload}
            className="rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
          >
            Save
          </button>
        </div>

        <p className="mt-3 h-4 text-center text-xs text-slate-500">
          {busy ? "Rendering image…" : status}
        </p>
      </div>
    </Modal>
  );
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wc26-bracket.png";
  a.click();
  URL.revokeObjectURL(url);
}

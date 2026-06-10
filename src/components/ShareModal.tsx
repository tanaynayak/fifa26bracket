import { useEffect, useState } from "react";
import type { BracketState } from "../lib/bracketState";
import { renderShareImageBlob } from "../lib/shareImage";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  state: BracketState;
  userName: string;
}

export default function ShareModal({ open, onClose, state, userName }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let url: string | null = null;
    setStatus(null);
    setPreviewUrl(null);

    renderShareImageBlob(state, userName)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => {
        if (active) setStatus("Couldn't render the preview.");
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, state, userName]);

  const withCard = async (fn: (blob: Blob) => Promise<void>, label: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await renderShareImageBlob(state, userName);
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
        <div className="mb-5 overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200">
          <div className="flex h-[480px] w-[270px] items-center justify-center bg-ink">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Bracket share preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                Rendering preview...
              </span>
            )}
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

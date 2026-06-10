import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../lib/auth";

export default function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-sm transition hover:bg-slate-100"
      >
        <GoogleGlyph />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  const name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email ||
    "You";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initial = name.charAt(0).toUpperCase();

  const toggle = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setMenuOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2.5 text-sm font-semibold transition hover:bg-white/20"
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-7 w-7 rounded-full ring-1 ring-white/30" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-black text-ink">
            {initial}
          </span>
        )}
        <span className="hidden max-w-28 truncate sm:inline">{name}</span>
      </button>

      {menuOpen &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="fixed z-[61] w-48 overflow-hidden rounded-xl bg-white py-1 text-slate-700 shadow-xl ring-1 ring-slate-200"
              style={{ top: pos.top, right: pos.right }}
            >
              <div className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-400">
                {user.email}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                className="w-full px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.3 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.3 15.9 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.5 45 31 45 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";

type Props = {
  open: boolean;
  src: string | null;
  title?: string;
  onClose: () => void;
};

// Fullscreen, YouTube-like modal video player.
// - Opens as an overlay and plays immediately.
// - Provides native controls + a Fullscreen button.
// - Auto-closes when playback ends.
export default function VideoPlayerModal({ open, src, title, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canShow = open && !!src;

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!canShow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [canShow]);

  // Autoplay when opened
  useEffect(() => {
    if (!canShow) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    // Some browsers block autoplay without user gesture; ignore.
    if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
  }, [canShow, src]);

  // ESC to close
  useEffect(() => {
    if (!canShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canShow, onClose]);

  const safeTitle = useMemo(() => title || "Video", [title]);

  async function requestFullscreen() {
    const v = videoRef.current;
    if (!v) return;

    // iOS Safari uses webkitEnterFullscreen on the video element.
    const anyV: any = v as any;
    if (typeof anyV.webkitEnterFullscreen === "function") {
      anyV.webkitEnterFullscreen();
      return;
    }

    // Standard Fullscreen API
    const el: any = v;
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen();
    }
  }

  if (!canShow) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={safeTitle}
      onClick={onClose}
    >
      <div
        className="absolute inset-x-0 top-0 bottom-0 m-auto flex max-w-4xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 text-white">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{safeTitle}</div>
            <div className="text-[11px] text-white/70">Tap outside to close</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold"
              onClick={requestFullscreen}
            >
              Fullscreen
            </button>
            <button
              type="button"
              className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-6">
          <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black shadow-soft">
            <video
              ref={videoRef}
              src={src ?? undefined}
              className="h-full w-full object-contain"
              controls
              playsInline
              autoPlay
              onEnded={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

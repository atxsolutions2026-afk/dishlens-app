"use client";

import { useEffect, useMemo, useRef } from "react";

export default function VideoPlayerModal({
  open,
  src,
  title,
  onClose,
}: {
  open: boolean;
  src: string | null;
  title?: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // If src is a direct video URL, use it.
  // If it's YouTube/Vimeo/etc, you likely render iframe elsewhere (not handled here).
  const videoSrc = useMemo(() => (src ? String(src) : ""), [src]);

  useEffect(() => {
    if (!open) return;

    const v = videoRef.current;
    if (!v) return;

    // Ensure the browser has enough to start playing
    v.currentTime = 0;

    // Autoplay rules:
    // - Most browsers require MUTED to autoplay without user gesture.
    // - playsInline is required for iOS Safari to avoid fullscreen + allow autoplay-ish behavior.
    const tryPlay = async () => {
      try {
        v.muted = true; // required for autoplay on most devices
        v.playsInline = true;
        v.autoplay = true;

        // Some browsers need a small delay after DOM paint
        await new Promise((r) => setTimeout(r, 50));

        const p = v.play();
        if (p && typeof (p as any).then === "function") await p;
      } catch {
        // If autoplay is blocked, user can still tap play.
        // (No alert needed)
      }
    };

    tryPlay();

    return () => {
      try {
        v.pause();
      } catch {}
    };
  }, [open, videoSrc]);

  if (!open || !videoSrc) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close video"
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[860px]">
        <div className="rounded-t-3xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/60">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {title || "Video"}
              </div>
              <div className="text-[11px] text-white/60">Auto-play enabled</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 text-white grid place-items-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="relative w-full bg-black">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-[240px] sm:h-[520px] object-contain bg-black"
              controls
              autoPlay
              muted
              playsInline
              preload="auto"
            />
          </div>

          <div className="px-4 py-3 bg-black/60 text-[11px] text-white/70">
            Note: Autoplay works best when muted (required by most browsers).
            Users can unmute anytime.
          </div>
        </div>
      </div>
    </div>
  );
}

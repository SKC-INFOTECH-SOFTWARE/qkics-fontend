import { useEffect, useRef } from "react";

/**
 * Feed video with scroll-aware playback:
 *  - Auto-plays (muted) when it scrolls into view (>=60% visible).
 *  - Auto-pauses when it scrolls out of view.
 *  - Guarantees only ONE feed video plays at a time (module-level singleton):
 *    whenever any FeedVideo starts playing, every other one is paused.
 *
 * Muted autoplay is required by browser autoplay policies; users can unmute
 * via the native controls, and the next in-view video re-starts muted.
 */

// The <video> element currently playing across the whole app.
let activeVideo = null;

// Nearest scrollable ancestor — used as the IntersectionObserver root so
// visibility is correct whether the feed scrolls the window (home feed) or an
// inner container (profile page posts column). Falls back to the viewport.
function getScrollParent(node) {
  let el = node?.parentElement;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if (oy === "auto" || oy === "scroll" || oy === "overlay") return el;
    el = el.parentElement;
  }
  return null;
}

export default function FeedVideo({ src, className, poster }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Muted is required for programmatic autoplay without a user gesture.
    video.muted = true;
    video.defaultMuted = true;

    const handlePlay = () => {
      // Enforce single playback: pause whichever other video was playing.
      if (activeVideo && activeVideo !== video) {
        activeVideo.pause();
      }
      activeVideo = video;
    };
    const handlePause = () => {
      if (activeVideo === video) activeVideo = null;
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          const p = video.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      },
      { root: getScrollParent(video), threshold: [0, 0.6, 1] }
    );
    io.observe(video);

    return () => {
      io.disconnect();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      if (activeVideo === video) activeVideo = null;
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      controls
      playsInline
      preload="metadata"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";

// Drives the fixed video background, the parallax "curtain" reveal, the
// hero fade/shift, and the nav's solid/hidden state — all keyed off scroll
// position. Also scroll-scrubs the background video's currentTime so it
// plays in sync with how far the visitor has scrolled.
export function useHeroParallax() {
  const navRef = useRef(null);
  const parallaxLayerRef = useRef(null);
  const videoRef = useRef(null);
  const parallaxRef = useRef(null);
  const heroContentRef = useRef(null);

  // Synchronous initial pass so a reload mid-scroll doesn't flash the
  // pre-scroll layout before the first scroll-driven paint.
  useLayoutEffect(() => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

    const parallaxProgress = Math.max(0, Math.min(1, y / (vh * 0.8)));
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = `translate3d(0, ${parallaxProgress * 100}%, 0)`;
    }
    if (parallaxLayerRef.current) {
      parallaxLayerRef.current.style.pointerEvents =
        parallaxProgress >= 1 ? "none" : "auto";
    }
    if (heroContentRef.current) {
      const fade = Math.max(0, 1 - y / (vh * 0.5));
      heroContentRef.current.style.opacity = fade;
      heroContentRef.current.style.transform = `translate3d(0, ${(y / vh) * -40}px, 0)`;
    }
  }, []);

  useEffect(() => {
    let raf = null;
    let lastVideoTime = -1;
    let videoSeeking = false;
    let pendingTarget = null;
    let videoUnlocked = false;
    let hoverHideTimer = null;
    const video = videoRef.current;

    const isTouch = window.matchMedia("(hover: none)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SEEK_THRESHOLD = isTouch ? 0.08 : 0.03;

    function seekVideo(target) {
      if (!video || reducedMotion) return;
      if (videoSeeking) { pendingTarget = target; return; }
      lastVideoTime = target;
      videoSeeking = true;
      video.currentTime = target;
    }

    function onSeeked() {
      videoSeeking = false;
      if (pendingTarget !== null) {
        const t = pendingTarget;
        pendingTarget = null;
        seekVideo(t);
      }
    }

    // iOS / mobile: video must be played at least once before seeking is allowed.
    // We play it silently then pause immediately to "unlock" it.
    function unlockVideo() {
      if (videoUnlocked || !video) return;
      videoUnlocked = true;
      video.muted = true;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }

    if (video) {
      video.addEventListener("seeked", onSeeked);
      // Trigger load so the browser buffers the video
      video.load();
      video.addEventListener("canplay", unlockVideo, { once: true });
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;

        navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

        // Hide nav once scrolled past the top; only hovering near the top
        // (see onMouseMove below) or scrolling back to the very top reveals it.
        const menuIsOpen = navRef.current?.classList.contains("hp-nav--open");
        if (!menuIsOpen) {
          if (y < 80) {
            clearTimeout(hoverHideTimer);
            navRef.current?.classList.remove("hp-nav--hidden");
          } else {
            navRef.current?.classList.add("hp-nav--hidden");
          }
        }

        if (!reducedMotion) {
          const parallaxProgress = Math.max(0, Math.min(1, y / (vh * 0.8)));
          if (parallaxRef.current) {
            parallaxRef.current.style.transform = `translate3d(0, ${parallaxProgress * 100}%, 0)`;
          }
          if (parallaxLayerRef.current) {
            parallaxLayerRef.current.style.pointerEvents =
              parallaxProgress >= 1 ? "none" : "auto";
          }

          if (heroContentRef.current) {
            const fade = Math.max(0, 1 - y / (vh * 0.5));
            const shift = isTouch ? (y / vh) * -20 : (y / vh) * -40;
            heroContentRef.current.style.opacity = fade;
            heroContentRef.current.style.transform = `translate3d(0, ${shift}px, 0)`;
          }

          const scrollable = document.documentElement.scrollHeight - vh;
          if (videoUnlocked && video?.duration && isFinite(video.duration) && scrollable > 0) {
            const progress = Math.max(0, Math.min(1, y / scrollable));
            const target = progress * video.duration;
            if (Math.abs(target - lastVideoTime) > SEEK_THRESHOLD) seekVideo(target);
          }
        }

        raf = null;
      });
    }

    // Fallback unlock on first touch
    function onFirstInteraction() { unlockVideo(); }
    window.addEventListener("touchstart", onFirstInteraction, { passive: true, once: true });

    // Reveal the nav whenever the cursor hovers near its position, even
    // while it would otherwise be hidden from scrolling down. Moving away
    // re-hides it after a short delay — but only if still scrolled past
    // the top by the time the delay elapses (the user may have scrolled
    // back to the top in the meantime, which must always win).
    // Coalesced via rAF like onScroll above — native mousemove can fire far
    // more often than the display refreshes, and this only ever needs to
    // react once per frame to a threshold crossing, not on every raw event.
    let mouseRaf = null;
    function onMouseMove(e) {
      if (mouseRaf) return;
      const clientY = e.clientY;
      mouseRaf = requestAnimationFrame(() => {
        mouseRaf = null;
        const menuIsOpen = navRef.current?.classList.contains("hp-nav--open");
        if (menuIsOpen) return;
        if (clientY <= 100) {
          clearTimeout(hoverHideTimer);
          navRef.current?.classList.remove("hp-nav--hidden");
        } else if (window.scrollY >= 80) {
          clearTimeout(hoverHideTimer);
          hoverHideTimer = setTimeout(() => {
            if (window.scrollY >= 80) {
              navRef.current?.classList.add("hp-nav--hidden");
            }
          }, 1200);
        }
      });
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("mousemove", onMouseMove);
      clearTimeout(hoverHideTimer);
      if (raf) cancelAnimationFrame(raf);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
      video?.removeEventListener("seeked", onSeeked);
      video?.removeEventListener("canplay", unlockVideo);
    };
  }, []);

  return { navRef, parallaxLayerRef, videoRef, parallaxRef, heroContentRef };
}

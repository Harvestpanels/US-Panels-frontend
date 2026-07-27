import { useEffect, useRef } from "react";

// Nav-only scroll behavior for pages without the hero video/parallax
// background: solid pill once scrolled, auto-hide on scroll down, and a
// hover-near-top reveal with delayed re-hide — mirrors the nav portion of
// useHeroParallax so the navbar behaves identically on every page.
export function useNavScroll(menuOpen) {
  const navRef = useRef(null);

  useEffect(() => {
    let raf = null;
    let hoverHideTimer = null;

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;

        navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

        if (!menuOpen) {
          if (y < 80) {
            clearTimeout(hoverHideTimer);
            navRef.current?.classList.remove("hp-nav--hidden");
          } else {
            navRef.current?.classList.add("hp-nav--hidden");
          }
        }
        raf = null;
      });
    }

    function onMouseMove(e) {
      if (menuOpen) return;
      if (e.clientY <= 100) {
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
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      clearTimeout(hoverHideTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [menuOpen]);

  return navRef;
}

import { useEffect, useLayoutEffect, useRef } from "react";

// Registers elements for scroll-reveal, then fades/slides them in once
// they enter the viewport (via IntersectionObserver). A synchronous
// useLayoutEffect pass runs first so elements already in view on load
// (e.g. after a refresh mid-scroll) don't flash hidden before paint.
export function useRevealOnScroll() {
  const revealRegistry = useRef(new Set());
  const revealTargets = useRef([]);

  function registerReveal(el) {
    if (!el || revealRegistry.current.has(el)) return;
    revealRegistry.current.add(el);
    revealTargets.current.push(el);
  }

  useLayoutEffect(() => {
    const vh = window.innerHeight;
    revealTargets.current.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        el.classList.add("is-visible");
      }
    });
  }, []);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: isTouch ? "0px 0px -5% 0px" : "0px 0px -10% 0px" }
    );
    revealTargets.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return { registerReveal };
}

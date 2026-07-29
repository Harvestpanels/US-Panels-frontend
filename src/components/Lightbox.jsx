import "./Lightbox.css";
import { useEffect, useRef, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_WINDOW_MS = 300;

function distanceBetween(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Pinch-to-zoom and double-tap-to-zoom on the photo (touch devices — desktop
// pointers have no pinch gesture and the image already displays large, so
// this only wires up touch handlers). Mounted fresh per photo (keyed by
// index in the parent), so zoom/pan naturally start at their defaults for
// every new image instead of needing an effect to reset them.
function ZoomableImage({ src, alt }) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Drives the transition toggle in render, so it has to be state (not a
  // ref) — refs can't be read during render.
  const [isGesturing, setIsGesturing] = useState(false);
  const gestureRef = useRef({ mode: null, startDist: 0, startZoom: MIN_ZOOM, startPan: { x: 0, y: 0 }, startTouch: { x: 0, y: 0 } });
  const lastTapRef = useRef(0);
  // Mirrors `zoom` synchronously (state updates don't land until the next
  // render) so handleTouchEnd can check the gesture's actual just-finished
  // value instead of reading `zoom` from a stale closure.
  const zoomLiveRef = useRef(MIN_ZOOM);

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      setIsGesturing(true);
      gestureRef.current = {
        mode: "pinch",
        startDist: distanceBetween(e.touches),
        startZoom: zoomLiveRef.current,
        startPan: pan,
        startTouch: { x: 0, y: 0 },
      };
    } else if (e.touches.length === 1 && zoomLiveRef.current > MIN_ZOOM) {
      setIsGesturing(true);
      gestureRef.current = {
        mode: "pan",
        startDist: 0,
        startZoom: zoomLiveRef.current,
        startPan: pan,
        startTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY },
      };
    }
  }

  function handleTouchMove(e) {
    const gesture = gestureRef.current;
    if (gesture.mode === "pinch" && e.touches.length === 2) {
      e.preventDefault();
      const ratio = distanceBetween(e.touches) / gesture.startDist;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, gesture.startZoom * ratio));
      zoomLiveRef.current = next;
      setZoom(next);
    } else if (gesture.mode === "pan" && e.touches.length === 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - gesture.startTouch.x;
      const dy = e.touches[0].clientY - gesture.startTouch.y;
      setPan({ x: gesture.startPan.x + dx, y: gesture.startPan.y + dy });
    }
  }

  function handleTouchEnd(e) {
    gestureRef.current.mode = null;
    setIsGesturing(false);
    // Snap back to the base frame instead of leaving the photo stranded
    // partly zoomed out or panned off-frame.
    if (zoomLiveRef.current < MIN_ZOOM + 0.05) {
      zoomLiveRef.current = MIN_ZOOM;
      setZoom(MIN_ZOOM);
      setPan({ x: 0, y: 0 });
    }

    if (e.touches.length === 0) {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
        // Also suppresses Safari's own native double-tap-to-zoom, which
        // would otherwise fire alongside ours and fight over the gesture.
        e.preventDefault();
        lastTapRef.current = 0;
        const next = zoomLiveRef.current > MIN_ZOOM ? MIN_ZOOM : DOUBLE_TAP_ZOOM;
        zoomLiveRef.current = next;
        setZoom(next);
        setPan({ x: 0, y: 0 });
      } else {
        lastTapRef.current = now;
      }
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      className="hp-lightbox__img"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transition: isGesturing ? "none" : "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

export default function Lightbox({ images, index, onClose, onNext, onPrev }) {
  const item = images[index];
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Keyboard navigation, focus trap, and scroll lock while the lightbox is
  // mounted (open). Moves focus into the dialog on open and restores it to
  // whatever triggered the lightbox (the gallery card) on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div
      ref={dialogRef}
      className="hp-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button ref={closeButtonRef} type="button" className="hp-lightbox__close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      </button>

      <button
        type="button"
        className="hp-lightbox__nav hp-lightbox__nav--prev"
        onClick={onPrev}
        disabled={index === 0}
        aria-label="Previous photo"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      <figure className="hp-lightbox__figure">
        <ZoomableImage key={index} src={item.src} alt={item.title} />
        <span className="hp-lightbox__count">{index + 1} / {images.length}</span>
        <figcaption>
          <span className="hp-lightbox__use">{item.category}</span>
          <span className="hp-lightbox__title">{item.title}</span>
          <span className="hp-lightbox__desc">{item.desc}</span>
        </figcaption>
      </figure>

      <button
        type="button"
        className="hp-lightbox__nav hp-lightbox__nav--next"
        onClick={onNext}
        disabled={index >= images.length - 1}
        aria-label="Next photo"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

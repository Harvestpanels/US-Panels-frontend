import "./Lightbox.css";
import { useEffect, useRef } from "react";

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
        <img
          key={index}
          src={`https:${item.src}`}
          alt={item.title}
        />
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

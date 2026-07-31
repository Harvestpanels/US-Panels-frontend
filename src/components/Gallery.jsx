import "./Gallery.css";
import { useRef } from "react";
import { useGalleryCarousel } from "../hooks/useGalleryCarousel";

// Below this, swiping past the last card's edge should feel like there's
// somewhere further to go — a real, physical drag rather than a snap.
const SWIPE_THRESHOLD_PX = 40;

export default function Gallery({ images, registerReveal, onSelect }) {
  const {
    galleryViewportRef,
    galleryIndex,
    galleryCols,
    galleryStepPx,
    galleryMaxIndex,
    galleryNext,
    galleryPrev,
  } = useGalleryCarousel(images);

  // Touch swipe on the track (mobile has no other way to advance besides
  // the small prev/next buttons up in the header — a horizontally-sliding
  // carousel with no swipe support reads as broken on a touch device,
  // where swiping is the expected gesture). `intent` starts null each
  // touch and gets decided on the first move past a few px: once it's
  // "horizontal", the gesture is treated as ours and page scroll is
  // suppressed; once "vertical", we back off entirely and let the page
  // scroll normally, matching how native carousels disambiguate the two.
  const touchRef = useRef({ x: 0, y: 0, intent: null });

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, intent: null };
  }

  function handleTouchMove(e) {
    const state = touchRef.current;
    const t = e.touches[0];
    const dx = t.clientX - state.x;
    const dy = t.clientY - state.y;

    if (state.intent === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      state.intent = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }
    if (state.intent === "horizontal") e.preventDefault();
  }

  function handleTouchEnd(e) {
    const state = touchRef.current;
    if (state.intent !== "horizontal") return;
    const dx = e.changedTouches[0].clientX - state.x;
    if (dx <= -SWIPE_THRESHOLD_PX) galleryNext();
    else if (dx >= SWIPE_THRESHOLD_PX) galleryPrev();
  }

  return (
    <section className="hp-section hp-section--gallery" id="gallery">
      <div className="hp-section__inner">
        <div className="hp-glass">
          <div className="hp-gallery-header">
            <div className="hp-gallery-header__left">
              <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Photo gallery</p>
              <h2 className="hp-reveal" ref={registerReveal}>Projects from the field</h2>
              <p className="hp-gallery-header__desc hp-reveal" ref={registerReveal}>
                Real installs across industrial, commercial, and residential
                builds, browse panels, doors, and finished interiors from
                projects shipped and installed nationwide.
              </p>
            </div>
            <div className="hp-gallery-header__nav hp-reveal" ref={registerReveal}>
              <button
                type="button"
                className="hp-gallery-nav hp-gallery-nav--prev"
                onClick={galleryPrev}
                disabled={galleryIndex === 0}
                aria-label="Previous photos"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button"
                className="hp-gallery-nav hp-gallery-nav--next"
                onClick={galleryNext}
                disabled={galleryIndex >= galleryMaxIndex}
                aria-label="Next photos"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>

          <div
            className="hp-gallery-viewport hp-reveal"
            ref={(el) => { galleryViewportRef.current = el; registerReveal(el); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="hp-gallery-track"
              style={{
                transform: `translateX(-${galleryIndex * galleryStepPx}px)`,
                "--cols": galleryCols,
              }}
            >
              {images.map((img, i) => (
                <button
                  type="button"
                  className="hp-gallery-card"
                  key={img.src}
                  onClick={() => onSelect(i)}
                  aria-label={`View "${img.title}" full screen`}
                >
                  <img src={img.src} alt={img.title} loading="lazy" decoding="async" />
                  <span className="hp-gallery-card__label">
                    <span className="hp-gallery-card__use">{img.category}</span>
                    <span className="hp-gallery-card__caption">{img.title}</span>
                    <span className="hp-gallery-card__desc"><span>{img.desc}</span></span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

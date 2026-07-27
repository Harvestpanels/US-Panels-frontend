import { useEffect, useRef, useState } from "react";

const GALLERY_GAP_PX = 16;

// Manages the responsive column count, slide offset (in px), and current
// index for the horizontally-sliding photo gallery track.
export function useGalleryCarousel(images) {
  const galleryViewportRef = useRef(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryCols, setGalleryCols] = useState(3);
  const [galleryStepPx, setGalleryStepPx] = useState(0);

  useEffect(() => {
    const queries = [
      window.matchMedia("(max-width: 640px)"),
      window.matchMedia("(max-width: 1024px)"),
    ];

    function updateCols() {
      const cols = queries[0].matches ? 1 : queries[1].matches ? 2 : 3;
      setGalleryCols(cols);
      setGalleryIndex((i) => Math.min(i, Math.max(0, images.length - cols)));
    }

    updateCols();
    queries.forEach((mq) => mq.addEventListener("change", updateCols));
    return () => queries.forEach((mq) => mq.removeEventListener("change", updateCols));
  }, [images.length]);

  // Measure the real rendered width so the slide offset is computed in px —
  // a transform translateX(%) would be relative to the (much wider) track's
  // own width, not the visible viewport, so it can't be used here.
  useEffect(() => {
    const viewport = galleryViewportRef.current;
    if (!viewport) return;

    function measure() {
      const cs = getComputedStyle(viewport);
      const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const trackWidth = viewport.clientWidth - paddingX;
      const itemWidth = (trackWidth - GALLERY_GAP_PX * (galleryCols - 1)) / galleryCols;
      setGalleryStepPx(itemWidth + GALLERY_GAP_PX);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [galleryCols]);

  const galleryMaxIndex = Math.max(0, images.length - galleryCols);
  const galleryNext = () => setGalleryIndex((i) => Math.min(i + 1, galleryMaxIndex));
  const galleryPrev = () => setGalleryIndex((i) => Math.max(i - 1, 0));

  return {
    galleryViewportRef,
    galleryIndex,
    galleryCols,
    galleryStepPx,
    galleryMaxIndex,
    galleryNext,
    galleryPrev,
  };
}

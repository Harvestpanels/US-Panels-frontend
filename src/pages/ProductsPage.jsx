import { useEffect, useRef, useState } from "react";
import "../styles/App.css";
import "./ProductsPage.css";
import logo from "../assets/images/us-panels-logo.png";
import { PRODUCT_CATEGORIES } from "../data/products";
import { useCountUp } from "../hooks/useCountUp";
import { useLightbox } from "../hooks/useLightbox";
import { useNavScroll } from "../hooks/useNavScroll";
import { usePageMeta } from "../hooks/usePageMeta";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { useToast } from "../hooks/useToast";
import { scrollCenter } from "../utils/scroll";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Lightbox from "../components/Lightbox";
import Contact from "../components/Contact";
import Toast from "../components/Toast";

// Maps a product into the { src, title, category, desc } shape Lightbox
// expects (the same shape the photo gallery already feeds it).
function toAlbumItem(product) {
  return {
    src: product.img,
    title: product.name,
    category: product.categoryName ? `${product.categoryName} · ${product.spec}` : product.spec,
    desc: product.desc,
  };
}

// Once the entrance animation finishes, swap it for a plain "done" class
// that holds the final opacity. Just removing the animation class would
// revert the element to .hp-anim-item's base (opacity: 0) since nothing
// else would be left declaring opacity: 1 — and leaving the animation
// class in place isn't an option either: a held (fill-mode: both)
// animation outranks normal author rules in the cascade, including
// :hover, which would otherwise permanently block the tilt-on-hover
// effect on product cards after their entrance plays.
function clearAnimOnEnd(e) {
  if (e.animationName !== "hp-filter-pop") return;
  e.currentTarget.classList.remove("hp-filter-anim");
  e.currentTarget.classList.add("hp-anim-done");
}

const PRODUCTS_NAV_SECTIONS = [
  { id: "foam-panels", label: "Wall & Roof" },
  { id: "mineral-wool-panels", label: "Fire-Rated" },
  { id: "cold-storage-panels", label: "Cold Storage" },
  { id: "doors", label: "Doors" },
  { id: "trim-hardware", label: "Trim & Hardware" },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "All products" },
  ...PRODUCT_CATEGORIES.map((category) => ({ id: category.id, label: category.name })),
];

const HERO_HEADING_WORDS = "Panels & doors for every part of the building envelope".split(" ");

// Every product, flattened once with its category attached — this is the
// single, stable list the search view filters over. Filtering it in place
// (CSS display, not array filtering) keeps every card permanently mounted
// so scroll-reveal never has to re-discover a card that briefly left the DOM.
const ALL_PRODUCTS = PRODUCT_CATEGORIES.flatMap((category) =>
  category.products.map((product) => ({
    ...product,
    categoryName: category.name,
    categoryId: category.id,
  }))
);

// A bare substring match misses plurals ("walls" doesn't contain "wall"),
// so each query word also gets checked against a singularized form (and
// vice versa) before falling back to a straight substring check.
function textMatchesWord(text, word) {
  if (text.includes(word)) return true;
  if (word.endsWith("s") && text.includes(word.slice(0, -1))) return true;
  if (!word.endsWith("s") && text.includes(`${word}s`)) return true;
  return false;
}

function productMatchesQuery(product, query) {
  if (!query) return true;
  const searchableText = `${product.categoryName ?? ""} ${product.name} ${product.spec} ${product.desc}`.toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  return words.every((word) => textMatchesWord(searchableText, word));
}

// Subtle cursor-tracked 3D tilt + glare. Ancestor `.hp-products-grid`
// supplies the perspective; this just drives the per-card CSS variables.
function handleCardMouseMove(e) {
  if (window.matchMedia("(hover: none)").matches) return;
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  card.style.setProperty("--tilt-x", `${(0.5 - py) * 12}deg`);
  card.style.setProperty("--tilt-y", `${(px - 0.5) * 12}deg`);
  card.style.setProperty("--glare-x", `${px * 100}%`);
  card.style.setProperty("--glare-y", `${py * 100}%`);
}

function handleCardMouseLeave(e) {
  const card = e.currentTarget;
  card.style.setProperty("--tilt-x", "0deg");
  card.style.setProperty("--tilt-y", "0deg");
}

function ProductCard({ product, hidden, showCategory, onOpen }) {
  return (
    <article
      className={`hp-product-card hp-anim-item${hidden ? " hp-product-card--hidden" : ""}`}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      onAnimationEnd={clearAnimOnEnd}
      onClick={onOpen}
      role="button"
      tabIndex={hidden ? -1 : 0}
      aria-label={`View ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="hp-product-card__img">
        <img
          src={product.img}
          alt={product.name}
          className="hp-product-card__img-el"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="hp-product-card__glare" aria-hidden="true" />
      <div className="hp-product-card__body">
        <span className="hp-product-card__spec">
          {showCategory ? `${product.categoryName} · ${product.spec}` : product.spec}
        </span>
        <h3>{product.name}</h3>
        <p>{product.desc}</p>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  usePageMeta({
    title: "Products | US Panels",
    description: "Browse our complete line of insulated wall panels, roof panels, fire-rated panels, cold storage panels, doors, and trim & hardware.",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useNavScroll(menuOpen);
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const { registerReveal } = useRevealOnScroll();
  const [toast, setToast] = useToast();

  // Clicking any product card opens a shared lightbox "album" scoped to
  // whichever list that card belongs to (its category's products when
  // browsing, or the current search results when searching) — next/prev
  // cycles through that same list, landing on the clicked card's position.
  const [albumImages, setAlbumImages] = useState([]);
  const albumLightbox = useLightbox(albumImages.length);
  function openAlbum(images, index) {
    setAlbumImages(images);
    albumLightbox.openLightbox(index);
  }

  // Debounced separately from `query` itself: the input needs to feel
  // instant as you type, but the filter/cascade effect below re-runs a
  // forced-reflow pass over every visible product card on every change to
  // this value — doing that on every keystroke caused visible stutter
  // while typing. Decoupling the two means typing stays snappy while the
  // (more expensive) card re-filter settles ~180ms after you stop.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(timer);
  }, [query]);

  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const isSearching = normalizedQuery !== "";

  // Clicking a category in the top nav needs to clear any active search or
  // chip filter first — otherwise the target section could still be
  // `display: none` and the click would silently do nothing. The actual
  // scroll happens in an effect (below), after that filter reset has
  // rendered and the section is genuinely visible.
  function handleNavSectionClick(id) {
    setQuery("");
    setActiveCategoryId("all");
    setPendingScrollId(id);
  }

  const productsNavLinks = PRODUCTS_NAV_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    onClick: () => handleNavSectionClick(section.id),
  }));

  useEffect(() => {
    if (!pendingScrollId) return;
    scrollCenter(pendingScrollId);
    const raf = requestAnimationFrame(() => setPendingScrollId(null));
    return () => cancelAnimationFrame(raf);
  }, [pendingScrollId, normalizedQuery, activeCategoryId]);

  const visibleSearchProducts = ALL_PRODUCTS.filter(
    (product) =>
      (activeCategoryId === "all" || activeCategoryId === product.categoryId) &&
      productMatchesQuery(product, normalizedQuery)
  );

  const categoryHasResults = Object.fromEntries(
    PRODUCT_CATEGORIES.map((category) => [
      category.id,
      activeCategoryId === "all" || activeCategoryId === category.id,
    ])
  );

  const totalResults = isSearching
    ? visibleSearchProducts.length
    : PRODUCT_CATEGORIES.reduce((sum, c) => (categoryHasResults[c.id] ? sum + c.products.length : sum), 0);
  const animatedTotalResults = useCountUp(totalResults);

  // The category headings, blurbs, and cards play their entrance animation
  // (a class removed, reflowed, and re-added — the reliable way to restart
  // a CSS animation) both on first mount — i.e. every time this page is
  // navigated to — and again on every search/category-filter change, so
  // nothing needs to be scrolled into view to animate in. Scoped to
  // `.hp-products-category` specifically so the hero text and filter bar
  // (which use their own separate, mount-only animation — see
  // .hp-hero-fade) never replay just because someone typed a search.
  //
  // On that first mount specifically, sections cascade top-to-bottom (each
  // section's items starting a little after the previous section's),
  // continuing the hero's downward wave. Search/filter changes skip the
  // cascade and animate everything at once for a snappy, direct response.
  //
  // The "is this the first run" flag is flipped via a deferred timer
  // rather than immediately: React's Strict Mode intentionally mounts,
  // cleans up, and re-runs effects once synchronously in development to
  // surface bugs, and flipping the flag straight away would make that
  // harmless second pass land after it — losing the cascade in dev only.
  // Cancelling the timer in cleanup means both Strict Mode passes see
  // "first run" as true, while any later, genuinely user-triggered change
  // (which only happens after real async delay) correctly sees it as false.
  const isFirstRun = useRef(true);
  useEffect(() => {
    const cascade = isFirstRun.current;
    const timer = setTimeout(() => {
      isFirstRun.current = false;
    }, 0);

    const root = document.querySelector(".hp-products-page");
    if (root) {
      const sections = Array.from(root.querySelectorAll(".hp-products-category")).filter(
        (section) => !section.classList.contains("hp-products-hidden")
      );

      sections.forEach((section, sectionIndex) => {
        const items = Array.from(section.querySelectorAll(".hp-anim-item")).filter(
          (el) => !el.closest(".hp-product-card--hidden")
        );
        items.forEach((el, itemIndex) => {
          // 1.35s = just after the hero/filter bar's own animation fully
          // settles (filter bar starts at 0.6s, runs 0.7s), so the category
          // cascade begins only once the hero block is completely done
          // rather than overlapping with its tail end.
          const sectionDelay = cascade ? 1.35 + sectionIndex * 0.16 : 0;
          const itemDelay = Math.min(itemIndex, 8) * 0.045;
          el.style.animationDelay = `${(sectionDelay + itemDelay).toFixed(3)}s`;
          el.classList.remove("hp-filter-anim", "hp-anim-done");
          void el.offsetWidth;
          el.classList.add("hp-filter-anim");
        });
      });
    }

    return () => clearTimeout(timer);
  }, [normalizedQuery, activeCategoryId]);

  return (
    <div className="hp-app hp-products-page">
      <Nav
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navRef={navRef}
        logo={logo}
        logoTo="/"
        links={productsNavLinks}
        ctaLabel="Request pricing"
      />

      <section className="hp-products-hero">
        <p className="hp-eyebrow hp-hero-fade">Full product catalog</p>
        <h1 className="hp-hero-heading">
          {HERO_HEADING_WORDS.map((word, i) => (
            <span className="hp-hero-word" style={{ animationDelay: `${i * 0.055}s` }} key={`${word}-${i}`}>
              {word}
              {i < HERO_HEADING_WORDS.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <p className="hp-products-hero__sub hp-hero-fade" style={{ animationDelay: "0.45s" }}>
          Browse our complete line of insulated wall panels, roof panels,
          fire-rated panels, cold storage panels, and doors.
        </p>
      </section>

      <div className="hp-products-filter hp-hero-fade" style={{ animationDelay: "0.6s" }}>
        <div className="hp-products-filter__search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
          />
        </div>
        <div className="hp-products-filter__chips" role="group" aria-label="Filter by category">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`hp-products-filter__chip${activeCategoryId === filter.id ? " is-active" : ""}`}
              aria-pressed={activeCategoryId === filter.id}
              onClick={() => setActiveCategoryId(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {totalResults === 0 && (
        <p className="hp-products-empty">
          No products match "{query}". Try a different search term or category.
        </p>
      )}

      {/* Merged, flat results — always mounted, shown only while searching.
          Filtering toggles each card's own hidden class instead of adding/
          removing it from the array, so cards never remount mid-search. */}
      <section
        className={`hp-products-category${isSearching ? "" : " hp-products-hidden"}`}
        id="search-results"
      >
        <div className="hp-products-category__inner">
          <h2 className="hp-anim-item" onAnimationEnd={clearAnimOnEnd}>
            {animatedTotalResults} result{animatedTotalResults === 1 ? "" : "s"} for "{query}"
          </h2>
          <div className="hp-products-grid">
            {ALL_PRODUCTS.map((product) => (
              <ProductCard
                key={`search-${product.categoryId}-${product.name}`}
                product={product}
                hidden={!visibleSearchProducts.includes(product)}
                showCategory
                onOpen={() =>
                  openAlbum(visibleSearchProducts.map(toAlbumItem), visibleSearchProducts.indexOf(product))
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category-grouped browsing view — always mounted, shown only when
          not searching. Category chips hide a whole section via CSS. */}
      <div className={isSearching ? "hp-products-hidden" : undefined}>
        {PRODUCT_CATEGORIES.map((category) => (
          <section
            className={`hp-products-category${categoryHasResults[category.id] ? "" : " hp-products-hidden"}`}
            id={category.id}
            key={category.id}
          >
            <div className="hp-products-category__inner">
              <h2 className="hp-anim-item" onAnimationEnd={clearAnimOnEnd}>{category.name}</h2>
              <p className="hp-products-category__blurb hp-anim-item" onAnimationEnd={clearAnimOnEnd}>
                {category.blurb}
              </p>
              <div className="hp-products-grid">
                {category.products.map((product, i) => (
                  <ProductCard
                    key={`browse-${category.id}-${product.name}`}
                    product={product}
                    hidden={false}
                    onOpen={() => openAlbum(category.products.map(toAlbumItem), i)}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <Contact registerReveal={registerReveal} onToast={setToast} />

      <Footer logo={logo} />

      <Toast toast={toast} onClose={() => setToast(null)} />

      {albumLightbox.lightboxOpen && (
        <Lightbox
          images={albumImages}
          index={albumLightbox.lightboxIndex}
          onClose={albumLightbox.closeLightbox}
          onNext={albumLightbox.lightboxNext}
          onPrev={albumLightbox.lightboxPrev}
        />
      )}
    </div>
  );
}

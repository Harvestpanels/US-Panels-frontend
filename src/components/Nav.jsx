import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Nav.css";
import { navClick, scrollToTop } from "../utils/scroll";

// Matches the mobile dropdown's own max-height collapse duration (see
// .hp-nav__mobile in Nav.css) — the same delay navClick already uses for
// anchor links from the mobile menu.
const MOBILE_MENU_CLOSE_MS = 380;

// Total length of the hp-nav-fold-in animation (see Nav.css) plus a small
// buffer.
const FOLD_ANIMATION_MS = 1650;

const HOME_NAV_LINKS = [
  { to: "/products", label: "Products" },
  { id: "why", label: "Who We Are" },
  { id: "panels", label: "Overview" },
  { id: "gallery", label: "Gallery" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export default function Nav({
  menuOpen,
  setMenuOpen,
  navRef,
  logo,
  links = HOME_NAV_LINKS,
  logoTo,
  ctaLabel = "Get a quote",
  ctaHref = "#contact",
  ctaTo,
}) {
  // Plays once per mount (every page navigation), then goes away for good.
  // Driven by React state rather than a CSS class alone: the mobile
  // breakpoint (see Nav.css, max-width: 1024px) sets `animation: none` on
  // the fold elements to disable the transition below desktop widths,
  // which interrupts the animation mid-flight instead of letting it
  // finish — so a plain onAnimationEnd-only class removal never fires,
  // and the class stays attached indefinitely. If the viewport later
  // crosses back above 1024px (e.g. zooming with ctrl+scroll), `animation`
  // flips from `none` back to the real keyframes and the browser restarts
  // the whole fold/slide sequence from scratch. This timeout guarantees
  // `folding` flips to false shortly after mount regardless of whether the
  // animation ever got to finish naturally, and the fold overlay is fully
  // unmounted (not just hidden) once it does — so no later viewport change
  // can resurrect either one.
  const [folding, setFolding] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setFolding(false), FOLD_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const logoEl = logoTo ? (
    <Link to={logoTo} className="hp-logo" aria-label="US Panels — home">
      <img src={logo} alt="US Panels" className="hp-logo__img" />
    </Link>
  ) : (
    <button className="hp-logo" onClick={scrollToTop} aria-label="US Panels — scroll to top">
      <img src={logo} alt="US Panels" className="hp-logo__img" />
    </button>
  );

  const renderLink = (link, { onNavigate, ...extraProps } = {}) => {
    if (link.to) {
      // From the mobile dropdown (onNavigate present), route changes used
      // to fire immediately on click — the whole Nav (and the mobile menu
      // with it) would unmount mid-way through its own 0.38s close
      // animation, cutting it off abruptly instead of letting it finish
      // like anchor-link clicks already do (see navClick's matching
      // delay). Desktop links have no menu to close, so they keep
      // navigating immediately.
      const handleClick = onNavigate
        ? (e) => {
            e.preventDefault();
            onNavigate();
            setTimeout(() => navigate(link.to), MOBILE_MENU_CLOSE_MS);
          }
        : undefined;
      return (
        <Link key={link.to} to={link.to} onClick={handleClick} {...extraProps}>
          {link.label}
        </Link>
      );
    }
    // `onClick`, when given, fully replaces the default anchor-scroll
    // (e.g. a page with filterable sections needs to clear its filters
    // before scrolling, or the target section could still be hidden).
    const handleClick = link.onClick
      ? (e) => {
          e.preventDefault();
          link.onClick();
          onNavigate?.();
        }
      : (e) => navClick(e, link.id, onNavigate);
    return (
      <a key={link.id} href={`#${link.id}`} onClick={handleClick} {...extraProps}>
        {link.label}
      </a>
    );
  };

  const desktopCta = ctaTo ? (
    <Link to={ctaTo} className="hp-nav__quote">{ctaLabel}</Link>
  ) : (
    <a href={ctaHref} className="hp-nav__quote" onClick={(e) => navClick(e, ctaHref.replace("#", ""))}>
      {ctaLabel}
    </a>
  );

  const mobileCta = ctaTo ? (
    <Link to={ctaTo} className="hp-nav__quote hp-nav__mobile-cta" tabIndex={menuOpen ? 0 : -1}>
      {ctaLabel}
    </Link>
  ) : (
    <a
      href={ctaHref}
      className="hp-nav__quote hp-nav__mobile-cta"
      tabIndex={menuOpen ? 0 : -1}
      onClick={(e) => navClick(e, ctaHref.replace("#", ""), () => setMenuOpen(false))}
    >
      {ctaLabel}
    </a>
  );

  return (
    <nav className={`hp-nav${menuOpen ? " hp-nav--open" : ""}`} ref={navRef} aria-label="Main navigation">
      {/* Shown only while the pill is folding/unfolding: starts centered
          over the folded circle, then slides left to land exactly where
          the real logo (inside .hp-nav__inner below) sits, handing off to
          it there instead of just fading away mid-air. Kept outside the
          pill (which animates its own width/radius for the circle shape)
          so this slide stays a pure translateX with no distortion.
          Unmounted entirely once `folding` goes false (not just hidden),
          so it can never replay from a later viewport change. */}
      {folding && (
        <div className="hp-nav__fold-logo" aria-hidden="true">
          <img src={logo} alt="" />
        </div>
      )}
      <div
        className={`hp-nav__pill${folding ? " hp-nav__pill--fold" : ""}`}
        onAnimationEnd={(e) => {
          // Plays once on every mount — i.e. every page navigation, since
          // each page mounts its own fresh Nav — folding the pill in and
          // revealing the (already page-specific) links/button. A held
          // animation would otherwise permanently block the pill's other
          // transform-driven states (the solid-on-scroll effect, the
          // mobile hover scale), so it's stripped once it finishes.
          if (e.animationName === "hp-nav-fold-in") setFolding(false);
        }}
      >
        <div className="hp-nav__inner">
          {/* Deliberately NOT wrapped in the same fade-in as the group
              below: nested opacity compounds, so if the logo shared a
              fading ancestor with the links/button, it would visibly fade
              in too — a second, subtler fade stacked right on top of the
              fold-logo overlay's own fade-out, which read as a flicker. It
              gets its own instant reveal instead (see .hp-nav__logo-slot
              in Nav.css), snapping to visible in sync with the overlay
              disappearing rather than fading in underneath it. */}
          <div className="hp-nav__logo-slot">{logoEl}</div>
          <div className="hp-nav__inner-content">
            <div className="hp-nav__links">
              {links.map((link) => renderLink(link))}
            </div>
            {desktopCta}
            <button
              className={`hp-nav__hamburger${menuOpen ? " is-open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="hp-nav__hamburger-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        <div className={`hp-nav__mobile${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
          {links.map((link) =>
            renderLink(link, { tabIndex: menuOpen ? 0 : -1, onNavigate: () => setMenuOpen(false) })
          )}
          {mobileCta}
        </div>
      </div>
    </nav>
  );
}

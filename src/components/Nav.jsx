import { Link } from "react-router-dom";
import "./Nav.css";
import { navClick, scrollToTop } from "../utils/scroll";

const HOME_NAV_LINKS = [
  { to: "/products", label: "Products" },
  { id: "why", label: "Who We Are" },
  { id: "panels", label: "Panels & Roofs" },
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
      return <Link key={link.to} to={link.to} onClick={onNavigate} {...extraProps}>{link.label}</Link>;
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
      <div className="hp-nav__pill">
        <div className="hp-nav__inner">
          {logoEl}
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
            <img src={logo} alt="" className="hp-nav__hamburger-icon" />
            <span className="hp-nav__hamburger-close">
              <span />
              <span />
            </span>
          </button>
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

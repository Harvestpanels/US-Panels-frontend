import "./Nav.css";
import { navClick, scrollToTop } from "../utils/scroll";

const NAV_LINKS = [
  { id: "why", label: "Who We Are" },
  { id: "panels", label: "Panels & Roofs" },
  { id: "gallery", label: "Gallery" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export default function Nav({ menuOpen, setMenuOpen, navRef, logo }) {
  return (
    <nav className={`hp-nav${menuOpen ? " hp-nav--open" : ""}`} ref={navRef} aria-label="Main navigation">
      <div className="hp-nav__pill">
        <div className="hp-nav__inner">
          <button className="hp-logo" onClick={scrollToTop} aria-label="US Panels — scroll to top">
            <img src={logo} alt="US Panels" className="hp-logo__img" />
          </button>
          <div className="hp-nav__links">
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={`#${link.id}`} onClick={(e) => navClick(e, link.id)}>{link.label}</a>
            ))}
          </div>
          <a href="#contact" className="hp-nav__quote" onClick={(e) => navClick(e, "contact")}>
            Get a quote
          </a>
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
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} tabIndex={menuOpen ? 0 : -1} onClick={(e) => navClick(e, link.id, () => setMenuOpen(false))}>{link.label}</a>
          ))}
          <a href="#contact" className="hp-nav__quote hp-nav__mobile-cta" tabIndex={menuOpen ? 0 : -1} onClick={(e) => navClick(e, "contact", () => setMenuOpen(false))}>Get a quote</a>
        </div>
      </div>
    </nav>
  );
}

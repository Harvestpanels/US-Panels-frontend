import "./Hero.css";
import { CONTACT } from "../data/site";
import { navClick } from "../utils/scroll";

export default function Hero({ heroContentRef }) {
  return (
    <header className="hp-hero">
      <div className="hp-hero__content" ref={heroContentRef}>
        <p className="hp-eyebrow">
          Insulated metal panels &amp; doors &middot; immediate availability
        </p>
        <h1>
          Fast building.
          <br />
          Smarter solutions.
        </h1>
        <p className="hp-hero__sub">
          US Panels is a global distributor of exterior Insulated Metal
          Panels and Doors for Industrial, Commercial, and
          Residential projects.
        </p>
        <div className="hp-hero__ctas">
          <a
            href="#panels"
            className="hp-btn hp-btn--primary"
            onClick={(e) => navClick(e, "panels")}
          >
            Shop panels
          </a>
          <a href={`tel:${CONTACT.phoneHref}`} className="hp-btn hp-btn--ghost">
            Call today: {CONTACT.phone}
          </a>
        </div>
      </div>
    </header>
  );
}

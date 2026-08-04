import "./Memberships.css";
import bbbLogo from "../assets/images/Sections/Memberships/BBB Logo.webp";
import cebaLogo from "../assets/images/Sections/Memberships/CEBA Logo.webp";
import gccaLogo from "../assets/images/Sections/Memberships/GCCA Logo.webp";
import mbceaLogo from "../assets/images/Sections/Memberships/MBCEA Logo.webp";

const MEMBERSHIPS = [
  {
    logo: mbceaLogo,
    name: "MBCEA",
    desc: "Metal Building Contractors & Erectors Association, supporting the metal building industry nationwide through education, advocacy, and shared safety and erection standards.",
  },
  {
    logo: gccaLogo,
    name: "GCCA",
    desc: "Global Cold Chain Alliance, the leading trade association for the temperature-controlled supply chain, connecting cold storage and logistics providers worldwide.",
  },
  {
    logo: bbbLogo,
    name: "BBB",
    desc: "Better Business Bureau, a trusted nonprofit that sets standards for ethical business practices and helps customers find businesses they can rely on.",
  },
  {
    logo: cebaLogo,
    name: "CEBA",
    desc: "Controlled Environment Building Association, advancing design, construction, and performance standards for controlled environment buildings.",
  },
];

// Flip is driven purely by CSS :hover (see Memberships.css) — not
// click/tap. It used to also toggle on click via local React state, but
// that state living on the same element .hp-reveal/registerReveal governs
// caused a real bug: toggling `flipped` changes the computed className
// string every click, and React fully replaces an element's className on
// any string change — which silently wiped out the "is-visible" class
// that registerReveal's IntersectionObserver had added *imperatively*
// (via classList.add, outside React's own tracking). The card would
// instantly revert to .hp-reveal's default opacity: 0 state — reading as
// the whole card "fading out" the moment it was clicked. Removing the
// click-driven state entirely (this card was never meant to be clickable)
// removes the re-render that caused it, not just the symptom.
function MembershipCard({ logo, name, desc, registerReveal }) {
  return (
    <article
      className="hp-membership-badge hp-reveal"
      ref={registerReveal}
    >
      <div className="hp-membership-badge__inner">
        <div className="hp-membership-badge__face hp-membership-badge__face--front">
          <img
            src={logo}
            alt={name}
            className="hp-membership-badge__logo"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="hp-membership-badge__face hp-membership-badge__face--back">
          <h3>{name}</h3>
          <p>{desc}</p>
        </div>
      </div>
    </article>
  );
}

export default function Memberships({ registerReveal }) {
  return (
    <section className="hp-section" id="memberships">
      <div className="hp-section__inner">
        <div className="hp-glass">
          <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Affiliations</p>
          <h2 className="hp-reveal" ref={registerReveal}>Proud member of leading industry organizations</h2>
          <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>
            Our membership in these organizations reflects our commitment to
            industry standards, ethical business practices, and continued
            excellence on every project we deliver.
          </p>
          <div className="hp-membership-grid">
            {MEMBERSHIPS.map((m) => (
              <MembershipCard key={m.name} {...m} registerReveal={registerReveal} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

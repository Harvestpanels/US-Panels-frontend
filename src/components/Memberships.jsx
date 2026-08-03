import "./Memberships.css";

const MEMBERSHIPS = [
  {
    acronym: "MBCEA",
    name: "Metal Building Contractor & Erector Association",
  },
  {
    acronym: "GCCA",
    name: "Global Cold Chain Alliance",
  },
  {
    acronym: "BBB",
    name: "Better Business Bureau",
  },
  {
    acronym: "CEBA",
    name: "Controlled Environment Building Association",
  },
];

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
              <article className="hp-membership-badge" key={m.acronym} ref={registerReveal}>
                <span className="hp-membership-badge__mark">
                  <span className="hp-membership-badge__acronym">{m.acronym}</span>
                </span>
                <span className="hp-membership-badge__name">{m.name}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

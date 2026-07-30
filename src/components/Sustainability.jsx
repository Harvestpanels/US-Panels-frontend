import "./Sustainability.css";

const CARDS = [
  {
    title: "Material & Sourcing",
    body: "Panels manufactured with recycled steel content and responsibly sourced raw materials, with the embodied carbon of the panels themselves factored into every product decision we make.",
  },
  {
    title: "Performance & Efficiency",
    body: "High R-value insulation and airtight seams cut building energy use for the life of the structure, while panel durability stretches replacement cycles far beyond conventional cladding.",
  },
  {
    title: "End-of-Life & Circularity",
    body: "A long useful life on the building itself, steel cores that are fully recyclable at the end of that life, and take-back options that keep panels out of the landfill.",
  },
];

export default function Sustainability({ registerReveal }) {
  return (
    <section className="hp-section" id="sustainability">
      <div className="hp-section__inner">
        <div className="hp-glass">
          <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Sustainability</p>
          <h2 className="hp-reveal" ref={registerReveal}>Built to last, built responsibly</h2>
          <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>
            Insulated metal panels are already one of the more efficient ways to
            enclose a building, here's how we work to keep it that way from
            sourcing through end of life.
          </p>
          <div className="hp-cards">
            {CARDS.map((card) => (
              <article className="hp-card" key={card.title} ref={registerReveal}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

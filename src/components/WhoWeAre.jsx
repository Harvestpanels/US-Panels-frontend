import "./WhoWeAre.css";

const CARDS = [
  {
    title: "Who we are",
    body: "A global distributor of exterior Insulated Metal Panels and Doors, offering products and installation services to the Industrial, Commercial, and Residential markets, a modern, energy-efficient alternative to traditional construction.",
  },
  {
    title: "How we work",
    body: "Budgeting, design assistance, continuous communication, and quality workmanship on every project, working alongside architects, engineers, and designers to produce beautiful, multi-functional structures.",
  },
  {
    title: "Product availability",
    body: "Consistent supply of pre-cut panels and doors, with custom orders typically fulfilled within 30 days. Our Oklahoma-based distribution center delivers anywhere in the U.S. within 48 hours of departure.",
  },
];

export default function WhoWeAre({ registerReveal }) {
  return (
    <section className="hp-section" id="why">
      <div className="hp-section__inner">
        <div className="hp-glass">
          <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Welcome</p>
          <h2 className="hp-reveal" ref={registerReveal}>Built for the way you build</h2>
          <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>
            A global distributor of exterior insulated metal panels and doors,
            built to make every project faster, more efficient, and easier to manage
            from first estimate to final delivery.
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

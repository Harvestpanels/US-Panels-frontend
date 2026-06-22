import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIDEO_URL = "/skies.mp4";
const CURTAIN_URL =
  "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1920&q=80";

const CURRENT_YEAR = new Date().getFullYear();

const GALLERY_IMAGES = [
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_0380.jpeg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_4979.jpeg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse.jpg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/b206acf5-13ee-475b-a65d-00398f243975.JPG/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/pvc%20wall.jpg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/37253940_l-5b6bb8e.webp/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse%202.jpg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/74a5a362-e5c8-4ceb-a326-5fd0cd86305f%202.JPG/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/HR%20Rack1.jpg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20ceiling.jpg/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/12863561-52d0-466e-a0fb-8253e955b2f6.JPG/:/rs=w:1300,h:800",
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/0249337c-ae22-4276-8571-5a3e234cc0fd.JPG/:/rs=w:1300,h:800",
];

const INTERIOR_PANELS = [
  {
    name: "Indoor Cultivation",
    use: "Interior",
    desc: "An exact environment of controlled temperature, humidity, light reflection, and cleanliness — installed nationwide.",
    img: "https://images.unsplash.com/photo-1466692476655-ba23cdc1c742?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cold Storage",
    use: "Interior",
    desc: "Built using a wide variety of insulated metal panel materials, in almost any size, height, width, or condition.",
    img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Freezers",
    use: "Interior",
    desc: "Walk-in freezers and coolers built inside an existing facility or as a standalone structure, to your exact spec.",
    img: "https://images.unsplash.com/photo-1581093458791-9d09e1afe9d2?auto=format&fit=crop&w=800&q=80",
  },
];

const EXTERIOR_PANELS = [
  {
    name: "Industrial",
    use: "Exterior",
    desc: "From a 2,000 sqft shop to a 200,000 sqft factory, insulated metal panels save time and money on every build.",
    img: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Commercial",
    use: "Exterior",
    desc: "Commercial facilities need to look good and perform well. Insulated metal panels deliver both.",
    img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Residential",
    use: "Exterior",
    desc: "Single-family, multi-family, stand-alone, or connected — a great option for your next residential project.",
    img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  },
];

const FAQS = [
  {
    q: "Tell me about Harvest Panel Systems?",
    a: "Harvest Panel Systems is a global distributor of Insulated Metal Panels and Doors, serving the Indoor Cultivation, Industrial, Commercial, and Residential markets with a modern, energy-efficient alternative to traditional construction.",
  },
  {
    q: "What kind of services does Harvest Panels offer?",
    a: "We offer budgeting, design assistance, continuous communication, and quality workmanship on every Insulated Metal Panel and Door project, working alongside architects, engineers, and designers.",
  },
  {
    q: "Does Harvest Panels provide free estimates?",
    a: "Yes. Reach out through our contact form or by phone and our team will put together a no-cost estimate for your project.",
  },
  {
    q: "Is Harvest Panel Systems licensed and insured?",
    a: "Yes, Harvest Panel Systems is fully licensed and insured for panel and door installation projects nationwide.",
  },
  {
    q: "Who uses Insulated Metal Panels?",
    a: "Indoor cultivation facilities, cold storage and freezer operators, industrial and commercial builders, and residential developers all rely on insulated metal panels.",
  },
  {
    q: "How are Panels constructed?",
    a: "Panels are constructed from rigid foam insulation (such as PIR, PUR, or EPS) sandwiched between two metal facings, providing strength, insulation, and a clean finish in one system.",
  },
  {
    q: "What are your lead times?",
    a: "We maintain consistent supply in pre-cut lengths and can typically fulfill custom orders within 30 days.",
  },
  {
    q: "What are the benefits of using Panels?",
    a: "Energy efficiency, fast installation, durability, and design flexibility — all in a single system that reduces labor and long-term maintenance costs.",
  },
  {
    q: "Are Panels safe and easy to maintain?",
    a: "Yes. Insulated metal panels are low-maintenance, moisture-resistant, and built to hold up over decades of use.",
  },
  {
    q: "What products, other than Panels do you provide?",
    a: "Alongside Insulated Metal Panels, we supply and install Insulated Metal Doors for the same range of applications.",
  },
  {
    q: "How much do Panels Cost?",
    a: "Cost varies by panel type, thickness, finish, and project size. Contact us with your specs for an accurate, free estimate.",
  },
  {
    q: "What sizes do Panels come in?",
    a: "We stock common pre-cut lengths and can manufacture custom sizes to fit your exact project dimensions.",
  },
  {
    q: "Do you offer installation services?",
    a: "Yes, we offer full installation services in addition to supply-only orders.",
  },
  {
    q: "How long does it take to install Panels?",
    a: "Installation time depends on project size and scope, but panels are designed to go up quickly compared to traditional construction methods.",
  },
  {
    q: "Insulation Value?",
    a: "Insulation values (R-values) vary by panel thickness and core material — our team can recommend the right spec for your climate and use case.",
  },
  {
    q: "Can Panels support hanging of equipment?",
    a: "Yes, with the appropriate panel type and mounting hardware, panels can support hanging equipment and fixtures.",
  },
  {
    q: "Do you offer financing on Panels?",
    a: "Reach out to our sales team to discuss financing options available for your project.",
  },
  {
    q: "How are Panels delivered?",
    a: "Our centrally located Oklahoma-based distribution center ensures delivery anywhere in the U.S. within 48 hours after departure.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollCenter(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const target =
    window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
  window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

function navClick(e, id) {
  e.preventDefault();
  scrollCenter(id);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(data) {
  const errors = {};
  const name = data.get("name")?.toString().trim() ?? "";
  const email = data.get("email")?.toString().trim() ?? "";
  const phone = data.get("phone")?.toString().trim() ?? "";

  if (!name) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!phone) errors.phone = "Phone number is required.";

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function App() {
  const navRef = useRef(null);
  const curtainLayerRef = useRef(null);
  const videoRef = useRef(null);
  const curtainRef = useRef(null);
  const heroTextRef = useRef(null);

  const revealSet = useRef(new Set());
  const revealRefs = useRef([]);

  const [openFaq, setOpenFaq] = useState(null);
  const [formStatus, setFormStatus] = useState("idle");
  const [formErrors, setFormErrors] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

    const curtainProgress = Math.max(0, Math.min(1, y / (vh * 0.8)));
    if (curtainRef.current) {
      curtainRef.current.style.transform = `translate3d(0, ${curtainProgress * 100}%, 0)`;
    }
    if (curtainLayerRef.current) {
      curtainLayerRef.current.style.pointerEvents =
        curtainProgress >= 1 ? "none" : "auto";
    }
    if (heroTextRef.current) {
      const fade = Math.max(0, 1 - y / (vh * 0.5));
      heroTextRef.current.style.opacity = fade;
      heroTextRef.current.style.transform = `translate3d(0, ${(y / vh) * -40}px, 0)`;
    }

    revealRefs.current.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        el.classList.add("is-visible");
      }
    });
  }, []);

  useEffect(() => {
    let raf = null;
    let lastVideoTime = -1;
    let videoSeeking = false;
    let pendingTarget = null;
    const video = videoRef.current;

    // Detect touch/low-power devices — skip expensive video seeking on them
    const isTouch = window.matchMedia("(hover: none)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Hide video on touch devices (autoplay unreliable, battery drain)
    if (isTouch && videoRef.current) {
      videoRef.current.closest(".hp-bgvideo-layer").style.display = "none";
    }

    function seekVideo(target) {
      if (!video || isTouch || reducedMotion) return;
      if (videoSeeking) { pendingTarget = target; return; }
      lastVideoTime = target;
      videoSeeking = true;
      if (typeof video.fastSeek === "function") {
        video.fastSeek(target);
      } else {
        video.currentTime = target;
      }
    }

    function onSeeked() {
      videoSeeking = false;
      if (pendingTarget !== null) {
        const t = pendingTarget;
        pendingTarget = null;
        seekVideo(t);
      }
    }

    if (video && !isTouch) {
      video.addEventListener("seeked", onSeeked);
      video.pause();
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        const scrollable = document.documentElement.scrollHeight - vh;

        navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

        if (!reducedMotion) {
          const curtainProgress = Math.max(0, Math.min(1, y / (vh * 0.8)));
          if (curtainRef.current) {
            curtainRef.current.style.transform = `translate3d(0, ${curtainProgress * 100}%, 0)`;
          }
          if (curtainLayerRef.current) {
            curtainLayerRef.current.style.pointerEvents =
              curtainProgress >= 1 ? "none" : "auto";
          }

          // Parallax hero text — lighter movement on touch to stay crisp
          if (heroTextRef.current) {
            const fade = Math.max(0, 1 - y / (vh * 0.5));
            const shift = isTouch ? (y / vh) * -20 : (y / vh) * -40;
            heroTextRef.current.style.opacity = fade;
            heroTextRef.current.style.transform = `translate3d(0, ${shift}px, 0)`;
          }

          if (!isTouch && video?.duration && isFinite(video.duration) && scrollable > 0) {
            const progress = Math.max(0, Math.min(1, y / scrollable));
            const target = progress * video.duration;
            if (Math.abs(target - lastVideoTime) > 0.03) seekVideo(target);
          }
        }

        raf = null;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    onScroll();

    // Lower threshold on mobile so reveals trigger earlier (less content visible)
    const observerMargin = isTouch ? "0px 0px -5% 0px" : "0px 0px -10% 0px";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: observerMargin }
    );
    revealRefs.current.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      video?.removeEventListener("seeked", onSeeked);
    };
  }, []);

  function addReveal(el) {
    if (!el || revealSet.current.has(el)) return;
    revealSet.current.add(el);
    revealRefs.current.push(el);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const errors = validateForm(data);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormStatus("error");
      return;
    }

    setFormErrors({});
    setFormStatus("sent");
  }

  return (
    <div className="hp-app">
      {/* ===== NAV ===== */}
      <nav className={`hp-nav${menuOpen ? " hp-nav--open" : ""}`} ref={navRef} aria-label="Main navigation">
        <div className="hp-nav__pill">
          <div className="hp-nav__inner">
            <button
              className="hp-logo"
              onClick={scrollToTop}
              aria-label="Harvest Panel Systems — scroll to top"
            >
              Harvest<span>Panels</span>
            </button>
            <div className="hp-nav__links">
              <a href="#why"     onClick={(e) => { navClick(e, "why");     setMenuOpen(false); }}>Who We Are</a>
              <a href="#panels"  onClick={(e) => { navClick(e, "panels");  setMenuOpen(false); }}>Panels &amp; Doors</a>
              <a href="#gallery" onClick={(e) => { navClick(e, "gallery"); setMenuOpen(false); }}>Gallery</a>
              <a href="#faq"     onClick={(e) => { navClick(e, "faq");     setMenuOpen(false); }}>FAQ</a>
              <a href="#contact" onClick={(e) => { navClick(e, "contact"); setMenuOpen(false); }}>Contact</a>
            </div>
            <a
              href="#contact"
              className="hp-btn hp-btn--primary hp-btn--nav"
              onClick={(e) => { navClick(e, "contact"); setMenuOpen(false); }}
            >
              Get a quote
            </a>
            <button
              className="hp-nav__hamburger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          {/* Mobile dropdown */}
          <div className={`hp-nav__mobile${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
            <a href="#why"     onClick={(e) => { navClick(e, "why");     setMenuOpen(false); }}>Who We Are</a>
            <a href="#panels"  onClick={(e) => { navClick(e, "panels");  setMenuOpen(false); }}>Panels &amp; Doors</a>
            <a href="#gallery" onClick={(e) => { navClick(e, "gallery"); setMenuOpen(false); }}>Gallery</a>
            <a href="#faq"     onClick={(e) => { navClick(e, "faq");     setMenuOpen(false); }}>FAQ</a>
            <a href="#contact" onClick={(e) => { navClick(e, "contact"); setMenuOpen(false); }}>Contact</a>
            <a href="#contact" className="hp-btn hp-btn--primary hp-nav__mobile-cta" onClick={(e) => { navClick(e, "contact"); setMenuOpen(false); }}>Get a quote</a>
          </div>
        </div>
      </nav>

      {/* ===== FIXED VIDEO BACKGROUND ===== */}
      <div className="hp-bgvideo-layer" aria-hidden="true">
        <video
          className="hp-bgvideo"
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
        />
      </div>

      {/* ===== CURTAIN ===== */}
      <div className="hp-curtain-layer" ref={curtainLayerRef} aria-hidden="true">
        <div
          className="hp-curtain"
          ref={curtainRef}
          style={{ backgroundImage: `url(${CURTAIN_URL})` }}
        />
      </div>

      {/* ===== HERO ===== */}
      <header className="hp-hero">
        <div className="hp-hero__content" ref={heroTextRef}>
          <p className="hp-eyebrow">
            Insulated metal panels &amp; doors &middot; immediate availability
          </p>
          <h1>
            Fast building.
            <br />
            Smarter solutions.
          </h1>
          <p className="hp-hero__sub">
            Harvest Panel Systems is a global distributor of Insulated Metal
            Panels and Doors for Indoor Cultivation, Industrial, Commercial, and
            Residential projects.
          </p>
          <div className="hp-hero__ctas">
            <a
              href="#panels"
              className="hp-btn hp-btn--primary"
              onClick={(e) => navClick(e, "panels")}
            >
              Shop panels <span aria-hidden="true">&rarr;</span>
            </a>
            <a href="tel:4057231220" className="hp-btn hp-btn--ghost">
              Call today: (405) 723-1220
            </a>
          </div>
        </div>

      </header>

      {/* ===== WHO WE ARE ===== */}
      <section className="hp-section" id="why">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={addReveal}>Welcome</p>
            <h2 className="hp-reveal" ref={addReveal}>Built for the way you build</h2>
            <div className="hp-cards">
              <article className="hp-card" ref={addReveal}>
                <h3>Who we are</h3>
                <p>A global distributor of Insulated Metal Panels and Doors, offering products and installation services to the Indoor Cultivation, Industrial, Commercial, and Residential markets &mdash; a modern, energy-efficient alternative to traditional construction.</p>
              </article>
              <article className="hp-card" ref={addReveal}>
                <h3>How we work</h3>
                <p>Budgeting, design assistance, continuous communication, and quality workmanship on every project &mdash; working alongside architects, engineers, and designers to produce beautiful, multi-functional structures.</p>
              </article>
              <article className="hp-card" ref={addReveal}>
                <h3>Product availability</h3>
                <p>Consistent supply of pre-cut panels and doors, with custom orders typically fulfilled within 30 days. Our Oklahoma-based distribution center delivers anywhere in the U.S. within 48 hours of departure.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INTERIOR PANELS ===== */}
      <section className="hp-section" id="panels">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={addReveal}>Interior panels</p>
            <h2 className="hp-reveal" ref={addReveal}>Indoor cultivation &amp; cold storage</h2>
            <div className="hp-panel-grid">
              {INTERIOR_PANELS.map((panel) => (
                <article className="hp-panel-card hp-reveal" key={panel.name} ref={addReveal}>
                  <div className="hp-panel-card__img" style={{ backgroundImage: `url(${panel.img})` }} role="img" aria-label={panel.name} />
                  <div className="hp-panel-card__label">
                    <span className="hp-panel-card__use">{panel.use}</span>
                    <h3>{panel.name}</h3>
                    <p><span>{panel.desc}</span></p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXTERIOR PANELS ===== */}
      <section className="hp-section" id="exterior">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={addReveal}>Exterior panels</p>
            <h2 className="hp-reveal" ref={addReveal}>Industrial, commercial &amp; residential</h2>
            <div className="hp-panel-grid">
              {EXTERIOR_PANELS.map((panel) => (
                <article className="hp-panel-card hp-reveal" key={panel.name} ref={addReveal}>
                  <div className="hp-panel-card__img" style={{ backgroundImage: `url(${panel.img})` }} role="img" aria-label={panel.name} />
                  <div className="hp-panel-card__label">
                    <span className="hp-panel-card__use">{panel.use}</span>
                    <h3>{panel.name}</h3>
                    <p><span>{panel.desc}</span></p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="hp-section" id="gallery">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={addReveal}>Photo gallery</p>
            <h2 className="hp-reveal" ref={addReveal}>Projects from the field</h2>
            <div className="hp-gallery-grid">
              {GALLERY_IMAGES.map((src, i) => (
                <div className="hp-gallery-item hp-reveal" key={src} ref={addReveal}>
                  <img src={`https:${src}`} alt={`Harvest Panel Systems project ${i + 1}`} loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="hp-section" id="faq">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={addReveal}>FAQ</p>
            <h2 className="hp-reveal" ref={addReveal}>Frequently asked questions</h2>
            <p className="hp-faq__intro hp-reveal" ref={addReveal}>
              Please reach us at <a href="mailto:sales@harvestpanels.com">sales@harvestpanels.com</a> if you cannot find an answer to your question.
            </p>
            <div className="hp-faq-list">
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i;
                const answerId = `faq-answer-${i}`;
                return (
                  <div className="hp-faq-item" key={item.q}>
                    <button
                      type="button"
                      className="hp-faq-item__q"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                    >
                      {item.q}
                      <span className="hp-faq-item__icon" aria-hidden="true">+</span>
                    </button>
                    <div id={answerId} className={`hp-faq-item__a${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="hp-section" id="contact">
        <div className="hp-section__inner">
          <div className="hp-glass hp-contact__grid">
            <div className="hp-contact__info">
              <p className="hp-section__eyebrow hp-reveal" ref={addReveal}>Contact us</p>
              <h2 className="hp-reveal" ref={addReveal}>Email now for more information</h2>
              <p className="hp-reveal" ref={addReveal}>Better yet, see us in person! We love our customers, so feel free to visit during normal business hours.</p>
              <ul className="hp-contact__details hp-reveal" ref={addReveal}>
                <li>
                  <strong>Address</strong>
                  <span>5920 Campbell Ln, Piedmont, Oklahoma 73078, United States</span>
                </li>
                <li>
                  <strong>Phone</strong>
                  <span><a href="tel:4057231220">(405) 723-1220</a></span>
                </li>
                <li>
                  <strong>Email</strong>
                  <span><a href="mailto:Sales@harvestpanels.com">Sales@harvestpanels.com</a></span>
                </li>
              </ul>
            </div>

            {formStatus === "sent" ? (
              <div className="hp-form-success hp-reveal" ref={addReveal} role="status" aria-live="polite">
                <p className="hp-form-success__title">Message sent!</p>
                <p>Thanks for reaching out. Our team will get back to you within one business day.</p>
                <button type="button" className="hp-btn hp-btn--ghost" onClick={() => { setFormStatus("idle"); setFormErrors({}); }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="hp-contact__form hp-reveal" ref={addReveal} onSubmit={handleSubmit} noValidate>
                {formStatus === "error" && (
                  <p className="hp-form-error-banner" role="alert" aria-live="assertive">
                    Please fix the errors below before submitting.
                  </p>
                )}

                <label htmlFor="f-name">Name <span aria-hidden="true">*</span></label>
                <input id="f-name" type="text" name="name" autoComplete="name" aria-required="true" aria-describedby={formErrors.name ? "f-name-err" : undefined} aria-invalid={!!formErrors.name} />
                {formErrors.name && <span id="f-name-err" className="hp-field-error" role="alert">{formErrors.name}</span>}

                <label htmlFor="f-email">Email <span aria-hidden="true">*</span></label>
                <input id="f-email" type="email" name="email" autoComplete="email" aria-required="true" aria-describedby={formErrors.email ? "f-email-err" : undefined} aria-invalid={!!formErrors.email} />
                {formErrors.email && <span id="f-email-err" className="hp-field-error" role="alert">{formErrors.email}</span>}

                <label htmlFor="f-phone">Phone <span aria-hidden="true">*</span></label>
                <input id="f-phone" type="tel" name="phone" autoComplete="tel" aria-required="true" aria-describedby={formErrors.phone ? "f-phone-err" : undefined} aria-invalid={!!formErrors.phone} />
                {formErrors.phone && <span id="f-phone-err" className="hp-field-error" role="alert">{formErrors.phone}</span>}

                <label htmlFor="f-message">Message</label>
                <textarea id="f-message" name="message" rows={4} />

                <label htmlFor="f-attachment" className="hp-contact__file">Attach floor plan for a quote</label>
                <input id="f-attachment" type="file" name="attachment" accept=".pdf,.dwg,.png,.jpg,.jpeg" className="hp-file-input" />

                <button type="submit" className="hp-btn hp-btn--primary">Send message</button>
                <p className="hp-contact__legal">By submitting this form you agree to be contacted by Harvest Panel Systems regarding your inquiry.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="hp-footer">
        <div className="hp-footer__inner">
          <div>
            <button className="hp-logo hp-logo--footer" onClick={scrollToTop} aria-label="Harvest Panel Systems — scroll to top">
              Harvest<span>Panels</span>
            </button>
            <p>5920 Campbell Ln, Piedmont, Oklahoma 73078, United States</p>
            <p>
              <a href="tel:4057231220">(405) 723-1220</a> &middot;{" "}
              <a href="mailto:Sales@harvestpanels.com">Sales@harvestpanels.com</a>
            </p>
          </div>
          <div className="hp-footer__social" aria-label="Social media links">
            <a href="https://www.facebook.com/people/Harvest-Panels/61555678774736/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
            </a>
            <a href="https://www.instagram.com/harvestpanels/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@harvestpanels" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z" /></svg>
            </a>
            <a href="https://x.com/harvestpanels" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
            </a>
          </div>
        </div>
        <p className="hp-footer__legal">
          Insulated metal panel, insulation panel, insulated panel door, pir panel, pur panel, eps panel, cannabis cultivation panel, grow room, grow house panel, Harvest Park OK, panel manufacturer.
          <br />
          &copy; {CURRENT_YEAR} Harvest Panel Systems &mdash; All Rights Reserved. A Globus Ventures Company.
        </p>
      </footer>
    </div>
  );
}

export default App;



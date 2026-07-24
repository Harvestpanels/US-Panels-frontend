import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";
import logo from "./assets/us-panels-logo.png";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIDEO_URL = "/skies.mp4";
const PARALLAX_BG_URL =
  "CurtainBG.png";

const CURRENT_YEAR = 2022;
const GALLERY_GAP_PX = 16;

const GALLERY_IMAGES = [
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_0380.jpeg/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Insulated Panel Corridor",
    desc: "A finished interior hallway built entirely from insulated metal panels, ready for climate-controlled use.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_4979.jpeg/:/rs=w:1300,h:800",
    category: "Production",
    title: "Panel Fabrication Facility",
    desc: "Inside one of our fabrication spaces where panels are prepped and staged before delivery.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse.jpg/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Steel Frame Under Construction",
    desc: "The structural steel frame going up ahead of panel installation on an industrial build.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/b206acf5-13ee-475b-a65d-00398f243975.JPG/:/rs=w:1300,h:800",
    category: "Cold Storage",
    title: "High-Speed Roll-Up Door",
    desc: "An insulated high-speed door installed for fast, efficient access in a cold storage environment.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/pvc%20wall.jpg/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Corrugated Wall Panel",
    desc: "A durable, corrugated metal wall panel finish suited for industrial and warehouse interiors.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/37253940_l-5b6bb8e.webp/:/rs=w:1300,h:800",
    category: "Cold Storage",
    title: "Cold Storage Sliding Door",
    desc: "A heavy-duty sliding door built for consistent temperature control in a cold storage facility.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse%202.jpg/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Structural Steel Framing",
    desc: "A wide-span steel frame under construction, engineered to carry insulated panel cladding.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/74a5a362-e5c8-4ceb-a326-5fd0cd86305f%202.JPG/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Modular Insulated Enclosure",
    desc: "A compact, standalone insulated enclosure built for a specialized on-site application.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/HR%20Rack1.jpg/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Warehouse Racking System",
    desc: "High-density racking installed inside a panel-built warehouse for efficient storage.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20ceiling.jpg/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Panel Ceiling Installation",
    desc: "Insulated ceiling panels installed for full thermal envelope coverage.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/12863561-52d0-466e-a0fb-8253e955b2f6.JPG/:/rs=w:1300,h:800",
    category: "Production",
    title: "Panel Production Line",
    desc: "Panels moving through production, ready for cutting, finishing, and shipment.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/0249337c-ae22-4276-8571-5a3e234cc0fd.JPG/:/rs=w:1300,h:800",
    category: "Production",
    title: "Finished Panel Stock",
    desc: "Finished insulated panels staged and ready for delivery to the job site.",
  },
];

const BUILDING_ENVELOPE_PANELS = [
  {
    name: "Structural Framing",
    category: "Building Envelope",
    desc: "The steel frame goes up first, engineered to carry the insulated panel envelope from the ground up.",
    // Photo: US Panels project photo — steel frame under construction
    img: "https://img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse.jpg/:/rs=w:800,h:1000",
  },
  {
    name: "Site Assembly",
    category: "Building Envelope",
    desc: "Framing complete and the site prepped, ready for the panel envelope to go up wall by wall.",
    // Photo: US Panels project photo — steel frame under construction, interior view
    img: "https://img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse%202.jpg/:/rs=w:800,h:1000",
  },
  {
    name: "Panel Installation",
    category: "Building Envelope",
    desc: "Panels are lifted and fastened into place, sealing the building envelope as installation moves down the wall.",
    // Photo: US Panels project photo — wall panel installation in progress
    img: "https://img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_4979.jpeg/:/rs=w:800,h:1000",
  },
];

const EXTERIOR_PANELS = [
  {
    name: "Industrial",
    category: "Exterior",
    desc: "From a 2,000 sqft shop to a 200,000 sqft factory, insulated metal panels save time and money on every build.",
    img: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Commercial",
    category: "Exterior",
    desc: "Commercial facilities need to look good and perform well. Insulated metal panels deliver both.",
    img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Residential",
    category: "Exterior",
    desc: "Single-family, multi-family, stand-alone, or connected — a great option for your next residential project.",
    img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  },
];

const FAQS = [
  {
    question: "Tell me about US Panels?",
    answer: "US Panels is a global distributor of Insulated Metal Panels and Doors, serving the Indoor Cultivation, Industrial, Commercial, and Residential markets with a modern, energy-efficient alternative to traditional construction.",
  },
  {
    question: "What kind of services does US Panels offer?",
    answer: "We offer budgeting, design assistance, continuous communication, and quality workmanship on every Insulated Metal Panel and Door project, working alongside architects, engineers, and designers.",
  },
  {
    question: "Does US Panels provide free estimates?",
    answer: "Yes. Reach out through our contact form or by phone and our team will put together a no-cost estimate for your project.",
  },
  {
    question: "Is US Panels licensed and insured?",
    answer: "Yes, US Panels is fully licensed and insured for panel and door installation projects nationwide.",
  },
  {
    question: "Who uses Insulated Metal Panels?",
    answer: "Indoor cultivation facilities, cold storage and freezer operators, industrial and commercial builders, and residential developers all rely on insulated metal panels.",
  },
  {
    question: "How are Panels constructed?",
    answer: "Panels are constructed from rigid foam insulation (such as PIR, PUR, or EPS) sandwiched between two metal facings, providing strength, insulation, and a clean finish in one system.",
  },
  {
    question: "What are your lead times?",
    answer: "We maintain consistent supply in pre-cut lengths and can typically fulfill custom orders within 30 days.",
  },
  {
    question: "What are the benefits of using Panels?",
    answer: "Energy efficiency, fast installation, durability, and design flexibility — all in a single system that reduces labor and long-term maintenance costs.",
  },
  {
    question: "Are Panels safe and easy to maintain?",
    answer: "Yes. Insulated metal panels are low-maintenance, moisture-resistant, and built to hold up over decades of use.",
  },
  {
    question: "What products, other than Panels do you provide?",
    answer: "Alongside Insulated Metal Panels, we supply and install Insulated Metal Doors for the same range of applications.",
  },
  {
    question: "How much do Panels Cost?",
    answer: "Cost varies by panel type, thickness, finish, and project size. Contact us with your specs for an accurate, free estimate.",
  },
  {
    question: "What sizes do Panels come in?",
    answer: "We stock common pre-cut lengths and can manufacture custom sizes to fit your exact project dimensions.",
  },
  {
    question: "Do you offer installation services?",
    answer: "Yes, we offer full installation services in addition to supply-only orders.",
  },
  {
    question: "How long does it take to install Panels?",
    answer: "Installation time depends on project size and scope, but panels are designed to go up quickly compared to traditional construction methods.",
  },
  {
    question: "Insulation Value?",
    answer: "Insulation values (R-values) vary by panel thickness and core material — our team can recommend the right spec for your climate and use case.",
  },
  {
    question: "Can Panels support hanging of equipment?",
    answer: "Yes, with the appropriate panel type and mounting hardware, panels can support hanging equipment and fixtures.",
  },
  {
    question: "Do you offer financing on Panels?",
    answer: "Reach out to our sales team to discuss financing options available for your project.",
  },
  {
    question: "How are Panels delivered?",
    answer: "Our centrally located Oklahoma-based distribution center ensures delivery anywhere in the U.S. within 48 hours after departure.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollCenter(id) {
  // Keep nav visible during programmatic scrolls triggered by nav clicks
  document.querySelector(".hp-nav")?.classList.remove("hp-nav--hidden");
  const el = document.getElementById(id);
  if (!el) return;
  const glass = el.querySelector(".hp-glass") || el;
  const rect = glass.getBoundingClientRect();
  const vh = window.innerHeight;
  const navH = document.querySelector(".hp-nav")?.offsetHeight ?? 70;

  if (rect.height >= vh * 0.75) {
    // Taller than 75% of viewport — pin top just below nav
    window.scrollTo({
      top: Math.max(0, window.scrollY + rect.top - navH - 16),
      left: 0,
      behavior: "smooth",
    });
  } else {
    // Fits in viewport — browser centers it natively on any screen size
    glass.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }
}

function navClick(e, id, closeMenu) {
  e.preventDefault();
  if (closeMenu) {
    closeMenu();
    // Wait for the mobile nav collapse animation (350ms) before measuring layout
    setTimeout(() => scrollCenter(id), 380);
  } else {
    scrollCenter(id);
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(data) {
  const errors = {};
  const name = data.get("name")?.toString().trim() ?? "";
  const email = data.get("email")?.toString().trim() ?? "";
  const phone = data.get("phone")?.toString().trim() ?? "";

  if (!name) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";
  if (!phone) errors.phone = "Phone number is required.";

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function App() {
  const navRef = useRef(null);
  const parallaxLayerRef = useRef(null);
  const videoRef = useRef(null);
  const parallaxRef = useRef(null);
  const heroContentRef = useRef(null);

  const revealRegistry = useRef(new Set());
  const revealTargets = useRef([]);
  const galleryViewportRef = useRef(null);

  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [formStatus, setFormStatus] = useState("idle");
  const [formErrors, setFormErrors] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryCols, setGalleryCols] = useState(3);
  const [galleryStepPx, setGalleryStepPx] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const queries = [
      window.matchMedia("(max-width: 640px)"),
      window.matchMedia("(max-width: 1024px)"),
    ];

    function updateCols() {
      const cols = queries[0].matches ? 1 : queries[1].matches ? 2 : 3;
      setGalleryCols(cols);
      setGalleryIndex((i) => Math.min(i, Math.max(0, GALLERY_IMAGES.length - cols)));
    }

    updateCols();
    queries.forEach((mq) => mq.addEventListener("change", updateCols));
    return () => queries.forEach((mq) => mq.removeEventListener("change", updateCols));
  }, []);

  // Measure the real rendered width so the slide offset is computed in px —
  // a transform translateX(%) would be relative to the (much wider) track's
  // own width, not the visible viewport, so it can't be used here.
  useEffect(() => {
    const viewport = galleryViewportRef.current;
    if (!viewport) return;

    function measure() {
      const width = viewport.offsetWidth;
      const itemWidth = (width - GALLERY_GAP_PX * (galleryCols - 1)) / galleryCols;
      setGalleryStepPx(itemWidth + GALLERY_GAP_PX);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [galleryCols]);

  const galleryMaxIndex = Math.max(0, GALLERY_IMAGES.length - galleryCols);
  const galleryNext = () => setGalleryIndex((i) => Math.min(i + 1, galleryMaxIndex));
  const galleryPrev = () => setGalleryIndex((i) => Math.max(i - 1, 0));
  const openLightbox = (i) => { setLightboxIndex(i); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const lightboxNext = () => setLightboxIndex((i) => Math.min(i + 1, GALLERY_IMAGES.length - 1));
  const lightboxPrev = () => setLightboxIndex((i) => Math.max(i - 1, 0));

  // Keyboard navigation + scroll lock while the lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") lightboxNext();
      else if (e.key === "ArrowLeft") lightboxPrev();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen]);

  useLayoutEffect(() => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

    const parallaxProgress = Math.max(0, Math.min(1, y / (vh * 0.8)));
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = `translate3d(0, ${parallaxProgress * 100}%, 0)`;
    }
    if (parallaxLayerRef.current) {
      parallaxLayerRef.current.style.pointerEvents =
        parallaxProgress >= 1 ? "none" : "auto";
    }
    if (heroContentRef.current) {
      const fade = Math.max(0, 1 - y / (vh * 0.5));
      heroContentRef.current.style.opacity = fade;
      heroContentRef.current.style.transform = `translate3d(0, ${(y / vh) * -40}px, 0)`;
    }

    revealTargets.current.forEach((el) => {
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
    let videoUnlocked = false;
    let prevScrollY = window.scrollY;
    let scrollStopTimer = null;
    const video = videoRef.current;

    const isTouch = window.matchMedia("(hover: none)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SEEK_THRESHOLD = isTouch ? 0.08 : 0.03;

    function seekVideo(target) {
      if (!video || reducedMotion) return;
      if (videoSeeking) { pendingTarget = target; return; }
      lastVideoTime = target;
      videoSeeking = true;
      video.currentTime = target;
    }

    function onSeeked() {
      videoSeeking = false;
      if (pendingTarget !== null) {
        const t = pendingTarget;
        pendingTarget = null;
        seekVideo(t);
      }
    }

    // iOS / mobile: video must be played at least once before seeking is allowed.
    // We play it silently then pause immediately to "unlock" it.
    function unlockVideo() {
      if (videoUnlocked || !video) return;
      videoUnlocked = true;
      video.muted = true;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }

    if (video) {
      video.addEventListener("seeked", onSeeked);
      // Trigger load so the browser buffers the video
      video.load();
      video.addEventListener("canplay", unlockVideo, { once: true });
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        const scrollable = document.documentElement.scrollHeight - vh;

        navRef.current?.classList.toggle("hp-nav--solid", y > vh * 0.4);

        // Hide nav when scrolling down, reveal when scrolling up or stopped
        const menuIsOpen = navRef.current?.classList.contains("hp-nav--open");
        if (!menuIsOpen) {
          if (y < 80) {
            navRef.current?.classList.remove("hp-nav--hidden");
          } else if (y > prevScrollY) {
            navRef.current?.classList.add("hp-nav--hidden");
          } else {
            navRef.current?.classList.remove("hp-nav--hidden");
          }
          // Reveal nav 1s after scrolling stops
          clearTimeout(scrollStopTimer);
          scrollStopTimer = setTimeout(() => {
            navRef.current?.classList.remove("hp-nav--hidden");
          }, 1000);
        }
        prevScrollY = y;

        if (!reducedMotion) {
          const parallaxProgress = Math.max(0, Math.min(1, y / (vh * 0.8)));
          if (parallaxRef.current) {
            parallaxRef.current.style.transform = `translate3d(0, ${parallaxProgress * 100}%, 0)`;
          }
          if (parallaxLayerRef.current) {
            parallaxLayerRef.current.style.pointerEvents =
              parallaxProgress >= 1 ? "none" : "auto";
          }

          if (heroContentRef.current) {
            const fade = Math.max(0, 1 - y / (vh * 0.5));
            const shift = isTouch ? (y / vh) * -20 : (y / vh) * -40;
            heroContentRef.current.style.opacity = fade;
            heroContentRef.current.style.transform = `translate3d(0, ${shift}px, 0)`;
          }

          if (videoUnlocked && video?.duration && isFinite(video.duration) && scrollable > 0) {
            const progress = Math.max(0, Math.min(1, y / scrollable));
            const target = progress * video.duration;
            if (Math.abs(target - lastVideoTime) > SEEK_THRESHOLD) seekVideo(target);
          }
        }

        raf = null;
      });
    }

    // Fallback unlock on first touch
    function onFirstInteraction() { unlockVideo(); }
    window.addEventListener("touchstart", onFirstInteraction, { passive: true, once: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: isTouch ? "0px 0px -5% 0px" : "0px 0px -10% 0px" }
    );
    revealTargets.current.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("touchstart", onFirstInteraction);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(scrollStopTimer);
      observer.disconnect();
      video?.removeEventListener("seeked", onSeeked);
      video?.removeEventListener("canplay", unlockVideo);
    };
  }, []);

  function registerReveal(el) {
    if (!el || revealRegistry.current.has(el)) return;
    revealRegistry.current.add(el);
    revealTargets.current.push(el);
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
              aria-label="US Panels — scroll to top"
            >
              <img src={logo} alt="US Panels" className="hp-logo__img" />
            </button>
            <div className="hp-nav__links">
              <a href="#why"     onClick={(e) => navClick(e, "why")}>Who We Are</a>
              <a href="#panels"  onClick={(e) => navClick(e, "panels")}>Panels &amp; Doors</a>
              <a href="#gallery" onClick={(e) => navClick(e, "gallery")}>Gallery</a>
              <a href="#faq"     onClick={(e) => navClick(e, "faq")}>FAQ</a>
              <a href="#contact" onClick={(e) => navClick(e, "contact")}>Contact</a>
            </div>
            <a
              href="#contact"
              className="hp-nav__quote"
              onClick={(e) => navClick(e, "contact")}
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
            <a href="#why"     onClick={(e) => navClick(e, "why",     () => setMenuOpen(false))}>Who We Are</a>
            <a href="#panels"  onClick={(e) => navClick(e, "panels",  () => setMenuOpen(false))}>Panels &amp; Doors</a>
            <a href="#gallery" onClick={(e) => navClick(e, "gallery", () => setMenuOpen(false))}>Gallery</a>
            <a href="#faq"     onClick={(e) => navClick(e, "faq",     () => setMenuOpen(false))}>FAQ</a>
            <a href="#contact" onClick={(e) => navClick(e, "contact", () => setMenuOpen(false))}>Contact</a>
            <a href="#contact" className="hp-nav__quote hp-nav__mobile-cta" onClick={(e) => navClick(e, "contact", () => setMenuOpen(false))}>Get a quote</a>
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
          webkit-playsinline="true"
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
        />
      </div>

      {/* ===== CURTAIN ===== */}
      <div className="hp-parallax-layer" ref={parallaxLayerRef} aria-hidden="true">
        <div
          className="hp-parallax"
          ref={parallaxRef}
          style={{ backgroundImage: `url(${PARALLAX_BG_URL})` }}
        />
      </div>

      {/* ===== HERO ===== */}
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
            US Panels is a global distributor of Insulated Metal
            Panels and Doors for Indoor Cultivation, Industrial, Commercial, and
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
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Welcome</p>
            <h2 className="hp-reveal" ref={registerReveal}>Built for the way you build</h2>
            <div className="hp-cards">
              <article className="hp-card" ref={registerReveal}>
                <h3>Who we are</h3>
                <p>A global distributor of Insulated Metal Panels and Doors, offering products and installation services to the Indoor Cultivation, Industrial, Commercial, and Residential markets &mdash; a modern, energy-efficient alternative to traditional construction.</p>
              </article>
              <article className="hp-card" ref={registerReveal}>
                <h3>How we work</h3>
                <p>Budgeting, design assistance, continuous communication, and quality workmanship on every project &mdash; working alongside architects, engineers, and designers to produce beautiful, multi-functional structures.</p>
              </article>
              <article className="hp-card" ref={registerReveal}>
                <h3>Product availability</h3>
                <p>Consistent supply of pre-cut panels and doors, with custom orders typically fulfilled within 30 days. Our Oklahoma-based distribution center delivers anywhere in the U.S. within 48 hours of departure.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BUILDING ENVELOPE ===== */}
      <section className="hp-section" id="panels">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Building envelope</p>
            <h2 className="hp-reveal" ref={registerReveal}>Wall panels engineered as your building envelope</h2>
            <div className="hp-panel-grid">
              {BUILDING_ENVELOPE_PANELS.map((panel) => (
                <article className="hp-panel-card hp-reveal" key={panel.name} ref={registerReveal}>
                  <div className="hp-panel-card__img" style={{ backgroundImage: `url(${panel.img})` }} role="img" aria-label={panel.name} />
                  <div className="hp-panel-card__label">
                    <span className="hp-panel-card__use">{panel.category}</span>
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
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Exterior panels</p>
            <h2 className="hp-reveal" ref={registerReveal}>Industrial, commercial &amp; residential</h2>
            <div className="hp-panel-grid">
              {EXTERIOR_PANELS.map((panel) => (
                <article className="hp-panel-card hp-reveal" key={panel.name} ref={registerReveal}>
                  <div className="hp-panel-card__img" style={{ backgroundImage: `url(${panel.img})` }} role="img" aria-label={panel.name} />
                  <div className="hp-panel-card__label">
                    <span className="hp-panel-card__use">{panel.category}</span>
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
            <div className="hp-gallery-header">
              <div>
                <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Photo gallery</p>
                <h2 className="hp-reveal" ref={registerReveal}>Projects from the field</h2>
              </div>
              <div className="hp-gallery-header__nav hp-reveal" ref={registerReveal}>
                <button
                  type="button"
                  className="hp-gallery-nav hp-gallery-nav--prev"
                  onClick={galleryPrev}
                  disabled={galleryIndex === 0}
                  aria-label="Previous photos"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  className="hp-gallery-nav hp-gallery-nav--next"
                  onClick={galleryNext}
                  disabled={galleryIndex >= galleryMaxIndex}
                  aria-label="Next photos"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>

            <div className="hp-gallery-viewport hp-reveal" ref={(el) => { galleryViewportRef.current = el; registerReveal(el); }}>
              <div
                className="hp-gallery-track"
                style={{
                  transform: `translateX(-${galleryIndex * galleryStepPx}px)`,
                  "--cols": galleryCols,
                }}
              >
                {GALLERY_IMAGES.map((img, i) => (
                  <button
                    type="button"
                    className="hp-gallery-card"
                    key={img.src}
                    onClick={() => openLightbox(i)}
                    aria-label={`View "${img.title}" full screen`}
                  >
                    <img src={`https:${img.src}`} alt={img.title} loading="lazy" decoding="async" />
                    <span className="hp-gallery-card__label">
                      <span className="hp-gallery-card__use">{img.category}</span>
                      <span className="hp-gallery-card__caption">{img.title}</span>
                      <span className="hp-gallery-card__desc"><span>{img.desc}</span></span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="hp-section" id="faq">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>FAQ</p>
            <h2 className="hp-reveal" ref={registerReveal}>Frequently asked questions</h2>
            <p className="hp-faq__intro hp-reveal" ref={registerReveal}>
              Please reach us at <a href="mailto:sales@uspanels.com">sales@uspanels.com</a> if you cannot find an answer to your question.
            </p>
            <div className="hp-faq-list">
              {FAQS.map((item, i) => {
                const isOpen = activeFaqIndex === i;
                const answerId = `faq-answer-${i}`;
                return (
                  <div className="hp-faq-item" key={item.question}>
                    <button
                      type="button"
                      className="hp-faq-item__q"
                      onClick={() => setActiveFaqIndex(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                    >
                      {item.question}
                      <span className="hp-faq-item__icon" aria-hidden="true">+</span>
                    </button>
                    <div id={answerId} className={`hp-faq-item__a${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
                      <p>{item.answer}</p>
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
              <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Contact us</p>
              <h2 className="hp-reveal" ref={registerReveal}>Email now for more information</h2>
              <p className="hp-reveal" ref={registerReveal}>Better yet, see us in person! We love our customers, so feel free to visit during normal business hours.</p>
              <ul className="hp-contact__details hp-reveal" ref={registerReveal}>
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
                  <span><a href="mailto:Sales@uspanels.com">Sales@uspanels.com</a></span>
                </li>
              </ul>
            </div>

            {formStatus === "sent" ? (
              <div className="hp-form-success hp-reveal" ref={registerReveal} role="status" aria-live="polite">
                <p className="hp-form-success__title">Message sent!</p>
                <p>Thanks for reaching out. Our team will get back to you within one business day.</p>
                <button type="button" className="hp-btn hp-btn--ghost" onClick={() => { setFormStatus("idle"); setFormErrors({}); }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="hp-contact__form hp-reveal" ref={registerReveal} onSubmit={handleSubmit} noValidate>
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
                <p className="hp-contact__legal">By submitting this form you agree to be contacted by US Panels regarding your inquiry.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="hp-footer">
        <div className="hp-footer__inner">
          <div>
            <button className="hp-logo hp-logo--footer" onClick={scrollToTop} aria-label="US Panels — scroll to top">
              <img src={logo} alt="US Panels" className="hp-logo__img" />
            </button>
            <p>5920 Campbell Ln, Piedmont, Oklahoma 73078, United States</p>
            <p>
              <a href="tel:4057231220">(405) 723-1220</a> &middot;{" "}
              <a href="mailto:Sales@uspanels.com">Sales@uspanels.com</a>
            </p>
          </div>
          <div className="hp-footer__social" aria-label="Social media links">
            <a href="https://www.facebook.com/people/US-Panels/61555678774736/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
            </a>
            <a href="https://www.instagram.com/uspanels/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@uspanels" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z" /></svg>
            </a>
            <a href="https://x.com/uspanels" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
            </a>
          </div>
        </div>
        <p className="hp-footer__legal">
          Insulated metal panel, insulation panel, insulated panel door, pir panel, pur panel, eps panel, data center facilities, controlled environment agriculture (CEA), cold storage, grow room, grow house panel, Piedmont OK, panel manufacturer.
          <br />
          &copy; {CURRENT_YEAR} US Panels - All Rights Reserved. A Globus Ventures Company.
        </p>
      </footer>

      {/* ===== GALLERY LIGHTBOX ===== */}
      {lightboxOpen && (
        <div
          className="hp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={GALLERY_IMAGES[lightboxIndex].title}
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
        >
          <button type="button" className="hp-lightbox__close" onClick={closeLightbox} aria-label="Close">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>

          <button
            type="button"
            className="hp-lightbox__nav hp-lightbox__nav--prev"
            onClick={lightboxPrev}
            disabled={lightboxIndex === 0}
            aria-label="Previous photo"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <figure className="hp-lightbox__figure">
            <img
              key={lightboxIndex}
              src={`https:${GALLERY_IMAGES[lightboxIndex].src}`}
              alt={GALLERY_IMAGES[lightboxIndex].title}
            />
            <span className="hp-lightbox__count">{lightboxIndex + 1} / {GALLERY_IMAGES.length}</span>
            <figcaption>
              <span className="hp-lightbox__use">{GALLERY_IMAGES[lightboxIndex].category}</span>
              <span className="hp-lightbox__title">{GALLERY_IMAGES[lightboxIndex].title}</span>
              <span className="hp-lightbox__desc">{GALLERY_IMAGES[lightboxIndex].desc}</span>
            </figcaption>
          </figure>

          <button
            type="button"
            className="hp-lightbox__nav hp-lightbox__nav--next"
            onClick={lightboxNext}
            disabled={lightboxIndex >= GALLERY_IMAGES.length - 1}
            aria-label="Next photo"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;



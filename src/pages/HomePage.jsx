import { useState } from "react";
import "../styles/App.css";
import logo from "../assets/images/General/us-panels-logo.webp";
import homeBgPoster from "../assets/images/General/home-bg-poster.webp";
import {
  AIRPLANE_HANGARS_PANELS,
  BUILDING_ENVELOPE_PANELS,
  COLD_STORAGE_PANELS,
  DATA_CENTER_PANELS,
  DOOR_PANELS,
  GALLERY_IMAGES,
  INSULATED_BOOTHS_PANELS,
  LABORATORIES_PANELS,
  PEMB_PANELS,
  MODULAR_HOUSING_PANELS,
  ROOF_PANELS,
  TRIM_HARDWARE_PANELS,
} from "../data/panels";
import { PARALLAX_BG_URL, VIDEO_URL } from "../data/site";
import { useHeroParallax } from "../hooks/useHeroParallax";
import { useLightbox } from "../hooks/useLightbox";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePageReady } from "../hooks/usePageReady";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { useToast } from "../hooks/useToast";
import { scrollCenter, scrollToTop } from "../utils/scroll";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import PageLoader from "../components/PageLoader";
import WhoWeAre from "../components/WhoWeAre";
import Sustainability from "../components/Sustainability";
import PanelSection from "../components/PanelSection";
import Gallery from "../components/Gallery";
import Memberships from "../components/Memberships";
import Faq from "../components/Faq";
import Contact from "../components/Contact";
import SocialMedia from "../components/SocialMedia";
import Footer from "../components/Footer";
import Lightbox from "../components/Lightbox";
import Toast from "../components/Toast";

// This page's own destination links, shown as the "Menu" nav dropdown's
// items (see homeNavDropdowns below) — "Home" scrolls to top rather than
// navigating (this page already is "/"), and is marked `active` so the
// Menu dropdown highlights it the same way NavDropdown/MobileDropdownGroup
// already highlight the current in-page section (the ".is-current" red
// mark in Nav.css) — this is just that same mechanism applied to "which
// page you're on" instead of "which section you've scrolled to".
const HOME_TOP_LINKS = [
  { id: "top", label: "Home", onClick: scrollToTop, active: true },
  { to: "/blog", label: "Blog" },
  { to: "/products", label: "Products" },
  { to: "/specs", label: "Specs" },
];

// Every scrollable section on the homepage, top to bottom — Who We Are
// through Memberships (Welcome/the hero is reachable via Menu > Home).
// `id` doubles as the section id both for scrolling to it and for
// useScrollSpy to know which item to highlight as "current" — kept as a
// stable module-level array (not rebuilt every render) since it's also the
// scroll spy hook's dependency list.
const OVERVIEW_SECTIONS = [
  { id: "why", label: "Who We Are" },
  { id: "panels", label: "Building Envelope" },
  { id: "exterior", label: "Roof Panels" },
  { id: "data-center", label: "Data Centers" },
  { id: "cold-storage", label: "Cold Storage" },
  { id: "laboratories", label: "Laboratories" },
  { id: "airplane-hangars", label: "Airplane Hangars" },
  { id: "insulated-booths", label: "Insulated Booths" },
  { id: "pemb", label: "Pre-Engineered Metal Buildings" },
  { id: "modular-housing", label: "Modular IMP Housing" },
  { id: "doors", label: "Doors" },
  { id: "trim-hardware", label: "Trim & Hardware" },
  { id: "gallery", label: "Photo Gallery" },
  { id: "memberships", label: "Memberships" },
  { id: "sustainability", label: "Sustainability" },
];

const INQUIRY_SECTIONS = [
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact Us" },
  { id: "social-media", label: "Follow Us" },
];

const SCROLL_SPY_IDS = [...OVERVIEW_SECTIONS, ...INQUIRY_SECTIONS].map((s) => s.id);

// Every photo actually used on this page (see usePageReady) — not just the
// hero's own poster/logo, but every panel/door/trim photo and every photo
// gallery shot too, so nothing on the page is still loading once a visitor
// is let in. Module-level constant, not recreated per render, since
// usePageReady's effect depends on this array by reference.
const HOME_CRITICAL_IMAGES = [
  homeBgPoster,
  PARALLAX_BG_URL,
  logo,
  ...GALLERY_IMAGES.map((g) => g.src),
  ...BUILDING_ENVELOPE_PANELS.map((p) => p.img),
  ...ROOF_PANELS.map((p) => p.img),
  ...DATA_CENTER_PANELS.map((p) => p.img),
  ...COLD_STORAGE_PANELS.map((p) => p.img),
  ...LABORATORIES_PANELS.map((p) => p.img),
  ...AIRPLANE_HANGARS_PANELS.map((p) => p.img),
  ...INSULATED_BOOTHS_PANELS.map((p) => p.img),
  ...PEMB_PANELS.map((p) => p.img),
  ...MODULAR_HOUSING_PANELS.map((p) => p.img),
  ...DOOR_PANELS.map((p) => p.img),
  ...TRIM_HARDWARE_PANELS.map((p) => p.img),
];
const HOME_CRITICAL_VIDEOS = [VIDEO_URL];

function HomePage() {
  usePageMeta({
    title: "US Panels | Insulated Metal Panels & Doors",
    description: "Global distributor of exterior Insulated Metal Panels and Doors for Industrial, Commercial, and Residential projects. Immediate availability, delivered anywhere in the U.S. within 48 hours.",
    path: "/",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  // Gated on `loaderDone`, not just mounted unconditionally — see
  // usePageReady/PageLoader and useRevealOnScroll's own comment: this
  // page's content shouldn't start its entrance animations until the
  // loading overlay has actually fully faded away, or the visitor never
  // gets to see them play.
  const { registerReveal } = useRevealOnScroll(loaderDone);
  const { navRef, parallaxLayerRef, videoRef, parallaxRef, heroContentRef } = useHeroParallax();
  const lightbox = useLightbox(GALLERY_IMAGES.length);
  const [toast, setToast] = useToast();
  const pageReady = usePageReady(HOME_CRITICAL_IMAGES, HOME_CRITICAL_VIDEOS);
  const activeSectionId = useScrollSpy(SCROLL_SPY_IDS);

  const homeNavDropdowns = [
    {
      key: "contents",
      label: "Contents",
      items: OVERVIEW_SECTIONS.map((s) => ({
        label: s.label,
        onClick: () => scrollCenter(s.id),
        active: s.id === activeSectionId,
      })),
    },
    {
      key: "inquiry",
      label: "Inquiry",
      items: INQUIRY_SECTIONS.map((s) => ({
        label: s.label,
        onClick: () => scrollCenter(s.id),
        active: s.id === activeSectionId,
      })),
    },
  ];

  // Lightbox takes a ready-to-use `src` — gallery photos are now local,
  // bundler-resolved imports (see GALLERY_IMAGES in data/panels.js), so no
  // URL transformation is needed before handing them to it.
  const galleryLightboxImages = GALLERY_IMAGES;

  return (
    <div className={loaderDone ? "hp-anim-ready" : undefined}>
      <PageLoader ready={pageReady} onDone={() => setLoaderDone(true)} />

      <Nav
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navRef={navRef}
        logo={logo}
        dropdowns={homeNavDropdowns}
        desktopLinks={HOME_TOP_LINKS}
        entranceReady={loaderDone}
      />

      {/* ===== FIXED VIDEO BACKGROUND ===== */}
      <div className="hp-bgvideo-layer" aria-hidden="true">
        <video
          className="hp-bgvideo"
          ref={videoRef}
          src={VIDEO_URL}
          poster={homeBgPoster}
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

      <Hero heroContentRef={heroContentRef} />
      <WhoWeAre registerReveal={registerReveal} />
      <PanelSection
        id="panels"
        eyebrow="Building envelope"
        heading="Insulated Metal Wall Panels"
        description="Insulation + facade in one step."
        panels={BUILDING_ENVELOPE_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="exterior"
        eyebrow="Roof panels"
        heading="Insulated Metal Roof Panels"
        description="Durable insulated roofing for tangible temperature control and real cost savings."
        panels={ROOF_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="data-center"
        eyebrow="Data centers"
        heading="Panel systems built for data center facilities inside and out"
        description="Insulated wall and interior panel systems engineered for the tight tolerances and reliability data center environments demand."
        panels={DATA_CENTER_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="cold-storage"
        eyebrow="Cold storage"
        heading="Insulated panels for cold storage facilities"
        description="Exterior and interior panel systems engineered to hold a consistent thermal envelope for refrigerated and frozen storage."
        panels={COLD_STORAGE_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="laboratories"
        eyebrow="Laboratories"
        heading="Insulated panels for laboratory facilities"
        description="Precision-controlled panel systems engineered for research and testing laboratories, holding tight temperature, humidity, and contamination tolerances."
        panels={LABORATORIES_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="airplane-hangars"
        eyebrow="Airplane hangars"
        heading="Insulated panels for airplane hangar facilities"
        description="Long-span insulated panel systems built for the scale of aviation hangars, covering wide clear spans while holding a consistent, weather-tight interior envelope."
        panels={AIRPLANE_HANGARS_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="insulated-booths"
        eyebrow="Insulated booths"
        heading="Insulated panels for booths, huts, and shacks"
        description="Compact insulated panel structures built for hunting huts, guard shacks, and lawn sheds, keeping small standalone spaces sealed and temperature-stable."
        panels={INSULATED_BOOTHS_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="pemb"
        eyebrow="Pre-engineered metal buildings"
        heading="Complete metal building systems, frame to finish"
        description="Steel frame structures clad with insulated wall and roof panels, available in custom sizes, designs, and colors for any project."
        panels={PEMB_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="modular-housing"
        eyebrow="Modular IMP housing"
        heading="Modular housing built from insulated metal panels"
        description="Fast-assembling modular units for disaster relief, affordable housing, and weatherproof housing, all built from the same insulated panel envelope."
        panels={MODULAR_HOUSING_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="doors"
        eyebrow="Insulated Doors"
        heading="Insulated Doors"
        description="High-speed, sliding, and personnel doors that seal tight for reliable temperature control on cold storage and cooler rooms."
        panels={DOOR_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="trim-hardware"
        eyebrow="Trim & hardware"
        heading="Trim & Hardware"
        description="The finishing details that complete every install: trim, fasteners, and sealants engineered specifically for insulated panel systems to keep every seam clean and weather-tight."
        panels={TRIM_HARDWARE_PANELS}
        registerReveal={registerReveal}
      />
      <Gallery images={GALLERY_IMAGES} registerReveal={registerReveal} onSelect={lightbox.openLightbox} />
      <Memberships registerReveal={registerReveal} />
      <Sustainability registerReveal={registerReveal} />
      <Faq registerReveal={registerReveal} />
      <Contact registerReveal={registerReveal} onToast={setToast} />
      <SocialMedia registerReveal={registerReveal} />
      <Footer logo={logo} />

      {lightbox.lightboxOpen && (
        <Lightbox
          images={galleryLightboxImages}
          index={lightbox.lightboxIndex}
          onClose={lightbox.closeLightbox}
          onNext={lightbox.lightboxNext}
          onPrev={lightbox.lightboxPrev}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default HomePage;

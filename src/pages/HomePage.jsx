import { useState } from "react";
import "../styles/App.css";
import logo from "../assets/images/us-panels-logo.png";
import {
  BUILDING_ENVELOPE_PANELS,
  COLD_STORAGE_PANELS,
  DATA_CENTER_PANELS,
  DOOR_PANELS,
  GALLERY_IMAGES,
  PEMB_PANELS,
  ROOF_PANELS,
  TRIM_HARDWARE_PANELS,
} from "../data/panels";
import { PARALLAX_BG_URL, VIDEO_URL } from "../data/site";
import { useHeroParallax } from "../hooks/useHeroParallax";
import { useLightbox } from "../hooks/useLightbox";
import { usePageMeta } from "../hooks/usePageMeta";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { useToast } from "../hooks/useToast";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import WhoWeAre from "../components/WhoWeAre";
import PanelSection from "../components/PanelSection";
import Gallery from "../components/Gallery";
import Faq from "../components/Faq";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Lightbox from "../components/Lightbox";
import Toast from "../components/Toast";

function HomePage() {
  usePageMeta({
    title: "US Panels | Insulated Metal Panels & Doors",
    description: "Global distributor of exterior Insulated Metal Panels and Doors for Industrial, Commercial, and Residential projects. Immediate availability, delivered anywhere in the U.S. within 48 hours.",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const { registerReveal } = useRevealOnScroll();
  const { navRef, parallaxLayerRef, videoRef, parallaxRef, heroContentRef } = useHeroParallax();
  const lightbox = useLightbox(GALLERY_IMAGES.length);
  const [toast, setToast] = useToast();

  // Lightbox now takes a ready-to-use `src` (so it can also show local,
  // already-resolved product images elsewhere) — gallery photos still come
  // from wsimg as protocol-relative URLs, so the "https:" prefix Lightbox
  // used to add internally now has to happen at the call site instead.
  const galleryLightboxImages = GALLERY_IMAGES.map((img) => ({ ...img, src: `https:${img.src}` }));

  return (
    <div className="hp-app">
      <Nav menuOpen={menuOpen} setMenuOpen={setMenuOpen} navRef={navRef} logo={logo} />

      {/* ===== FIXED VIDEO BACKGROUND ===== */}
      <div className="hp-bgvideo-layer" aria-hidden="true">
        <video
          className="hp-bgvideo"
          ref={videoRef}
          src={VIDEO_URL}
          poster={PARALLAX_BG_URL}
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
        heading="Wall panels engineered as your building envelope"
        description="Insulated metal wall panels for industrial, commercial, and residential builds, engineered for fast installation, long-term energy efficiency, and a clean finished look."
        panels={BUILDING_ENVELOPE_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="exterior"
        eyebrow="Roof panels"
        heading="Roof panels built to complete the envelope"
        description="Standing seam and corrugated roof panel systems that pair with your walls to complete a fully insulated building envelope, built to shed weather for decades."
        panels={ROOF_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="data-center"
        eyebrow="Data centers"
        heading="Panel systems built for data center environments"
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
        id="pemb"
        eyebrow="Pre-engineered metal buildings"
        heading="Complete metal building systems, frame to finish"
        description="Steel frame structures clad with insulated wall and roof panels, available in custom sizes, designs, and colors for any project."
        panels={PEMB_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="doors"
        eyebrow="Doors"
        heading="Insulated doors built to match your envelope"
        description="High-speed, sliding, and personnel doors engineered for fast, secure access without breaking the thermal envelope around them."
        panels={DOOR_PANELS}
        registerReveal={registerReveal}
      />
      <PanelSection
        id="trim-hardware"
        eyebrow="Trim & hardware"
        heading="The finishing details that complete every install"
        description="Trim, fasteners, and sealants engineered specifically for insulated panel systems, keeping every seam clean and weather-tight."
        panels={TRIM_HARDWARE_PANELS}
        registerReveal={registerReveal}
      />
      <Gallery images={GALLERY_IMAGES} registerReveal={registerReveal} onSelect={lightbox.openLightbox} />
      <Faq registerReveal={registerReveal} />
      <Contact registerReveal={registerReveal} onToast={setToast} />
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

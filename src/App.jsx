import { useState } from "react";
import "./styles/base.css";
import logo from "./assets/images/us-panels-logo.png";
import { BUILDING_ENVELOPE_PANELS, GALLERY_IMAGES, ROOF_PANELS } from "./data/panels";
import { PARALLAX_BG_URL, VIDEO_URL } from "./data/site";
import { useHeroParallax } from "./hooks/useHeroParallax";
import { useLightbox } from "./hooks/useLightbox";
import { useRevealOnScroll } from "./hooks/useRevealOnScroll";
import { useToast } from "./hooks/useToast";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import WhoWeAre from "./components/WhoWeAre";
import PanelSection from "./components/PanelSection";
import Gallery from "./components/Gallery";
import Faq from "./components/Faq";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Lightbox from "./components/Lightbox";
import Toast from "./components/Toast";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { registerReveal } = useRevealOnScroll();
  const { navRef, parallaxLayerRef, videoRef, parallaxRef, heroContentRef } = useHeroParallax();
  const lightbox = useLightbox(GALLERY_IMAGES.length);
  const [toast, setToast] = useToast();

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
      <Gallery images={GALLERY_IMAGES} registerReveal={registerReveal} onSelect={lightbox.openLightbox} />
      <Faq registerReveal={registerReveal} />
      <Contact registerReveal={registerReveal} onToast={setToast} />
      <Footer logo={logo} />

      {lightbox.lightboxOpen && (
        <Lightbox
          images={GALLERY_IMAGES}
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

export default App;

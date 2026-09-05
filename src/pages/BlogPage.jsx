import { useEffect, useRef, useState } from "react";
import "../styles/App.css";
import "./BlogPage.css";
import logo from "../assets/images/General/us-panels-logo.webp";
import bgVideoSrc from "../assets/videos/AI Video - Blog BG1 - 1.mp4";
import bgVideoPoster from "../assets/images/General/blog-bg-poster.webp";
import { BLOG_POSTS, TESTIMONIALS } from "../data/blog";
import { useNavScroll } from "../hooks/useNavScroll";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePageReady } from "../hooks/usePageReady";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { useToast } from "../hooks/useToast";
import { scrollCenter, scrollToTop } from "../utils/scroll";
import Nav from "../components/Nav";
import Faq from "../components/Faq";
import Contact from "../components/Contact";
import PageLoader from "../components/PageLoader";
import Footer from "../components/Footer";
import SocialMedia from "../components/SocialMedia";
import BlogSlideshow from "../components/BlogSlideshow";
import Testimonials from "../components/Testimonials";
import Toast from "../components/Toast";

// Every photo actually used on this page (see usePageReady) — not just the
// hero's own poster/logo, but every post's own photo in the slideshow, so
// nothing on the page is still loading once a visitor is let in.
// Module-level constants, not recreated per render, since usePageReady's
// effect depends on these arrays by reference.
const BLOG_CRITICAL_IMAGES = [bgVideoPoster, logo, ...BLOG_POSTS.map((p) => p.image)];
const BLOG_CRITICAL_VIDEOS = [bgVideoSrc];


// This page's own destination links, shown as the "Menu" nav dropdown's
// items (see blogNavDropdowns below) — matches the pattern every other
// page's own nav config uses (see HOME_TOP_LINKS in HomePage.jsx). "Blog"
// scrolls to top rather than navigating (this page already is /blog), and
// is marked `active` so the Menu dropdown highlights it the same red
// ".is-current" mark (see Nav.css) the Contents/Inquiry dropdowns already
// use for the current in-page section.
const blogTopLinks = [
  { to: "/", label: "Home" },
  { id: "blog-top", label: "Blog", onClick: scrollToTop, active: true },
  { to: "/products", label: "Products" },
  { to: "/specs", label: "Specs" },
];

// This page's own scrollable sections, shown as a "Contents" nav dropdown —
// same pattern as SPECS_SECTIONS/"Specs" in SpecsPage.jsx and
// PRODUCTS_NAV_SECTIONS/"Categories" in ProductsPage.jsx. Follow Us sits in
// the Inquiry dropdown instead (see INQUIRY_SECTIONS below), matching
// where every other page's own nav puts it.
const BLOG_SECTIONS = [
  { id: "posts", label: "Latest Posts" },
  { id: "testimonials", label: "Customer Testimonials" },
];

const INQUIRY_SECTIONS = [
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact Us" },
  { id: "social-media", label: "Follow Us" },
];

const BLOG_SCROLL_SPY_IDS = [...BLOG_SECTIONS, ...INQUIRY_SECTIONS].map((s) => s.id);




export default function BlogPage() {
  usePageMeta({
    title: "Blog & News | US Panels",
    description: "Company news, industry insights, case studies, and customer testimonials from US Panels, manufacturer and distributor of insulated metal panels and doors.",
    path: "/blog",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const navRef = useNavScroll(menuOpen);
  // Gated on `loaderDone` — see HomePage.jsx's own comment on this same
  // call for why.
  const { registerReveal } = useRevealOnScroll(loaderDone);
  const activeSectionId = useScrollSpy(BLOG_SCROLL_SPY_IDS);
  const [toast, setToast] = useToast();
  const pageReady = usePageReady(BLOG_CRITICAL_IMAGES, BLOG_CRITICAL_VIDEOS);

  // Same scroll-scrubbed video technique the Products/Specs page
  // backgrounds use (see ProductsPage.jsx) — the video stays paused and
  // its currentTime is driven directly off scroll progress through the
  // whole page, so the footage itself visibly advances as you scroll
  // instead of just playing on a loop regardless of what you're doing.
  // Kept as a local effect (not a shared hook) since each page's copy only
  // needs to stay in sync on the parts that matter (unlock/seek/threshold/
  // touch-smoothing/resize-safety), not on any page-specific behavior.
  const bgVideoRef = useRef(null);
  // Cached viewport height, not re-read from window.innerHeight on every
  // scroll tick — mobile Chrome/Safari collapse their toolbar as the page
  // scrolls, changing innerHeight mid-gesture independent of the user
  // resizing anything, which would otherwise make the same scroll
  // position map to a different point in the video from one tick to the
  // next. Updated only on a genuine resize (width also changes), not on
  // that toolbar-driven noise.
  const vhRef = useRef(window.innerHeight);
  const vwRef = useRef(window.innerWidth);
  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;
    let raf = null;
    let lastVideoTime = -1;
    let videoSeeking = false;
    let pendingTarget = null;
    let videoUnlocked = false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    const SEEK_THRESHOLD = isTouch ? 0.08 : 0.03;
    // Chases the raw scroll-mapped target with a capped per-tick step on
    // touch — a fast flick can jump the raw target across several seconds
    // of footage in one tick, and snapping straight there reads as the
    // background suddenly zooming/lurching.
    let smoothedTouchTime = null;
    const MAX_TOUCH_STEP_SEC = 0.06;

    function seekVideo(target) {
      if (reducedMotion) return;
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

    // Requires the video to have actually played once before seeking is
    // allowed — play it silently then immediately pause to "unlock" it,
    // same as the home/Products page's video.
    function unlockVideo() {
      if (videoUnlocked) return;
      videoUnlocked = true;
      video.muted = true;
      const p = video.play();
      // Pause immediately/synchronously too (not just once the play()
      // promise resolves) — on mobile browsers that promise can take
      // noticeably longer to settle than actual decode start, which left
      // the video visibly autoplaying for a real stretch on load/refresh.
      video.pause();
      if (p && typeof p.then === "function") {
        p.then(() => { video.pause(); video.currentTime = 0; }).catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }

    video.addEventListener("seeked", onSeeked);
    video.load();
    video.addEventListener("canplay", unlockVideo, { once: true });
    window.addEventListener("touchstart", unlockVideo, { passive: true, once: true });

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (reducedMotion || !videoUnlocked || !video.duration || !isFinite(video.duration)) return;
        const scrollable = document.documentElement.scrollHeight - vhRef.current;
        if (scrollable <= 0) return;
        const progress = Math.max(0, Math.min(1, window.scrollY / scrollable));
        const rawTarget = progress * video.duration;
        let target = rawTarget;
        if (isTouch) {
          // Seeded from the video's actual current time, not the raw
          // target — seeding it at the target would let the very first
          // scroll tick (if it happens to already be a big flick) skip
          // the clamp entirely on that one tick.
          if (smoothedTouchTime === null) smoothedTouchTime = video.currentTime || 0;
          const diff = rawTarget - smoothedTouchTime;
          const step = Math.max(-MAX_TOUCH_STEP_SEC, Math.min(MAX_TOUCH_STEP_SEC, diff));
          smoothedTouchTime += step;
          target = smoothedTouchTime;
        }
        if (Math.abs(target - lastVideoTime) > SEEK_THRESHOLD) seekVideo(target);
      });
    }
    function onResize() {
      if (window.innerWidth !== vwRef.current) {
        vwRef.current = window.innerWidth;
        vhRef.current = window.innerHeight;
      }
    }
    window.addEventListener("resize", onResize);

    // touchmove, not just scroll — mobile Safari/Chrome can throttle/delay
    // `scroll` events until an active touch-drag gesture settles, so
    // scrubbing only on `scroll` reads as the video "catching up" in one
    // jump once you lift your finger rather than tracking the drag
    // continuously. touchmove fires throughout the gesture itself,
    // closing that gap.
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("touchstart", unlockVideo);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("canplay", unlockVideo);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Same collapsed-dropdown pattern as the Products/Specs/Home nav —
  // "Contents" jumps to any section on this page, "Inquiry" covers FAQ/
  // Contact Us, both now sections on this page too (see <Faq>/<Contact>
  // below), so both dropdowns scroll rather than navigate. The site's own
  // pages (Home/Blog/Products/Specs) are a flat row via desktopLinks below,
  // not tucked into a dropdown.
  const blogNavDropdowns = [
    {
      key: "contents",
      label: "Contents",
      items: BLOG_SECTIONS.map((section) => ({
        label: section.label,
        onClick: () => scrollCenter(section.id),
        active: section.id === activeSectionId,
      })),
    },
    {
      key: "inquiry",
      label: "Inquiry",
      items: INQUIRY_SECTIONS.map((section) => ({
        label: section.label,
        onClick: () => scrollCenter(section.id),
        active: section.id === activeSectionId,
      })),
    },
  ];




  return (
    <div className={`hp-blog-page${loaderDone ? " hp-anim-ready" : ""}`}>
      <PageLoader ready={pageReady} onDone={() => setLoaderDone(true)} />

      <Nav
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navRef={navRef}
        logo={logo}
        logoTo="/"
        desktopLinks={blogTopLinks}
        dropdowns={blogNavDropdowns}
        ctaTo="/#contact"
        entranceReady={loaderDone}
      />

      <div className="hp-bgvideo-layer" aria-hidden="true">
        <video
          className="hp-bgvideo"
          ref={bgVideoRef}
          src={bgVideoSrc}
          poster={bgVideoPoster}
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
        />
      </div>

      <section className="hp-blog-hero">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-eyebrow hp-reveal" ref={registerReveal}>Blog &amp; news</p>
            <h1 className="hp-hero-heading hp-reveal" ref={registerReveal}>Stories, updates, and insights from US Panels</h1>
            <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>
              Company news, industry insights, project case studies, and what our
              customers have to say, all in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="hp-section" id="posts">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Latest posts</p>
            <h2 className="hp-reveal" ref={registerReveal}>News, insights &amp; case studies</h2>
            <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>
              Company news, industry insights, and project case studies from the US Panels team.
            </p>
            <BlogSlideshow posts={BLOG_POSTS} registerReveal={registerReveal} />
          </div>
        </div>
      </section>

      <Testimonials testimonials={TESTIMONIALS} registerReveal={registerReveal} />

      <Faq registerReveal={registerReveal} />

      <Contact registerReveal={registerReveal} onToast={setToast} />

      <SocialMedia registerReveal={registerReveal} />

      <Footer logo={logo} />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

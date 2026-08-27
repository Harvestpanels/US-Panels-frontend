import { useEffect, useRef, useState } from "react";
import "../styles/App.css";
import "./BlogPage.css";
import logo from "../assets/images/General/us-panels-logo.webp";
import { BLOG_POSTS, TESTIMONIALS } from "../data/blog";
import { useNavScroll } from "../hooks/useNavScroll";
import { usePageMeta } from "../hooks/usePageMeta";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { useToast } from "../hooks/useToast";
import { scrollCenter, scrollToTop } from "../utils/scroll";
import Nav from "../components/Nav";
import Faq from "../components/Faq";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import SocialMedia from "../components/SocialMedia";
import Toast from "../components/Toast";

// How long each slide holds before auto-advancing to the next post.
const SLIDE_INTERVAL_MS = 6000;

// Plain top-level nav links, matching the pattern every other page's own
// nav config uses (see HOME_TOP_LINKS in HomePage.jsx) — "Blog" sits right
// next to "Home", "Products", and "Specs" on every page's navbar.
const blogTopLinks = [
  { to: "/", label: "Home" },
  { id: "blog-top", label: "Blog", onClick: scrollToTop },
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

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

function formatDate(isoDate) {
  return DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00`));
}

// A single large "now showing" slide — full-bleed photo with the copy
// overlaid on a gradient scrim at the bottom, matching the same
// image-forward treatment as .hp-panel-card (see PanelSection.jsx), rather
// than splitting the slide into separate photo/text halves.
function PostSlide({ post }) {
  return (
    <div className="hp-blog-slide">
      <img src={post.image} alt={post.title} className="hp-blog-slide__img" loading="lazy" decoding="async" />
      <span className="hp-blog-post__category hp-blog-slide__category">{post.category}</span>
      <div className="hp-blog-slide__label">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <time className="hp-blog-post__date" dateTime={post.date}>{formatDate(post.date)}</time>
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial, registerReveal }) {
  return (
    <article className="hp-blog-testimonial hp-reveal" ref={registerReveal}>
      <span className="hp-blog-testimonial__mark" aria-hidden="true">&ldquo;</span>
      <p className="hp-blog-testimonial__quote">{testimonial.quote}</p>
      <p className="hp-blog-testimonial__name">{testimonial.name}</p>
      <p className="hp-blog-testimonial__role">{testimonial.role}, {testimonial.company}</p>
    </article>
  );
}

export default function BlogPage() {
  usePageMeta({
    title: "Blog & News | US Panels",
    description: "Company news, industry insights, case studies, and customer testimonials from US Panels, manufacturer and distributor of insulated metal panels and doors.",
    path: "/blog",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useNavScroll(menuOpen);
  const { registerReveal } = useRevealOnScroll();
  const activeSectionId = useScrollSpy(BLOG_SCROLL_SPY_IDS);
  const [toast, setToast] = useToast();

  // Same collapsed-dropdown pattern as the Products/Specs/Home nav —
  // "Contents" jumps to any section on this page, "Inquiry" covers FAQ/
  // Contact Us, both now sections on this page too (see <Faq>/<Contact>
  // below), so both dropdowns scroll rather than navigate.
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

  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimerRef = useRef(null);

  function goToSlide(i) {
    setSlideIndex(((i % BLOG_POSTS.length) + BLOG_POSTS.length) % BLOG_POSTS.length);
  }

  // Auto-advances on an interval, restarted from zero on every manual dot
  // click below so a visitor actively browsing isn't fighting the timer
  // for control of what's on screen.
  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setSlideIndex((i) => (i + 1) % BLOG_POSTS.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(slideTimerRef.current);
  }, [slideIndex]);

  return (
    <div className="hp-blog-page">
      <Nav
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navRef={navRef}
        logo={logo}
        logoTo="/"
        links={blogTopLinks}
        desktopLinks={blogTopLinks}
        dropdowns={blogNavDropdowns}
        ctaTo="/#contact"
      />

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
            <div className="hp-blog-slideshow hp-reveal" ref={registerReveal}>
              <div className="hp-blog-slideshow__viewport">
                <div
                  className="hp-blog-slideshow__track"
                  style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                >
                  {BLOG_POSTS.map((post) => (
                    <PostSlide key={post.title} post={post} />
                  ))}
                </div>

                <div className="hp-blog-slideshow__dots">
                  {BLOG_POSTS.map((post, i) => (
                    <button
                      type="button"
                      key={post.title}
                      className={`hp-blog-slideshow__dot${i === slideIndex ? " is-active" : ""}`}
                      onClick={() => goToSlide(i)}
                      aria-label={`Go to post: ${post.title}`}
                      aria-current={i === slideIndex}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hp-section" id="testimonials">
        <div className="hp-section__inner">
          <div className="hp-glass">
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Customer testimonials</p>
            <h2 className="hp-reveal" ref={registerReveal}>What our customers are saying</h2>
            <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>
              Real feedback from the contractors, builders, and facility teams we've worked with.
            </p>
            <div className="hp-blog-testimonial-grid">
              {TESTIMONIALS.map((testimonial) => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} registerReveal={registerReveal} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Faq registerReveal={registerReveal} />

      <Contact registerReveal={registerReveal} onToast={setToast} />

      <SocialMedia registerReveal={registerReveal} />

      <Footer logo={logo} />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

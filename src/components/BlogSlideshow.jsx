import { useEffect, useRef, useState } from "react";
import "./BlogSlideshow.css";

// How long each slide holds before auto-advancing to the next post.
const SLIDE_INTERVAL_MS = 6000;

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

// Single-slide "now showing" carousel: one full post visible at a time,
// sliding horizontally, advanced by the dots below and by its own autoplay
// timer. Owns its slide state rather than taking it as a prop — nothing
// outside this component needs to know which post is currently showing.
export default function BlogSlideshow({ posts, registerReveal }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimerRef = useRef(null);

  function goToSlide(i) {
    setSlideIndex(((i % posts.length) + posts.length) % posts.length);
  }

  // Auto-advances on an interval, restarted from zero on every manual dot
  // click below (hence the slideIndex dependency) so a visitor actively
  // browsing isn't fighting the timer for control of what's on screen.
  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setSlideIndex((i) => (i + 1) % posts.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(slideTimerRef.current);
  }, [slideIndex, posts.length]);

  return (
    <div className="hp-blog-slideshow hp-reveal" ref={registerReveal}>
      <div className="hp-blog-slideshow__viewport">
        <div
          className="hp-blog-slideshow__track"
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {posts.map((post) => (
            <PostSlide key={post.title} post={post} />
          ))}
        </div>

        <div className="hp-blog-slideshow__dots">
          {posts.map((post, i) => (
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
  );
}

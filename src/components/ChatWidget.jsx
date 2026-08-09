import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./ChatWidget.css";
import { getBotResponse } from "../utils/chatbot";
import { SUGGESTED_QUESTIONS } from "../data/botKnowledge";
import { announcePanelOpened, onOtherPanelOpened } from "../utils/floatingPanels";
import mascotIconDefault from "../assets/images/US Panels Mascot Sticker/US Panels Mascot Sticker 1.png";
import mascotIconOpened from "../assets/images/US Panels Mascot Sticker/US Panels Mascot Sticker 3.png";
import mascotIconNewMessage from "../assets/images/US Panels Mascot Sticker/US Panels Mascot Sticker 2.png";

// Convex-hull silhouettes (as CSS clip-path polygons, in % of the button's
// own box) for each mascot pose — the PNGs are trimmed to a tight
// rectangular bounding box, but the character itself doesn't fill every
// corner of that rectangle (e.g. the sloped brim of the hat, the gap under
// a raised arm). Without this, those corners are still transparent-but-
// clickable rectangle area. Clipping the button to each pose's hull keeps
// the clickable region hugging the actual silhouette instead. Generated
// once from the source PNGs (see hull.cjs, run ad hoc — not part of the
// build) rather than computed at runtime, since the artwork is static.
const POSE_CLIP_PATHS = {
  default: "polygon(0.0% 38.0%, 0.0% 32.6%, 20.0% 9.6%, 21.1% 8.5%, 41.5% 0.0%, 42.4% 0.0%, 58.7% 0.0%, 59.3% 0.0%, 60.7% 0.0%, 81.7% 3.2%, 82.5% 3.4%, 83.7% 4.0%, 84.5% 4.5%, 84.8% 4.8%, 85.7% 5.8%, 86.3% 6.6%, 86.8% 7.7%, 87.4% 9.3%, 87.7% 10.4%, 100.0% 78.0%, 100.0% 80.9%, 100.0% 81.8%, 100.0% 83.9%, 100.0% 85.5%, 99.5% 86.6%, 96.6% 89.3%, 79.9% 100.0%, 26.6% 100.0%, 26.0% 100.0%, 7.9% 78.3%, 7.0% 76.7%, 6.8% 75.9%, 0.0% 39.1%)",
  newMessage: "polygon(0.0% 61.4%, 0.0% 34.0%, 0.0% 33.7%, 31.5% 9.1%, 59.0% 0.0%, 60.4% 0.0%, 69.5% 0.0%, 71.1% 0.0%, 72.7% 0.0%, 73.8% 0.0%, 92.7% 3.7%, 94.3% 4.5%, 96.2% 6.4%, 96.7% 7.2%, 97.3% 8.5%, 98.1% 10.9%, 98.3% 12.5%, 100.0% 76.7%, 100.0% 78.5%, 100.0% 79.3%, 99.1% 87.1%, 98.1% 89.3%, 97.0% 90.9%, 88.4% 100.0%, 88.1% 100.0%, 37.1% 100.0%, 36.6% 100.0%, 8.3% 79.9%, 8.0% 79.6%, 0.0% 68.9%, 0.0% 68.1%, 0.0% 64.9%, 0.0% 61.9%)",
  opened: "polygon(0.0% 93.0%, 0.0% 92.5%, 27.7% 11.2%, 28.1% 10.4%, 28.9% 9.3%, 43.7% 0.0%, 44.1% 0.0%, 58.0% 0.0%, 59.6% 0.0%, 60.4% 0.0%, 75.6% 4.5%, 76.4% 5.0%, 77.0% 5.6%, 77.8% 6.6%, 78.2% 7.4%, 78.6% 8.5%, 100.0% 94.1%, 100.0% 100.0%, 100.0% 100.0%, 0.0% 100.0%, 0.0% 100.0%, 0.0% 100.0%)",
};

// A small, natural "thinking" delay before the bot's reply lands — an
// instant answer reads as canned/robotic, a brief pause reads as a real
// assistant composing a response. Purely cosmetic; the answer is already
// computed synchronously.
const REPLY_DELAY_MS = 3000;

// Knowledge-base links to "/#contact" are written generically (the intent
// doesn't know what page it'll be answered from), but every page (Home,
// Products, Specs) renders its own Contact section at the same #contact
// anchor. Swapping in the visitor's current path here sends them to the
// contact form on *this* page instead of always bouncing to Home's.
function resolveLink(href, pathname) {
  return href === "/#contact" ? `${pathname}#contact` : href;
}

const GREETING = {
  role: "bot",
  text: "Hi! I'm the US Panels assistant. Ask me about our insulated metal panels & doors, products, pricing, specs, certifications, or delivery.",
  links: null,
  showSuggestions: true,
};

// Proactive check-ins once a visitor has started a real conversation — a
// mix of plain "still there?" nudges and small, genuinely useful company
// tidbits, so it reads as attentive hospitality rather than a repeating
// timer. Kept short and conversational (no exclamation-point spam, no
// "AS AN AI" stiffness) to match how the rest of the bot's copy talks.
// ENGAGEMENT_INTERVAL_MS below governs how long the visitor has to go
// quiet before one of these fires.
const ENGAGEMENT_MESSAGES = [
  { text: "Still there? Happy to help if you've got more questions about panels or doors.", links: null },
  { text: "Just checking in — let me know if you'd like pricing, specs, or delivery info for any of our panels.", links: null },
  {
    text: "Quick fact while you think it over: our insulated metal panels come in PIR, PUR, and EPS core options, so there's usually a fit for whatever you're building.",
    links: null,
  },
  {
    text: "By the way, most of our panels ship with immediate availability — no long lead times to plan around.",
    links: null,
  },
  {
    text: "If it's easier, you can always reach a real person directly.",
    links: [{ label: "Contact us", href: "/#contact" }],
  },
  { text: "No rush — I'll be right here whenever you're ready to keep going.", links: null },
];

const ENGAGEMENT_INTERVAL_MS = 2 * 60 * 1000;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  // The "new message" nudge: every fresh page load starts a fresh
  // conversation (the greeting message resets too), so it should always
  // greet the visitor again on refresh, not just once ever per browser.
  const [unread, setUnread] = useState(true);
  // Separate from `unread` (which is a one-time "you've never opened this"
  // flag): re-triggers the nudge whenever a bot reply lands while the panel
  // is folded, e.g. the visitor closed it mid-typing-indicator. Cleared the
  // next time they open the panel.
  const [hasNewReply, setHasNewReply] = useState(false);
  // Launcher shows the "sticker 1" pose fresh on every page load; once the
  // visitor has opened the panel at least once, it switches to "sticker 3"
  // for the rest of the session (persists across navigation/close, resets
  // only on a real refresh since this is plain useState).
  const [hasOpened, setHasOpened] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const replyTimer = useRef(null);
  // Idle-since-last-user-message clock for the proactive engagement
  // check-ins (see ENGAGEMENT_MESSAGES) — reset every time the visitor
  // actually sends something, so it always measures quiet time from their
  // last activity rather than firing on a fixed wall-clock cadence
  // regardless of whether they're mid-conversation.
  const engagementTimer = useRef(null);
  // Avoids repeating the exact same check-in twice in a row.
  const lastEngagementIndex = useRef(-1);
  // Read inside the reply timeout to check the *current* open state, since
  // the closure captures whatever `open` was when send() was called, not
  // whatever it is by the time the delayed reply actually arrives.
  const openRef = useRef(open);
  // Tracks whether the panel has actually been open, so focus only returns
  // to the launcher on a real close (open → closed transition) — never on
  // the initial page load. Keyed on the state transition rather than a
  // "first run" flag so it's robust to React StrictMode's double-invoked
  // effects in dev (which defeated the first-run approach). Without this,
  // the launcher grabbed focus on load, showing its focus ring — and the
  // global button:focus-visible rule in App.css squared off its circle.
  const wasOpen = useRef(false);

  // Closes the panel on every route change — otherwise it's mounted once
  // outside the routed pages (see App.jsx) and never unmounts, so it just
  // stayed open, floating over whatever page you navigated to, which read
  // as a leftover artifact rather than a deliberate part of that page. The
  // conversation itself (messages/input) is left alone — only open/closed
  // resets, so context isn't lost by clicking a link.
  //
  // React-Compiler-compliant "adjust state during render" pattern (see
  // react-hooks/set-state-in-effect) rather than a useEffect keyed on the
  // pathname — Nav.jsx's own NavDropdown already uses this exact idiom for
  // the same reason: the state change needs to happen the instant the
  // pathname changes, not after an effect pass, and setState-in-an-effect
  // is what that lint rule (correctly) flags as likely to cascade renders.
  // Same idea as Nav.jsx's own per-mount entrance (its collapsed pill
  // replays its pop-in on every page navigation, since each page mounts a
  // fresh <Nav>) — the launcher and its nudge should read the same way,
  // greeting the visitor again each time they land on a new page, not
  // just once for the whole session. ChatWidget itself is mounted once
  // outside the routed pages (see App.jsx) specifically so the
  // conversation isn't lost on navigation, so it can't just remount like
  // Nav does; `unread` re-arming here plus keying the launcher/nudge
  // below (see the JSX) is what replays the same effect without losing
  // any chat state.
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setOpen(false);
    setUnread(true);
    setHasNewReply(false);
    setHasOpened(false);
  }

  // Clears wasOpen in its own effect (mutating a ref during render is
  // disallowed too, same as calling setState there) rather than inline in
  // the render-time block above — declared *before* the focus-management
  // effect below so it runs first within the same commit, clearing the
  // ref before that effect reads it. Without this, closing the panel via
  // navigation would still be treated as a "real" close by that effect
  // and yank focus back to the launcher, away from the new page.
  useEffect(() => {
    wasOpen.current = false;
  }, [location.pathname]);

  // Keep the transcript pinned to the newest message / typing indicator.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing, open]);

  // Focus the input when the panel opens; return focus to the launcher when
  // it closes, so keyboard users aren't stranded.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    // Panel is closed: only pull focus back to the launcher if it was
    // genuinely open before (a real close), never on the initial load.
    if (wasOpen.current) {
      wasOpen.current = false;
      buttonRef.current?.focus();
    }
  }, [open]);

  // Escape closes the panel while it's open.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Mutually exclusive with the mobile nav dropdown (see Nav.jsx's own
  // matching pair of effects) — the two are unrelated fixed-position
  // overlays that would otherwise both be able to stay open at once,
  // stacking awkwardly on a small screen.
  useEffect(() => {
    if (open) announcePanelOpened("chat");
  }, [open]);

  useEffect(() => onOtherPanelOpened("chat", () => setOpen(false)), []);

  useEffect(() => () => {
    clearTimeout(replyTimer.current);
    clearTimeout(engagementTimer.current);
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Resets the "how long has the visitor gone quiet" clock and reschedules
  // the next proactive check-in — called both after every message the
  // visitor sends (so it always counts from their last activity) and again
  // at the end of each check-in itself, so the hospitality keeps going for
  // as long as the conversation stays open, not just once.
  function scheduleEngagement() {
    clearTimeout(engagementTimer.current);
    engagementTimer.current = setTimeout(() => {
      let idx = lastEngagementIndex.current;
      if (ENGAGEMENT_MESSAGES.length > 1) {
        while (idx === lastEngagementIndex.current) {
          idx = Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length);
        }
      } else {
        idx = 0;
      }
      lastEngagementIndex.current = idx;
      const msg = ENGAGEMENT_MESSAGES[idx];
      setMessages((m) => [...m, { role: "bot", text: msg.text, links: msg.links, showSuggestions: false }]);
      if (!openRef.current) setHasNewReply(true);
      scheduleEngagement();
    }, ENGAGEMENT_INTERVAL_MS);
  }

  function send(rawText) {
    const text = rawText.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const res = getBotResponse(text);
      setTyping(false);
      setMessages((m) => [
        ...m,
        { role: "bot", text: res.text, links: res.links, showSuggestions: res.fallback },
      ]);
      if (!openRef.current) setHasNewReply(true);
    }, REPLY_DELAY_MS);
    // Only starts once the visitor has actually said something — a silent
    // visitor who never engages shouldn't get unsolicited check-ins, just
    // someone who started a real back-and-forth and then went quiet.
    scheduleEngagement();
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className={`hp-chat${open ? " hp-chat--open" : ""}${unread || hasNewReply ? " hp-chat--unread" : ""}`}>
      {open && (
        <div className="hp-chat__panel" role="dialog" aria-label="US Panels assistant" aria-modal="false">
          <header className="hp-chat__header">
            <div className="hp-chat__header-title">
              <span className="hp-chat__status-dot" aria-hidden="true" />
              <div>
                <p className="hp-chat__title">US Panels Assistant</p>
                <p className="hp-chat__subtitle">Typically replies instantly</p>
              </div>
            </div>
            <button type="button" className="hp-chat__close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="hp-chat__messages" ref={listRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`hp-chat__msg hp-chat__msg--${msg.role}`}>
                <div className="hp-chat__bubble">
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j} className="hp-chat__line">{line}</span>
                  ))}
                  {msg.links && (
                    <div className="hp-chat__links">
                      {msg.links.map((link) => (
                        <Link
                          key={link.href}
                          to={resolveLink(link.href, location.pathname)}
                          className="hp-chat__link"
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {msg.showSuggestions && (
                  <div className="hp-chat__suggestions">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="hp-chat__chip"
                        onClick={() => send(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="hp-chat__msg hp-chat__msg--bot">
                <div className="hp-chat__bubble hp-chat__bubble--typing" aria-label="Assistant is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <form className="hp-chat__input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="hp-chat__input"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Type your question"
            />
            <button type="submit" className="hp-chat__send" disabled={!input.trim() || typing} aria-label="Send message">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 12l16-8-6 16-3-6-7-2z" fill="currentColor" />
              </svg>
            </button>
          </form>

          <p className="hp-chat__disclaimer">I'm here to help, ask me anything!</p>
        </div>
      )}

      {/* Keyed on the route — forces React to tear down and recreate this
          subtree on every navigation (rather than just re-rendering the
          same nodes), which is what actually makes the CSS entrance
          animations on .hp-chat__launcher / .hp-chat__nudge replay: a CSS
          `animation` only plays once per element per browser paint,
          fresh DOM nodes from a fresh mount are what re-triggers it,
          simply changing a class on the same nodes wouldn't. */}
      <div className="hp-chat__launcher-wrap" key={location.pathname}>
        {!open && (unread || hasNewReply) && (
          <div className={`hp-chat__nudge${hasNewReply ? " hp-chat__nudge--instant" : ""}`} role="status">
            <span className="hp-chat__nudge-dot" aria-hidden="true" />
            {hasNewReply ? "New reply from the assistant!" : "You have a new message!"}
          </div>
        )}

        {/* Once the visitor has read/dismissed the unread nudge above, the
            launcher settles into a permanent status pill instead of going
            bare — reassures a visitor who's already seen the chat that
            it's ready for another question, not just decoration on their
            first ever visit. */}
        {!open && !unread && !hasNewReply && (
          <div className="hp-chat__nudge hp-chat__nudge--online" role="status">
            <span className="hp-chat__nudge-dot hp-chat__nudge-dot--online" aria-hidden="true" />
            Ask me anything!
          </div>
        )}

        <button
          ref={buttonRef}
          type="button"
          className="hp-chat__launcher"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              setHasNewReply(false);
              setUnread(false);
              setHasOpened(true);
            }
          }}
          aria-label={open ? "Close chat assistant" : "Open chat assistant"}
          aria-expanded={open}
        >
          {open ? (
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          ) : (
            <img
              src={
                hasNewReply
                  ? mascotIconNewMessage
                  : hasOpened
                  ? mascotIconOpened
                  : mascotIconDefault
              }
              alt=""
              className="hp-chat__launcher-icon"
              aria-hidden="true"
              style={{
                clipPath: hasNewReply
                  ? POSE_CLIP_PATHS.newMessage
                  : hasOpened
                  ? POSE_CLIP_PATHS.opened
                  : POSE_CLIP_PATHS.default,
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}

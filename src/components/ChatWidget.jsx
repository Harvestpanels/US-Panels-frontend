import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./ChatWidget.css";
import { getBotResponse } from "../utils/chatbot";
import { SUGGESTED_QUESTIONS } from "../data/botKnowledge";

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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  // The red badge: every fresh page load starts a fresh conversation (the
  // greeting message resets too), so the badge should always greet the
  // visitor again on refresh, not just once ever per browser.
  const [unread, setUnread] = useState(true);
  // Separate from `unread` (which is a one-time "you've never opened this"
  // flag): re-lights the badge whenever a bot reply lands while the panel
  // is folded, e.g. the visitor closed it mid-typing-indicator. Cleared the
  // next time they open the panel.
  const [hasNewReply, setHasNewReply] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const replyTimer = useRef(null);
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
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setOpen(false);
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

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

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

      <div className="hp-chat__launcher-wrap">
        {!open && (unread || hasNewReply) && (
          <div className={`hp-chat__nudge${hasNewReply ? " hp-chat__nudge--instant" : ""}`} role="status">
            {hasNewReply ? "New reply from the assistant!" : "You have a new message!"}
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
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4.2 3.6A.6.6 0 0 1 4 19.1z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

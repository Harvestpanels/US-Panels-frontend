import { BOT_INTENTS, FAQS } from "../data/botKnowledge";

// Words carrying no matching signal — stripped from both the query and the
// knowledge base so scoring is driven by meaningful terms only.
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "am", "be", "been", "being", "do", "does", "did", "have", "has", "had",
  "i", "you", "we", "they", "he", "she", "it", "me", "my", "your", "our", "us", "of", "to", "in", "on",
  "for", "with", "and", "or", "but", "if", "so", "at", "by", "from", "about", "as", "can", "could", "would",
  "should", "will", "what", "which", "who", "how", "when", "where", "why", "this", "that", "these", "those",
  "there", "here", "please", "tell", "give", "want", "need", "get", "any", "some", "more", "much", "many",
  "kind", "sort", "type",
]);

// Query-side synonym expansion: when a token on the left appears in the
// user's message, the terms on the right are added to the token set too, so
// "price"/"cost"/"quote" all reach the same pricing intent even though a
// given knowledge entry only lists one of them. Deliberately one-directional
// (expand the QUERY, not the knowledge base) to keep it predictable.
const SYNONYMS = {
  cost: ["price", "pricing", "quote", "estimate", "expensive", "afford", "budget"],
  price: ["cost", "pricing", "quote", "estimate"],
  quote: ["cost", "price", "estimate", "pricing"],
  buy: ["purchase", "order", "cost", "price"],
  color: ["colour", "finish", "paint", "palette"],
  colour: ["color", "finish"],
  delivery: ["deliver", "ship", "shipping", "freight", "lead"],
  ship: ["shipping", "deliver", "delivery"],
  fast: ["quick", "speed", "soon", "lead"],
  insulation: ["rvalue", "r8", "thermal", "energy"],
  rvalue: ["insulation", "thermal", "r8"],
  contact: ["phone", "email", "call", "reach", "number"],
  phone: ["call", "number", "contact"],
  email: ["mail", "contact"],
  location: ["address", "where", "located", "office"],
  address: ["location", "where", "located"],
  spec: ["specs", "specification", "specifications", "technical", "datasheet"],
  cert: ["certification", "certifications", "certified", "certificate"],
  fire: ["fireproof", "flame", "burn", "fm", "class1"],
  door: ["doors", "entry"],
  panel: ["panels"],
  foam: ["core", "pir", "pur", "eps", "insulation"],
  mineral: ["rockwool", "wool"],
  install: ["installation", "installing", "fit", "fitting", "mount"],
  size: ["sizes", "dimension", "dimensions", "length", "lengths", "width", "thickness"],
  warranty: ["guarantee", "guaranteed", "lifespan"],
  product: ["products", "sell", "offer", "catalog", "catalogue"],
  human: ["person", "representative", "rep", "agent", "someone"],
};

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // punctuation → spaces (keeps digits, e.g. "r8", "9001")
    .replace(/\s+/g, " ")
    .trim()
    // Collapse the many ways people write R-value into one strong token —
    // otherwise "r" gets dropped as a 1-char word and only the useless
    // "value" survives, so "what's the r value" matched nothing.
    .replace(/\br value\b/g, "rvalue")
    .replace(/\br8\b/g, "rvalue")
    .replace(/\br 8\b/g, "rvalue");
}

function tokenize(text) {
  const words = normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  // Light singularization: also emit the singular of any plural so
  // "doors"/"panels"/"colors" match a knowledge entry that only lists the
  // singular (and vice-versa via the synonym map). Skips "ss" endings
  // ("class" shouldn't become "clas") and very short words.
  const out = [];
  for (const w of words) {
    out.push(w);
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) out.push(w.slice(0, -1));
  }
  return out;
}

// Expands a query's tokens with their synonyms (one hop). Returns a Set so
// the same term added from two sources is only counted once.
function expandTokens(tokens) {
  const set = new Set(tokens);
  for (const t of tokens) {
    const syns = SYNONYMS[t];
    if (syns) syns.forEach((s) => set.add(s));
  }
  return set;
}

// Turns the raw knowledge sources into a uniform scored-lookup shape. Each
// entry keeps: a Set of significant tokens (drawn from its explicit keywords
// AND, for FAQs, the question text), the multi-word keyword phrases (for a
// phrase-contains bonus), the answer, and any links. Built once at import.
function buildKnowledgeBase() {
  const kb = [];

  for (const intent of BOT_INTENTS) {
    const tokenSet = new Set();
    const phrases = [];
    for (const kw of intent.keywords) {
      tokenize(kw).forEach((t) => tokenSet.add(t));
      if (kw.includes(" ")) phrases.push(normalize(kw));
    }
    kb.push({ id: intent.id, tokens: tokenSet, phrases, answer: intent.answer, links: intent.links || null, weight: 1.15 });
  }

  FAQS.forEach((faq, i) => {
    const tokenSet = new Set(tokenize(faq.question));
    kb.push({ id: `faq-${i}`, tokens: tokenSet, phrases: [normalize(faq.question)], answer: faq.answer, links: null, weight: 1 });
  });

  return kb;
}

const KNOWLEDGE_BASE = buildKnowledgeBase();

// Minimum score an entry must reach to be treated as a confident answer.
// Below this we return a graceful fallback instead of a weak guess. Set to
// 1.0 so a single solid topic keyword ("doors", "install", "rvalue") is
// enough to answer — for a support bot, answering a clearly on-topic
// one-word-signal question beats over-refusing. Genuinely off-topic input
// ("how do banana boats work") still scores 0 and falls back cleanly.
const MATCH_THRESHOLD = 1.0;

// Scores the query against every knowledge entry and returns the best answer,
// or a fallback flagged with `fallback: true`. Scoring: each shared
// significant token is worth 1 (weighted by the entry's own weight so curated
// intents edge out auto-derived FAQ tokens on ties), plus a bonus when the
// raw query text contains one of the entry's multi-word key phrases outright.
export function getBotResponse(rawInput) {
  const queryTokens = tokenize(rawInput);
  if (queryTokens.length === 0) {
    return {
      text: "Ask me anything about US Panels, our products, pricing, specs, certifications, or delivery.",
      links: null,
      fallback: true,
    };
  }

  const expanded = expandTokens(queryTokens);
  const normalizedQuery = normalize(rawInput);

  let best = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let overlap = 0;
    for (const token of expanded) {
      if (entry.tokens.has(token)) overlap += 1;
    }
    if (overlap === 0) continue;

    let score = overlap * entry.weight;
    // Whole-phrase hit (e.g. the user typed "how much do panels cost" and the
    // FAQ question is literally that) is a strong signal — bump it.
    for (const phrase of entry.phrases) {
      if (phrase.length > 4 && normalizedQuery.includes(phrase)) {
        score += 2.5;
        break;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= MATCH_THRESHOLD) {
    return { text: best.answer, links: best.links, fallback: false };
  }

  return {
    text:
      "I'm not sure I have an answer for that one. I can help with our products, pricing, specs, certifications, colors, delivery, and contact info, try one of the suggestions below, or reach our team directly.",
    links: [{ label: "Contact our team", href: "/#contact" }],
    fallback: true,
  };
}

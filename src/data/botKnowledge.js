import { FAQS } from "./faqs";
import { CONTACT } from "./site";

// Supplemental assistant intents that go BEYOND the on-page FAQ list —
// greetings, contact details, "take me to X" navigation, and topic
// summaries that don't map cleanly to a single FAQ question. Each intent
// carries its own explicit `keywords` (the matcher weights these heavily),
// an `answer`, and optional `links` rendered as buttons under the reply.
//
// The FAQS array is folded into the same knowledge base at load time (see
// buildKnowledgeBase in utils/chatbot.js) — its questions are auto-tokenized
// into keywords — so anything already answered there is covered without
// being duplicated here.
export const BOT_INTENTS = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "howdy", "greetings", "good morning", "good afternoon", "good evening", "yo", "sup"],
    answer: "Hi! I'm the US Panels assistant. I can answer questions about our insulated metal panels and doors, products, specs, pricing, certifications, delivery, and more. What would you like to know?",
  },
  {
    id: "thanks",
    keywords: ["thanks", "thank you", "thx", "appreciate it", "cheers", "ty"],
    answer: "You're welcome! Anything else I can help you with about our panels or doors?",
  },
  {
    id: "bot-identity",
    keywords: ["who are you", "what are you", "are you a bot", "are you human", "are you real", "what is this", "chatbot", "assistant"],
    answer: "I'm the US Panels virtual assistant, an automated helper for common questions about our insulated metal panels and doors. For anything I can't answer, I'll point you to our team.",
  },
  {
    id: "human",
    keywords: ["talk to a human", "speak to someone", "real person", "sales rep", "representative", "agent", "call someone", "contact sales", "speak to sales"],
    answer: `Happy to connect you with our team. Call ${CONTACT.phone} or email ${CONTACT.email}, or use the contact form and we'll get right back to you.`,
    links: [{ label: "Contact us", href: "/#contact" }],
  },
  {
    id: "contact",
    keywords: ["contact", "phone", "phone number", "call", "email", "address", "location", "where are you", "reach you", "get in touch", "hours", "office"],
    answer: `You can reach US Panels at:\n\nPhone: ${CONTACT.phone}\nEmail: ${CONTACT.email}\nAddress: ${CONTACT.address}`,
    links: [{ label: "Open contact form", href: "/#contact" }],
  },
  {
    id: "quote",
    keywords: ["quote", "get a quote", "estimate", "free estimate", "pricing", "price", "how much", "cost", "budget", "request pricing"],
    answer: "Every project is priced to spec, so the fastest way to get an accurate number is a free estimate. As a rough guide, panels typically run $3–$10 per square foot depending on type, thickness, finish, and project size. Send us your specs and we'll put together a no-cost estimate.",
    links: [{ label: "Request a free estimate", href: "/#contact" }],
  },
  {
    id: "products-overview",
    keywords: ["products", "what do you sell", "what do you offer", "product line", "catalog", "panel types", "types of panels", "what panels", "browse products", "your products"],
    answer: "We supply insulated wall & roof panels, mineral-wool fire-rated panels, cold storage panels, insulated doors (hinged, sliding, roll-up), and trim & hardware. You can browse the full catalog on our Products page.",
    links: [{ label: "Browse products", href: "/products" }],
  },
  {
    id: "specs-page",
    keywords: ["specs", "specifications", "technical data", "spec sheet", "data sheet", "engineering data", "tolerances", "load", "span", "weight", "thickness", "dimensions", "sizes chart"],
    answer: "Full technical details, core material, color options, certifications & fire ratings, structural sizing, panel weight, thermal insulation, and load/span charts, live on our Specs page.",
    links: [{ label: "View full specs", href: "/specs" }],
  },
  {
    id: "certifications",
    keywords: ["certification", "certified", "certifications", "fire rating", "fire rated", "fm approved", "factory mutual", "iso", "iso 9001", "ul", "fm 4880", "fm 4881", "fm 4471", "class 1", "standards", "compliance"],
    answer: "Our panels are manufactured under an ISO 9001 quality system and tested to FM's Class 1 fire performance standards, FM 4880 (fire rating), FM 4881 (exterior wall systems), and FM 4471 (roof assemblies). Full details and the individual test standards are on the Specs page.",
    links: [{ label: "See certifications", href: "/specs#certifications" }],
  },
  {
    id: "colors",
    keywords: ["color", "colors", "colours", "finish", "finishes", "paint", "palette", "swatches", "custom color", "what colors"],
    answer: "We offer standard finishes including Grey White, White, White Aluminum, Ivory, Light Blue, Gentian Blue, Signal Green, Colza Yellow, Pure Orange, and Flame Red, and custom colors on request. You can preview each finish on an actual panel on the Specs page.",
    links: [{ label: "View color palette", href: "/specs#colors" }],
  },
  {
    id: "insulation",
    keywords: ["rvalue", "r value", "insulation", "insulating", "insulated", "thermal", "r8", "energy efficiency", "energy efficient", "how insulated", "thermal performance"],
    answer: "Our panels deliver about R-8 per inch of thickness. Exact insulation values (R-values) depend on panel thickness and core material, thicker panels and PIR cores give the highest values. Our team can recommend the right spec for your climate and use case.",
    links: [{ label: "See thermal specs", href: "/specs#engineering" }],
  },
  {
    id: "doors",
    keywords: ["door", "doors", "hinged door", "sliding door", "roll up", "rollup", "cooler door", "freezer door", "entry", "metal door", "insulated door"],
    answer: "Yes, we supply and install insulated metal doors to match the thermal performance of the panels around them: hinged cooler doors, sliding cooler doors, and metal doors for cold storage, clean rooms, and general access.",
    links: [{ label: "Browse doors", href: "/products" }],
  },
  {
    id: "core-materials",
    keywords: ["pir", "pur", "eps", "mineral wool", "rockwool", "rock wool", "foam", "core", "core material", "insulation type", "polyisocyanurate", "polyurethane", "what foam"],
    answer: "Our panels use a PIR (polyisocyanurate) foam core as standard, a rigid, closed-cell \"Class 1\" foam with high structural strength, fire resistance, and low smoke emission. PUR and mineral wool (rock wool) cores are also available for projects with different fire, cost, or performance needs.",
    links: [{ label: "Learn about panel foam", href: "/specs#foam-core" }],
  },
  {
    id: "delivery",
    keywords: ["delivery", "deliver", "shipping", "ship", "how fast", "lead time", "lead times", "how long to get", "when can i get", "availability", "in stock", "stock"],
    answer: "We keep consistent stock in pre-cut lengths and ship from our centrally located Oklahoma distribution center, delivery anywhere in the U.S. within 48 hours of departure. Custom orders can typically be fulfilled within 30 days.",
  },
  {
    id: "warranty",
    keywords: ["warranty", "guarantee", "guaranteed", "how long do panels last", "lifespan", "durability"],
    answer: "Insulated metal panels are built to hold up over decades of use, low-maintenance, moisture-resistant, and durable. For specific warranty terms on your product and project, reach out to our team.",
    links: [{ label: "Ask about warranty", href: "/#contact" }],
  },
];

// Shown as tappable starter chips when the chat first opens, and again as
// suggestions after a fallback ("I'm not sure...") reply — chosen to steer
// visitors toward the highest-value, best-covered topics.
export const SUGGESTED_QUESTIONS = [
  "What products do you offer?",
  "How much do panels cost?",
  "What certifications do you have?",
  "How fast is delivery?",
  "What's the R-value?",
  "How do I contact you?",
];

export { FAQS };

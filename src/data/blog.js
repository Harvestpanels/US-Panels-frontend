import facilityImg from "../assets/images/General/US Panels Facility2.webp";
import flatProfileImg from "../assets/images/Sections/Panel Profiles/Flat Panel Profile.webp";
import coldStorageImg from "../assets/images/Sections/Cold Storage/Cold Storage - Exterior Panels.webp";
import photoGalleryImg from "../assets/images/Sections/Photo Gallery/PG5.webp";
import embossedProfileImg from "../assets/images/Sections/Panel Profiles/Embossed Panel Profile.webp";
import pebWallRoofImg from "../assets/images/Sections/Pre-Engineered Metal Buildings/Pre-engineered metal buildings - Wall & Roof Panels.webp";

// Placeholder editorial content for the Blog page — no CMS/backend exists
// yet, so posts and testimonials are plain static data here, the same
// pattern every other page's content follows (see panels.js, faqs.js).
// Replace/extend these arrays directly once real posts and reviews are
// ready; the page itself needs no changes to pick up new entries. `image`
// reuses existing site photography rather than dedicated blog photos, since
// no CMS/uploads pipeline exists yet to source real per-post images.
export const BLOG_POSTS = [
  {
    category: "Company News",
    title: "US Panels Expands Oklahoma Distribution Center",
    date: "2026-06-02",
    excerpt: "Our centrally located distribution center has expanded stocked capacity, keeping standard panel lengths in stock and ready to ship within 48 hours nationwide.",
    image: facilityImg,
  },
  {
    category: "Industry Insights",
    title: "Choosing the Right Core: PIR vs. PUR vs. Mineral Wool",
    date: "2026-05-18",
    excerpt: "A breakdown of how each foam core performs on fire rating, thermal efficiency, and cost, so you can match the right one to your project's requirements.",
    image: flatProfileImg,
  },
  {
    category: "Case Study",
    title: "48-Hour Turnaround for a Regional Cold Storage Build-Out",
    date: "2026-04-30",
    excerpt: "How stocked panel availability let a regional food distributor complete a cold storage expansion on a tight deadline, without waiting on a custom production run.",
    image: coldStorageImg,
  },
  {
    category: "Industry Insights",
    title: "What Fire Rating Class Actually Means for Your Building",
    date: "2026-04-09",
    excerpt: "FM 4880, Class 1, and what the test standards behind our certifications actually cover, in plain terms for anyone speccing a project for the first time.",
    image: photoGalleryImg,
  },
  {
    category: "Company News",
    title: "New Embossed Panel Finish Now Available",
    date: "2026-03-21",
    excerpt: "A textured, imperfection-hiding finish joins our standard Box and Flat face profiles, now available across the full panel lineup.",
    image: embossedProfileImg,
  },
  {
    category: "Case Study",
    title: "Retrofitting a Pre-Engineered Metal Building with Insulated Panels",
    date: "2026-02-27",
    excerpt: "A look at how insulated wall and roof panels upgraded an existing metal building's thermal performance without a full structural rebuild.",
    image: pebWallRoofImg,
  },
];

export const TESTIMONIALS = [
  {
    quote: "US Panels had our cold storage panels in stock and on a truck the same week we called. That kind of lead time just doesn't exist anywhere else in this industry.",
    name: "Marcus Webb",
    role: "Project Manager",
    company: "Webb Cold Chain Logistics",
  },
  {
    quote: "The team walked us through core options and fire ratings without ever pushing us toward the most expensive choice. We ended up with exactly the spec our project needed.",
    name: "Dana Ferreira",
    role: "General Contractor",
    company: "Ferreira Builders",
  },
  {
    quote: "Installation was faster than any built-up wall system we've used before. One panel really did replace framing, insulation, and exterior finish in a single pass.",
    name: "Aaron Kim",
    role: "Site Superintendent",
    company: "Kim Construction Group",
  },
  {
    quote: "From the first call to final delivery, communication was clear at every step. No surprises on lead time, no surprises on the invoice.",
    name: "Priya Nair",
    role: "Facilities Director",
    company: "Nair Pharmaceutical Group",
  },
];

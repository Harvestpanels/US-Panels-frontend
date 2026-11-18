// Stamps the shared menu and footer into every page in concept/, so they never drift apart.
// Run:  node scripts/stamp-concept.mjs
// Each page keeps the block between <!--nav--> ... <!--/nav--> and <!--footer--> ... <!--/footer-->;
// pages that do not have the markers yet get them wrapped around their existing menu / footer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'concept');

// Same menu structure as harvestpanels.com: Products, Industries, 3D Showroom, Specs, Contact.
// Doors, Trim & Hardware and Architectural are reached from the Products page (jump chips) and the footer.
const LINKS = [
  ['products.html', 'Products'],
  ['projects.html', 'Industries'],
  ['showroom.html', '3D Showroom'],
  ['specs.html', 'Specs'],
  ['quote.html', 'Contact'],
];
const TEL = '<a href="tel:4057782808">(405) 778-2808</a>';

// pages that live under a menu item (the menu item is marked while you are on them)
const PARENT = { 'data-centers.html': 'projects.html', 'doors.html': 'products.html', 'trim.html': 'products.html', 'architectural.html': 'products.html' };

const cur = (h, file) => (h === (PARENT[file] || file) ? ' aria-current="page"' : '');
const links = (list, file) => list.map(([h, t]) => `<a href="${h}"${cur(h, file)}>${t}</a>`).join('');
const nav = file => `<!--nav-->
<header class="nav" id="nav">
  <div class="wrap">
    <a class="brand" href="index.html"><img src="img/logo.webp" alt="US Panels" width="96" height="36"></a>
    <nav class="menu" aria-label="Main">${links(LINKS, file)}</nav>
    <a class="tel" href="tel:4057782808">(405) 778-2808</a>
    <a class="btn red hide-m" href="quote.html">Get a quote</a>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="drawer" id="drawer">
  ${links(LINKS, file)}
  ${TEL}
  <a class="btn red" href="quote.html">Get a quote</a>
</div>
<!--/nav-->`;

const footer = () => `<!--footer-->
<footer><div class="wrap">
  <div class="cols"><div><img src="img/logo.webp" alt="US Panels" width="107" height="40"><p style="max-width:26em">Exterior insulated metal panels and doors, delivered across the U.S. from Oklahoma stock.</p></div>
    <div><h4>Products</h4><a href="products.html#wall-roof">Wall &amp; roof panels</a><a href="products.html#fire-rated">Fire-rated panels</a><a href="products.html#cold-storage">Cold storage panels</a><a href="doors.html">Doors</a><a href="trim.html">Trim &amp; hardware</a><a href="architectural.html">Architectural</a></div>
    <div><h4>Explore</h4><a href="showroom.html">3D Showroom</a><a href="projects.html">Projects</a><a href="specs.html">Specs</a><a href="quote.html">Get a quote</a></div>
    <div><h4>Contact</h4><a href="tel:4057782808">(405) 778-2808</a><a href="mailto:Sales@uspanels.com">Sales@uspanels.com</a><span>7751 N County Line Rd.<br>Piedmont, OK 73078</span></div></div>
  <div class="legal"><span>&copy; <span data-year style="display:inline;padding:0">2026</span> US Panels. All rights reserved.</span><span class="social"><a href="https://www.facebook.com/people/US-Panels/61555678774736/" target="_blank" rel="noopener">Facebook</a><a href="https://www.instagram.com/uspanels/" target="_blank" rel="noopener">Instagram</a><a href="https://www.tiktok.com/@uspanels" target="_blank" rel="noopener">TikTok</a><a href="https://x.com/uspanels" target="_blank" rel="noopener">X</a></span></div>
</div></footer>
<link rel="stylesheet" href="panelo.css">
<script defer src="js/panelo.js"></script>
<!--/footer-->`;

let changed = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
  const p = path.join(dir, file);
  const before = fs.readFileSync(p, 'utf8');
  let s = before;
  if (s.includes('<!--nav-->')) s = s.replace(/<!--nav-->[\s\S]*?<!--\/nav-->/, nav(file));
  else s = s.replace(/<header class="nav"[\s\S]*?<\/header>\s*<div class="drawer" id="drawer">[\s\S]*?<\/div>/, nav(file));
  if (s.includes('<!--footer-->')) s = s.replace(/<!--footer-->[\s\S]*?<!--\/footer-->/, footer());
  else s = s.replace(/<footer>[\s\S]*?<\/footer>/, footer());
  if (!s.includes('<!--nav-->') || !s.includes('<!--footer-->')) console.warn('!! no menu/footer block found in', file);
  if (s !== before) { fs.writeFileSync(p, s); changed++; }
}
console.log('stamped', changed, 'page(s)');

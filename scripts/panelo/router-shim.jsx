// Stand-in for react-router-dom on the static pages: links become plain anchors to the concept pages.
const MAP = {
  "/products": "products.html",
  "/specs": "specs.html",
  "/blog": "index.html",
  "/": "index.html",
};
const HASH = {
  "#contact": "quote.html",            // every "contact us" link opens the quote form page
  "#panels": "products.html",
  "#gallery": "projects.html",
  "#memberships": "specs.html#certifications",
  "#sustainability": "index.html",
};
function toHref(to) {
  const [path, hash = ""] = String(to).split("#");
  if (hash && HASH["#" + hash]) return HASH["#" + hash];
  const base = MAP[path] || (path.endsWith(".html") ? path : "index.html");
  return base + (hash ? "#" + hash : "");
}
export function Link({ to, children, ...rest }) {
  return <a href={toHref(to)} {...rest}>{children}</a>;
}
export function useLocation() {
  return { pathname: window.location.pathname, hash: window.location.hash, search: window.location.search };
}

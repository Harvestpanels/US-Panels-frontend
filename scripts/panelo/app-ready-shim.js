// The static pages have no page loader, so the chat entrance can play as soon as the bundle runs.
export function markAppReady() {}
export function onAppReady(callback) {
  const t = setTimeout(callback, 900);
  return () => clearTimeout(t);
}

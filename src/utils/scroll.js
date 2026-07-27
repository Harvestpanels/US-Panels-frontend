export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollCenter(id) {
  // Keep nav visible during programmatic scrolls triggered by nav clicks
  document.querySelector(".hp-nav")?.classList.remove("hp-nav--hidden");
  const el = document.getElementById(id);
  if (!el) return;
  const glass = el.querySelector(".hp-glass") || el;
  const sectionRect = el.getBoundingClientRect();
  const glassRect = glass.getBoundingClientRect();
  const vh = window.innerHeight;
  const navH = document.querySelector(".hp-nav")?.offsetHeight ?? 70;

  if (sectionRect.height >= vh) {
    // Section (including its own padding) fills the viewport on its own —
    // pin its top just below the nav so nothing above/below leaks into view.
    window.scrollTo({
      top: Math.max(0, window.scrollY + glassRect.top - navH - 16),
      left: 0,
      behavior: "smooth",
    });
  } else {
    // Short section — fits comfortably in the viewport with room to spare,
    // so centering it looks intentional rather than like a clipped section.
    glass.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }
}

export function navClick(e, id, closeMenu) {
  e.preventDefault();
  if (closeMenu) {
    closeMenu();
    // Wait for the mobile nav collapse animation (350ms) before measuring layout
    setTimeout(() => scrollCenter(id), 380);
  } else {
    scrollCenter(id);
  }
}

import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";

// React Router keeps the browser's scroll position across navigations by
// default (it's an SPA — there's no real page load to reset it), so
// without this, landing on a new route mid-scroll from the previous one
// would leave you scrolled partway down the new page instead of at its top.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // The site sets `scroll-behavior: smooth` globally on <html>, which
    // would otherwise turn this into a ~700ms animated scroll-up instead
    // of landing on the new page already at the top — explicit "instant"
    // overrides that.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
    </>
  );
}

export default App;

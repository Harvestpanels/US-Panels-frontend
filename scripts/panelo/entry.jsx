// Panelo, the US Panels chat assistant, for the static pages in concept/.
// The real component from src/components/ChatWidget.jsx is bundled as it is; router, page-loader and image imports are swapped for small shims
// (see vite.panelo.config.js). Build:  npx vite build -c scripts/panelo/vite.panelo.config.js   (writes concept/js/panelo.js and concept/panelo.css)
import { createRoot } from "react-dom/client";
import ChatWidget from "../../src/components/ChatWidget";

const mount = document.createElement("div");
mount.id = "panelo-root";
document.body.appendChild(mount);
createRoot(mount).render(<ChatWidget />);

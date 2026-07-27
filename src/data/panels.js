import buildingCommercialImg from "../assets/images/Building Envelope/Commercial.webp";
import buildingIndustrialImg from "../assets/images/Building Envelope/Industrial.webp";
import buildingResidentialImg from "../assets/images/Building Envelope/Residential.webp";
import roofCommercialImg from "../assets/images/Roof Panels/Commercial.webp";
import roofIndustrialImg from "../assets/images/Roof Panels/Industrial.webp";
import roofResidentialImg from "../assets/images/Roof Panels/Residential.webp";
// TODO: placeholder photo — swap each card's `img` for a real photo once provided.
import placeholderImg from "../assets/images/US Panels Facility.webp";

export const GALLERY_IMAGES = [
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_0380.jpeg/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Insulated Panel Corridor",
    desc: "A finished interior hallway built entirely from insulated metal panels, ready for climate-controlled use.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/IMG_4979.jpeg/:/rs=w:1300,h:800",
    category: "Production",
    title: "Panel Fabrication Facility",
    desc: "Inside one of our fabrication spaces where panels are prepped and staged before delivery.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse.jpg/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Steel Frame Under Construction",
    desc: "The structural steel frame going up ahead of panel installation on an industrial build.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/b206acf5-13ee-475b-a65d-00398f243975.JPG/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "High-Speed Roll-Up Door",
    desc: "An insulated high-speed door built for fast, efficient access on any exterior loading dock.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/pvc%20wall.jpg/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Corrugated Wall Panel",
    desc: "A durable, corrugated metal wall panel finish suited for industrial and warehouse exteriors.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/37253940_l-5b6bb8e.webp/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Insulated Sliding Door",
    desc: "A heavy-duty sliding door built for consistent temperature control and secure exterior access.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20warehouse%202.jpg/:/rs=w:1300,h:800",
    category: "Exterior",
    title: "Structural Steel Framing",
    desc: "A wide-span steel frame under construction, engineered to carry insulated panel cladding.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/74a5a362-e5c8-4ceb-a326-5fd0cd86305f%202.JPG/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Modular Insulated Enclosure",
    desc: "A compact, standalone insulated enclosure built for a specialized on-site application.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/HR%20Rack1.jpg/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Warehouse Racking System",
    desc: "High-density racking installed inside a panel-built warehouse for efficient storage.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/panel%20ceiling.jpg/:/rs=w:1300,h:800",
    category: "Interior",
    title: "Panel Ceiling Installation",
    desc: "Insulated ceiling panels installed for full thermal envelope coverage.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/12863561-52d0-466e-a0fb-8253e955b2f6.JPG/:/rs=w:1300,h:800",
    category: "Production",
    title: "Panel Production Line",
    desc: "Panels moving through production, ready for cutting, finishing, and shipment.",
  },
  {
    src: "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/0249337c-ae22-4276-8571-5a3e234cc0fd.JPG/:/rs=w:1300,h:800",
    category: "Production",
    title: "Finished Panel Stock",
    desc: "Finished insulated panels staged and ready for delivery to the job site.",
  },
];

export const BUILDING_ENVELOPE_PANELS = [
  {
    name: "Industrial",
    category: "Building Envelope",
    desc: "From a 2,000 sqft shop to a 200,000 sqft factory, insulated metal panels save time and money on every build.",
    img: buildingIndustrialImg,
  },
  {
    name: "Commercial",
    category: "Building Envelope",
    desc: "Commercial facilities need to look good and perform well. Insulated metal panels deliver both.",
    img: buildingCommercialImg,
  },
  {
    name: "Residential",
    category: "Building Envelope",
    desc: "Single-family, multi-family, stand-alone, or connected — a great option for your next residential project.",
    img: buildingResidentialImg,
  },
];

export const ROOF_PANELS = [
  {
    name: "Industrial",
    category: "Roof",
    desc: "A ribbed metal roof profile engineered to shed water fast and hold up to decades of heavy-use weather with minimal maintenance.",
    img: roofIndustrialImg,
  },
  {
    name: "Commercial",
    category: "Roof",
    desc: "Standing seam roof panels with concealed fasteners for a clean, professional roofline on any commercial building.",
    img: roofCommercialImg,
  },
  {
    name: "Residential",
    category: "Roof",
    desc: "Durable, low-maintenance metal roofing built to outlast traditional shingles on single-family and multi-family homes.",
    img: roofResidentialImg,
  },
];

// TODO: every `img` below is a placeholder — swap for real photos one at a time.
export const DATA_CENTER_PANELS = [
  {
    name: "Exterior Panels",
    category: "Data Center",
    desc: "Insulated exterior wall systems built to protect critical equipment with a tight, secure, weather-resistant envelope.",
    img: placeholderImg,
  },
  {
    name: "Interior Panels",
    category: "Data Center",
    desc: "Clean, finish-grade interior panels for server halls and controlled-access spaces that need a durable, easy-to-maintain surface.",
    img: placeholderImg,
  },
  {
    name: "Benefits",
    category: "Data Center",
    desc: "Consistent thermal performance, fire-rated core options, and fast installation help keep critical environments stable and on schedule.",
    img: placeholderImg,
  },
];

export const COLD_STORAGE_PANELS = [
  {
    name: "Exterior Panels",
    category: "Cold Storage",
    desc: "Heavy-duty insulated exterior panels engineered to hold a tight thermal envelope for refrigerated and frozen storage facilities.",
    img: placeholderImg,
  },
  {
    name: "Interior Panels",
    category: "Cold Storage",
    desc: "Interior partition panels built for consistent temperature zones, with finishes suited to food-safety and sanitation requirements.",
    img: placeholderImg,
  },
  {
    name: "Benefits",
    category: "Cold Storage",
    desc: "Superior insulation values, moisture resistance, and low-maintenance surfaces keep cold storage facilities efficient year-round.",
    img: placeholderImg,
  },
];

export const PEMB_PANELS = [
  {
    name: "Frame & Structure",
    category: "Metal Building",
    desc: "Pre-engineered steel frame systems designed for fast erection and a strong, code-compliant structural foundation.",
    img: placeholderImg,
  },
  {
    name: "Wall & Roof Panels",
    category: "Metal Building",
    desc: "Insulated wall and roof panel systems that clad the structure for a complete, weather-tight building envelope.",
    img: placeholderImg,
  },
  {
    name: "Custom Options",
    category: "Metal Building",
    desc: "Custom sizes, designs, and color options let every pre-engineered building match the look and footprint your project needs.",
    img: placeholderImg,
  },
];

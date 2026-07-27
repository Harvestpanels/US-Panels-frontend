import placeholderImg from "../assets/images/US Panels Facility.webp";

// TODO: every `img` using placeholderImg is a stand-in — swap for real
// product photos one at a time once provided.
const rollUpDoorImg =
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/b206acf5-13ee-475b-a65d-00398f243975.JPG/:/rs=w:1300,h:800";
const slidingDoorImg =
  "//img1.wsimg.com/isteam/ip/9d047147-aa87-4de4-9ec4-ce8e08e069a7/37253940_l-5b6bb8e.webp/:/rs=w:1300,h:800";

export const PRODUCT_CATEGORIES = [
  {
    id: "foam-panels",
    name: "Insulated Wall & Roof Panels",
    blurb:
      "Double-steel-sheet panels insulated with rigid polyurethane (PUR) or polyisocyanurate (PIR) foam core, our highest-volume product line for industrial, commercial, and residential building envelopes.",
    products: [
      {
        name: "USP Fortis Wall Panel",
        spec: "PIR/PUR core · concealed double-joint",
        desc: "A flagship wall panel with an advanced concealed double-joint system and reinforced mechanical seals for high load capacity and a clean exterior finish.",
        img: placeholderImg,
      },
      {
        name: "USP Box Wall Panel",
        spec: "PIR core · through-fastened, saddle washer",
        desc: "A through-fastened wall panel secured with saddle washers for a steady, durable finish, available in ribbed, boxed, or smooth steel profiles.",
        img: placeholderImg,
      },
      {
        name: "USP Cop Roof Panel",
        spec: "PIR core · double-steel roof profile",
        desc: "A double-steel roof panel insulated with rigid polyurethane foam, built for general construction and cold storage roofing alike.",
        img: placeholderImg,
      },
      {
        name: "USP Grecata Roof Panel",
        spec: "PIR core · U-rib corrugated profile",
        desc: "A corrugated roofing sandwich panel with a U-rib profile and internal aluminum support, engineered for long-span roof runs.",
        img: placeholderImg,
      },
    ],
  },
  {
    id: "mineral-wool-panels",
    name: "Mineral Wool Fire-Rated Panels",
    blurb:
      "Panels insulated with mineral rockwool instead of foam, built for projects where fire rating and acoustic performance matter as much as thermal performance.",
    products: [
      {
        name: "USP Fireguard Wall Panel — Exposed Fastening",
        spec: "Mineral wool core · through-fastened, saddle washer",
        desc: "A self-supporting wall panel with a tongue-and-groove joint, insulated with mineral rockwool and secured with a visible through-fastened, saddle-washer system.",
        img: placeholderImg,
      },
      {
        name: "USP Fireguard Wall Panel — Hidden Fastening",
        spec: "Mineral wool core · concealed fastening",
        desc: "The same self-supporting mineral wool wall panel with a concealed fastening system on each side for a smooth, uninterrupted finish.",
        img: placeholderImg,
      },
      {
        name: "USP Fireguard Wall Panel — Acoustic",
        spec: "Mineral wool core · micro-perforated liner",
        desc: "A mineral wool wall panel with a micro-perforated internal steel liner and visible fastening, tuned for sound absorption alongside fire resistance.",
        img: placeholderImg,
      },
      {
        name: "USP Fireguard Roof Panel",
        spec: "Mineral wool core · self-supporting, low slope",
        desc: "A self-supporting mineral wool roof panel rated for low-slope roofing, with an external ribbed steel sheet for added static and dynamic strength.",
        img: placeholderImg,
      },
      {
        name: "USP Fireguard Roof Panel — Acoustic",
        spec: "Mineral wool core · micro-perforated liner",
        desc: "A self-supporting mineral wool roof panel with a micro-perforated interior liner and tongue-and-groove joint for added sound-dampening performance.",
        img: placeholderImg,
      },
    ],
  },
  {
    id: "cold-storage-panels",
    name: "Cold Storage Panels",
    blurb:
      "Hygienic-finish panels engineered to hold a tight, consistent thermal envelope for refrigerated and frozen storage, clean rooms, and food-processing spaces.",
    products: [
      {
        name: "USP Coldbox TPO/PVC Panel",
        spec: "PIR core · hygienic TPO or PVC finish",
        desc: "An insulated panel with a hygienic TPO or PVC finish, ideal for cold storage rooms, clean rooms, and processing areas needing moisture resistance and easy maintenance.",
        img: placeholderImg,
      },
      {
        name: "USP Box Vinyl Panel",
        spec: "PIR/PUR core · monolayer vinyl finish",
        desc: "A monolayer wall panel with a rigid PIR/PUR foam core and a durable vinyl finish suited for wash-down and sanitation-sensitive environments.",
        img: placeholderImg,
      },
      {
        name: "USP Wall Vinyl Panel",
        spec: "PIR/PUR core · monolayer vinyl finish",
        desc: "A monolayer wall panel companion to the Box Vinyl line, insulated with rigid PIR/PUR foam for consistent cold-storage wall performance.",
        img: placeholderImg,
      },
    ],
  },
  {
    id: "doors",
    name: "Insulated Doors",
    blurb:
      "Insulated doors built to match the thermal performance of the panel envelope around them, for fast, secure, and efficient access.",
    products: [
      {
        name: "High-Speed Roll-Up Door",
        spec: "Insulated · fast-cycle operation",
        desc: "A high-speed insulated roll-up door built for efficient, low-heat-loss access on busy loading docks.",
        img: rollUpDoorImg,
      },
      {
        name: "Insulated Sliding Door",
        spec: "Insulated · heavy-duty track",
        desc: "A heavy-duty sliding door built for consistent temperature control and secure exterior access.",
        img: slidingDoorImg,
      },
      {
        name: "Insulated Swing Door",
        spec: "Insulated · personnel access",
        desc: "A personnel-access swing door insulated to match the surrounding panel envelope's thermal performance.",
        img: placeholderImg,
      },
    ],
  },
];

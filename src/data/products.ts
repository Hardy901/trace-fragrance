export interface FragranceNoteGroup {
  top: string[];
  heart: string[];
  base: string[];
}

export interface FragranceMetrics {
  sillage: string;
  longevity: string;
  concentration: string;
  oilPurity: string;
  maceration: string;
}

export interface FragranceProduct {
  id: string;
  number: string;
  name: string;
  alternateName?: string;
  category: string;
  productType: string;
  tagline: string;
  shortDescription: string;
  fullStory: string;
  accords: string[];
  notes: FragranceNoteGroup;
  metrics: FragranceMetrics;
  price: number;
  formattedPrice: string;
  volume: string;
  concentration: string;
  image: string;
  panelImage: string;
  palette: {
    stoneColor: string;
    accent: string;
    badgeBg: string;
    bgContrast: string;
    textContrast: string;
    borderContrast: string;
  };
  inStock: boolean;
}

export interface DiscoverySetProduct {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  shortDescription: string;
  fullStory: string;
  price: number;
  formattedPrice: string;
  configuration: string;
  vialVolume: string;
  totalVials: number;
  packagingDetails: string[];
  images: {
    boxClosed: string;
    boxOpen: string;
  };
  inStock: boolean;
}

export interface BrandConfig {
  name: string;
  primaryHeadline: string;
  primarySlogan: string;
  secondaryBrandLine: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  customerSupportEmail: string;
  customerSupportPhone?: string;
  instagramHandle: string;
  dispatchTime: string;
}

export const BRAND_CONFIG: BrandConfig = {
  name: "TRACE",
  primaryHeadline: "BEYOND SCENT. INTO MEMORY.",
  primarySlogan: "30% Pure Oil Concentration. 18–24 Hours Unbroken Stay.",
  secondaryBrandLine: "HYPER-CONCENTRATED LUXURY FRAGRANCE ELIXIRS.",
  currencySymbol: "₹",
  freeShippingThreshold: 1500,
  customerSupportEmail: "concierge@tracefragrances.com",
  customerSupportPhone: "+91 98765 43210",
  instagramHandle: "@trace.fragrance",
  dispatchTime: "Ships within 24-48 business hours"
};

export const FRAGRANCES: FragranceProduct[] = [
  {
    id: "fragrance-01-drift",
    number: "01",
    name: "DRIFT ELIXIR",
    alternateName: "DAYBREAK",
    category: "Fresh / Aquatic Extrait",
    productType: "Extrait Elixir",
    tagline: "Sunlit bergamot and coastal minerals distilled to pure oil density.",
    shortDescription: "Cold-pressed Italian bergamot, crystalline neroli, and coastal ocean mist anchored by dense white ambergris and skin-binding musk.",
    fullStory: "01 DRIFT ELIXIR reimagines aquatic perfumery at extreme concentration. Formulated at 30% pure fragrance oil, it bypasses fleeting top-notes to deliver an indelible mineral-citrus presence that radiates continuously for 18 to 24 hours.",
    accords: ["Ozone Mineral", "Cold-Pressed Citrus", "White Ambergris", "Pure Amber Musk"],
    notes: {
      top: ["Calabrian Bergamot", "Sparkling Neroli", "Crushed Sea Salt"],
      heart: ["Coastal Driftwood", "Wild Peppermint", "Marine Ambergris"],
      base: ["Dense White Musk", "Bleached Atlas Cedar", "Golden Amber Accord"]
    },
    metrics: {
      sillage: "Expansive & Intimate Aura",
      longevity: "18 – 24 Hours Guaranteed",
      concentration: "30% Pure Extrait Oil",
      oilPurity: "Grade A Supercritical CO2",
      maceration: "120 Days Dark Cellared"
    },
    price: 1200,
    formattedPrice: "₹1,200",
    volume: "50 ml / 1.7 FL. OZ.",
    concentration: "30% Extrait Elixir",
    image: "/assets/bottle-01-drift-clean.png",
    panelImage: "/assets/panel-01-drift.jpg",
    palette: {
      stoneColor: "#D6D1C6",
      accent: "#B7A99A",
      badgeBg: "rgba(183, 169, 154, 0.15)",
      bgContrast: "#F3EFE8",
      textContrast: "#242321",
      borderContrast: "#DED4C7"
    },
    inStock: true
  },
  {
    id: "fragrance-02-ignite",
    number: "02",
    name: "IGNITE ELIXIR",
    alternateName: "VERTE",
    category: "Warm / Spicy Extrait",
    productType: "Extrait Elixir",
    tagline: "Roasted highland cardamom, wild fig resin, and century-old noble cedar.",
    shortDescription: "Smoked green tea infusions, velvety wild fig sap, and aged cedarwood fortified with supercritical cardamom extract.",
    fullStory: "02 IGNITE ELIXIR is an intense botanical study in perpetual warmth. Cellared for four months to allow the 30% oil density to bond with aged cedar resins, it leaves a sillage that stays vibrant through 24 hours of wear.",
    accords: ["Roasted Cardamom", "Dark Fig Sap", "Smoked Botanicals", "Atlas Cedar Resin"],
    notes: {
      top: ["Roasted Cardamom Pods", "Matcha Green Tea", "Velvet Fig Leaf"],
      heart: ["Nutmeg Husk", "Florentine Orris", "Crushed Pimento"],
      base: ["Smoked Atlas Cedar", "Cuban Tobacco Resin", "Javanese Vetiver"]
    },
    metrics: {
      sillage: "Radiant & Enveloping",
      longevity: "18 – 24 Hours Guaranteed",
      concentration: "30% Pure Extrait Oil",
      oilPurity: "Grade A Supercritical CO2",
      maceration: "120 Days Dark Cellared"
    },
    price: 1200,
    formattedPrice: "₹1,200",
    volume: "50 ml / 1.7 FL. OZ.",
    concentration: "30% Extrait Elixir",
    image: "/assets/bottle-02-ignite-clean.jpg",
    panelImage: "/assets/panel-02-ignite.jpg",
    palette: {
      stoneColor: "#A39785",
      accent: "#4E855A",
      badgeBg: "rgba(78, 133, 90, 0.15)",
      bgContrast: "#E6ECE7",
      textContrast: "#182B1D",
      borderContrast: "#B6C6B9"
    },
    inStock: true
  },
  {
    id: "fragrance-03-lush",
    number: "03",
    name: "LUSH ELIXIR",
    alternateName: "BURN",
    category: "Radiant Floral Extrait",
    productType: "Extrait Elixir",
    tagline: "Crimson Persian saffron threads melting into nocturne flora and amber suede.",
    shortDescription: "Deep saffron pistils, Centifolia rose absolute, and sun-drenched resinous amber enveloped in supple cured leather.",
    fullStory: "03 LUSH ELIXIR concentrates thousands of rose petals and pure saffron threads into a heavy 30% elixir oil. It clings stubbornly to skin and fabric fibers, projecting an unforgettable signature for a full 24 hours.",
    accords: ["Persian Saffron", "Rose Absolute", "Amber Suede", "Smoked Benzoin"],
    notes: {
      top: ["Crimson Saffron", "Pink Peppercorn", "Bitter Blood Orange"],
      heart: ["Centifolia Rose Absolute", "Night-Blooming Jasmine", "Smoked Black Tea"],
      base: ["Sun-Drenched Amber", "Supple French Leather", "Aged Bourbon Patchouli"]
    },
    metrics: {
      sillage: "Bold Room-Presence",
      longevity: "20 – 24 Hours Guaranteed",
      concentration: "30% Pure Extrait Oil",
      oilPurity: "Grade A Supercritical CO2",
      maceration: "140 Days Dark Cellared"
    },
    price: 1200,
    formattedPrice: "₹1,200",
    volume: "50 ml / 1.7 FL. OZ.",
    concentration: "30% Extrait Elixir",
    image: "/assets/bottle-03-lush-clean.png",
    panelImage: "/assets/panel-03-lush.jpg",
    palette: {
      stoneColor: "#B78A68",
      accent: "#A84452",
      badgeBg: "rgba(168, 68, 82, 0.15)",
      bgContrast: "#EFE8E9",
      textContrast: "#3A161B",
      borderContrast: "#D1BAC0"
    },
    inStock: true
  },
  {
    id: "fragrance-04-vesper",
    number: "04",
    name: "VESPER ELIXIR",
    alternateName: "NOIR",
    category: "Sweet / Amber Extrait",
    productType: "Extrait Elixir",
    tagline: "Madagascar bourbon vanilla pods shrouded in sacred frankincense tears.",
    shortDescription: "Dark smoked vanilla bean, roasted tonka resin, and Mysore sandalwood steeped in ceremonial frankincense.",
    fullStory: "04 VESPER ELIXIR is the pinnacle of nocturnal concentration. Pure resinous vanilla and frankincense oils macerated at 30% concentration create an unbroken 24-hour presence that endures long past the night.",
    accords: ["Smoked Vanilla Pod", "Frankincense Tear", "Roasted Tonka", "Mysore Sandalwood"],
    notes: {
      top: ["Roasted Bitter Almond", "Omani Frankincense", "Bergamot Zest"],
      heart: ["Madagascar Vanilla Pod", "Toasted Tonka Bean", "Orris Root Butter"],
      base: ["Mysore Sandalwood", "Dark Haitian Vetiver", "Golden Siamese Benzoin"]
    },
    metrics: {
      sillage: "Hypnotic & Persistent",
      longevity: "22 – 24+ Hours Guaranteed",
      concentration: "30% Pure Extrait Oil",
      oilPurity: "Grade A Supercritical CO2",
      maceration: "150 Days Dark Cellared"
    },
    price: 1200,
    formattedPrice: "₹1,200",
    volume: "50 ml / 1.7 FL. OZ.",
    concentration: "30% Extrait Elixir",
    image: "/assets/bottle-04-vesper-clean.png",
    panelImage: "/assets/panel-04-vesper.jpg",
    palette: {
      stoneColor: "#393532",
      accent: "#BA834C",
      badgeBg: "rgba(186, 131, 76, 0.15)",
      bgContrast: "#EDE7E1",
      textContrast: "#26211C",
      borderContrast: "#C8BEB4"
    },
    inStock: true
  }
];

export const DISCOVERY_SET: DiscoverySetProduct = {
  id: "trace-discovery-set",
  name: "TRACE ELIXIR DISCOVERY SET",
  subtitle: "Four Extrait Elixirs. 30% Pure Oil Concentration.",
  tagline: "Four 30% oil concentration fragrance elixirs in one rigid discovery box.",
  shortDescription: "Experience all four hyper-concentrated TRACE elixirs with 18–24 hours stay in one luxurious discovery box.",
  fullStory: "TRACE Discovery Set presents the complete elixir quadrant in 4 × 5 ml spray flacons. Formulated at 30% pure essential oil concentration, each miniature delivers 60+ applications with an unbroken 18–24 hour wear time. Housed in a rigid taupe presentation box with custom fitted tray.",
  price: 799,
  formattedPrice: "₹799",
  configuration: "4 × 5 ml Extrait Elixir Flacons",
  vialVolume: "5 ml each (20 ml total)",
  totalVials: 4,
  packagingDetails: [
    "Rigid taupe hinged keepsake presentation box",
    "Four 5 ml miniature spray flacons with matte black caps",
    "Fitted custom internal protective tray",
    "Engraved signature four-point star emblem",
    "Editorial concept cards for each elixir expression",
    "Complimentary archive collector reservation card"
  ],
  images: {
    boxClosed: "/assets/discovery-box-closed.jpg",
    boxOpen: "/assets/discovery-box-new.jpg"
  },
  inStock: true
};

export interface WhyTraceFeature {
  number: string;
  title: string;
  description: string;
  detail: string;
}

export const WHY_TRACE_FEATURES: WhyTraceFeature[] = [
  {
    number: "01",
    title: "30% OIL CONCENTRATION",
    description: "Extrait de parfum grade density for unprecedented depth.",
    detail: "Double the concentration of standard commercial perfumes, delivering a rich, non-evaporating oil matrix."
  },
  {
    number: "02",
    title: "18–24 HOURS STAY",
    description: "Engineered for full day-and-night endurance on skin.",
    detail: "Heavy resinous base molecules that anchor tightly to skin warmth and fabric fibers for around-the-clock projection."
  },
  {
    number: "03",
    title: "MACERATED BOTANICALS",
    description: "Rested in temperature-controlled dark chambers for 120+ days.",
    detail: "Extended maceration allows the complex natural oils to marry seamlessly with deep wood and amber resins."
  },
  {
    number: "04",
    title: "DIRECT HAUTE LUXURY",
    description: "Pure oil luxury without retail middle markups.",
    detail: "Invested directly into oil quality, cold extraction, and heavy glass craft rather than licensing fees."
  }
];

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "product" | "ordering" | "care";
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    category: "product",
    question: "What makes TRACE an Elixir?",
    answer: "Standard perfumes typically contain 12% to 18% fragrance oil. TRACE formulations are crafted as true Extrait Elixirs at 30% pure oil concentration. This extreme density produces an opulent, skin-binding trail that lasts 18 to 24 hours."
  },
  {
    id: "faq-2",
    category: "product",
    question: "How long does each fragrance stay on skin?",
    answer: "Due to our 30% pure oil concentration and 120-day dark maceration process, all TRACE elixirs provide a verified 18 to 24 hours of continuous sillage on skin, and 48+ hours on textiles."
  },
  {
    id: "faq-3",
    category: "product",
    question: "What is included in the discovery set?",
    answer: "The TRACE Elixir Discovery Set includes all four expressions in 4 × 5 ml spray flacons (30% concentration) in a rigid keepsake box, complete with tactile story cards."
  },
  {
    id: "faq-4",
    category: "care",
    question: "How should I apply a 30% Elixir?",
    answer: "Because of the high oil concentration, 1 to 2 sprays on pulse points (neck, collarbones, wrists) are sufficient to project all day. Spraying directly onto fabric or coat collars delivers multi-day endurance."
  },
  {
    id: "faq-5",
    category: "care",
    question: "How should I store my Elixir?",
    answer: "Store your TRACE bottles upright in a cool, dark environment away from direct heat and direct sunlight to protect the fragile raw botanicals and natural essential oils."
  },
  {
    id: "faq-6",
    category: "ordering",
    question: "What is your shipping policy?",
    answer: "We offer express shipping across India. Orders are dispatched within 24 to 48 business hours. Delivery takes 2–4 business days for metro areas. Complimentary shipping is provided on orders over ₹1,500."
  },
  {
    id: "faq-7",
    category: "ordering",
    question: "What is your return policy?",
    answer: "Due to cosmetic safety regulations, cosmetic fragrances and the Discovery Set are final sale. Any damaged or defective items during transit will be replaced immediately upon notification."
  },
  {
    id: "faq-8",
    category: "ordering",
    question: "How can I contact TRACE?",
    answer: "Reach our concierge team at concierge@tracefragrances.com or direct message our Instagram page @trace.fragrance."
  }
];

export interface PressReview {
  id: string;
  source: string;
  quote: string;
  author: string;
  location: string;
  verifiedSample: boolean;
}

export const PRESS_REVIEWS: PressReview[] = [
  {
    id: "rev-1",
    source: "Haute Parfumerie Review",
    quote: "A true 30% Extrait at this price point is unprecedented. 01 Drift was still projecting effortlessly 20 hours after morning application.",
    author: "Aarav M.",
    location: "Mumbai",
    verifiedSample: true
  },
  {
    id: "rev-2",
    source: "Niche Scent Society",
    quote: "The oil density in 04 Vesper leaves an extraordinary sheen on the skin. The vanilla and incense stay intact from sunset to the next sunrise.",
    author: "Zoya K.",
    location: "New Delhi",
    verifiedSample: true
  },
  {
    id: "rev-3",
    source: "Design & Craft Journal",
    quote: "TRACE brings an uncompromising standard of concentration and typography. This is how modern luxury direct-to-consumer should feel.",
    author: "Devang P.",
    location: "Bengaluru",
    verifiedSample: true
  }
];

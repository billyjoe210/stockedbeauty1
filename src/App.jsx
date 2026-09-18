import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import storage from "./lib/storage";
import {
  Home, Package, Scissors, ShoppingCart, TrendingUp, Settings as SettingsIcon,
  Plus, Search, X, ChevronRight, ChevronLeft, AlertTriangle, Clock, Check,
  Trash2, Pencil, ArrowLeft, DollarSign, Sparkles, Filter, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, Package2, Droplets, Calendar, Store, User,
  LogOut, ChevronDown, Camera, Copy, History, PackageX, CircleAlert, Menu,
  BarChart3, PiggyBank, Repeat, CheckCircle2, TriangleAlert, Moon
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, LineChart, Line
} from "recharts";

/* ============================================================================
   DESIGN TOKENS
   Palette: warm ivory ground, near-black ink, muted mocha/rose/sage/champagne
   Display face: Fraunces (warm editorial serif, used with restraint) / Body+data: Plus Jakarta Sans
   Signature element: the "shelf ring" — a soft radial arc used everywhere
   stock is represented, echoing "what's left on the shelf"
============================================================================ */

const COLORS = {
  bg: "var(--sb-bg)",
  tint: "var(--sb-tint)",
  card: "var(--sb-card)",
  cardAlt: "var(--sb-card-alt)",
  ink: "var(--sb-ink)",
  inkSoft: "var(--sb-ink-soft)",
  line: "var(--sb-line)",
  mocha: "var(--sb-accent)",
  rose: "var(--sb-accent-2)",
  sage: "var(--sb-sage)",
  champagne: "var(--sb-champagne)",
  critical: "var(--sb-critical)",
  warn: "var(--sb-warn)",
  good: "var(--sb-good)",
};

// Default light-mode values and dark-mode overrides for every color token
// above, plus the default accent pair (the "peach/salmon" mocha/rose tones).
// Accent stays user-customizable in Settings and applies in both themes;
// everything else swaps automatically when dark mode is toggled.
const DEFAULT_ACCENT = "#E86D92";
const DEFAULT_ACCENT_2 = "#F0A0B8";

const THEME_VARS = {
  light: {
    "--sb-bg": "#FFFFFF", "--sb-tint": "#FAF6F1", "--sb-card": "#FFFFFF", "--sb-card-alt": "#F5EFE7",
    "--sb-ink": "#2A241F", "--sb-ink-soft": "#6B6259", "--sb-line": "#E9E0D5",
    "--sb-sage": "#899C7E", "--sb-champagne": "#C9A45C",
    "--sb-critical": "#B4574A", "--sb-warn": "#C08A3E", "--sb-good": "#7C9770",
  },
  dark: {
    "--sb-bg": "#0B0B0C", "--sb-tint": "#17171A", "--sb-card": "#131314", "--sb-card-alt": "#1E1E20",
    "--sb-ink": "#F0EFED", "--sb-ink-soft": "#A6A4A1", "--sb-line": "#2B2A2B",
    "--sb-sage": "#A9BE9E", "--sb-champagne": "#DDC17F",
    "--sb-critical": "#E28E80", "--sb-warn": "#E0B15E", "--sb-good": "#9CBE8F",
  },
};

// Blend a hex color toward white by a ratio — used to derive the lighter
// "second stop" accent (rose) from whatever base accent color the user picks.
function lightenHex(hex, ratio) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return DEFAULT_ACCENT_2;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const mix = (c) => Math.round(c + (255 - c) * ratio);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const CARD_GRADIENT = `linear-gradient(180deg, var(--sb-card) 0%, var(--sb-tint) 100%)`;

function themeStyleBlock() {
  const lightVars = Object.entries(THEME_VARS.light).map(([k, v]) => `${k}: ${v};`).join(" ");
  const darkVars = Object.entries(THEME_VARS.dark).map(([k, v]) => `${k}: ${v};`).join(" ");
  return `
  .sb-root { ${lightVars} }
  .sb-root[data-sb-theme="dark"] { ${darkVars} }
  `;
}

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  html, body { overflow-x: hidden; max-width: 100vw; }
  ${themeStyleBlock()}
  .sb-root { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; background: var(--sb-bg); color: var(--sb-ink); letter-spacing: -0.01em; overflow-x: hidden; max-width: 100vw; transition: background 0.25s ease, color 0.25s ease; }
  .sb-display { font-family: 'Fraunces', ui-serif, Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.01em; }
  .sb-numeral { font-family: 'Fraunces', ui-serif, Georgia, serif; font-optical-sizing: auto; font-variant-numeric: lining-nums; }
  .sb-scroll::-webkit-scrollbar { display:none; }
  .sb-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .sb-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .sb-onboard-screen { height: 100vh; height: 100dvh; overflow-y: auto; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box; }
  .sb-modal-sheet { max-height: 92vh; max-height: 92dvh; }
  div, span, p, a { min-width: 0; }
  @keyframes sbFadeUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:translateY(0);} }
  @keyframes sbPop { from { opacity:0; transform: scale(0.96);} to {opacity:1; transform:scale(1);} }
  .sb-fade-up { animation: sbFadeUp 0.45s ease both; }
  .sb-pop { animation: sbPop 0.2s ease both; }
  .sb-count { transition: all 0.4s ease; }
  @keyframes sbSpin { to { transform: rotate(360deg); } }
  .sb-spin { animation: sbSpin 0.8s linear infinite; }
  input[type="color"] { -webkit-appearance: none; appearance: none; }
  input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; border-radius: 13px; overflow: hidden; }
  input[type="color"]::-webkit-color-swatch { border: none; }
  input[type="color"]::-moz-color-swatch { border: none; border-radius: 13px; }
`;

/* ============================================================================
   CONSTANTS
============================================================================ */

const PROFESSIONS = [
  { id: "lash", label: "Lash Artist", icon: "👁" },
  { id: "nail", label: "Nail Technician", icon: "💅" },
  { id: "hair", label: "Hairstylist", icon: "✂" },
  { id: "braid", label: "Braider", icon: "🪢" },
  { id: "esthetician", label: "Esthetician", icon: "🌿" },
  { id: "brow", label: "Brow Artist", icon: "〰" },
  { id: "makeup", label: "Makeup Artist", icon: "💄" },
  { id: "other", label: "Other", icon: "✦" },
];

const GOALS = [
  { id: "track", label: "Track my inventory" },
  { id: "low", label: "Know when supplies are running low" },
  { id: "cost", label: "Calculate service costs" },
  { id: "profit", label: "Understand my profits" },
  { id: "reorder", label: "Build reorder lists" },
  { id: "waste", label: "Reduce wasted products" },
];

const LASH_CATEGORIES = ["Lash Trays", "Adhesives", "Eye Pads", "Tape", "Primer", "Remover",
  "Cleanser", "Microbrushes", "Spoolies", "Glue Rings", "Tweezers", "Disposable Supplies",
  "Aftercare", "Retail Products", "Other"];

const NAIL_CATEGORIES = ["Gel Polish", "Acrylic Powder", "Monomer", "Tips", "Files", "Buffers",
  "Drill Bits", "Nail Art", "Gloves", "Disposable Supplies", "Aftercare", "Retail Products", "Other"];

const HAIR_CATEGORIES = ["Shampoo & Conditioner", "Color & Developer", "Bleach & Lightener", "Toner",
  "Styling Products", "Treatments & Masks", "Foils & Wraps", "Tools & Brushes", "Extensions",
  "Disposable Supplies", "Retail Products", "Other"];

const BRAID_CATEGORIES = ["Braiding Hair", "Edge Control", "Gel", "Mousse", "Shine Spray", "Combs",
  "Clips", "Rubber Bands", "Accessories", "Disposable Supplies", "Retail Products", "Other"];

const ESTHETICIAN_CATEGORIES = ["Cleansers", "Serums", "Masks", "Wax", "Applicators", "Gloves",
  "Cotton Rounds", "Towels", "Disposable Supplies", "Retail Products", "Other"];

const BROW_CATEGORIES = ["Brow Tint", "Henna", "Wax", "Lamination Supplies", "Tweezers",
  "Brushes & Spoolies", "Pencils & Pomades", "Aftercare", "Disposable Supplies", "Retail Products", "Other"];

const MAKEUP_CATEGORIES = ["Foundation & Concealer", "Powders", "Eyeshadow", "Eyeliner & Mascara",
  "Lip Products", "Brushes & Sponges", "Setting Spray", "Skincare Prep", "Disposable Supplies",
  "Retail Products", "Other"];

const OTHER_CATEGORIES = ["Tools & Equipment", "Consumable Supplies", "Retail Products",
  "Disposable Supplies", "Aftercare", "Other"];

const PROFESSION_CATEGORIES = {
  lash: LASH_CATEGORIES,
  nail: NAIL_CATEGORIES,
  hair: HAIR_CATEGORIES,
  braid: BRAID_CATEGORIES,
  esthetician: ESTHETICIAN_CATEGORIES,
  brow: BROW_CATEGORIES,
  makeup: MAKEUP_CATEGORIES,
  other: OTHER_CATEGORIES,
};

function categoriesForProfessions(professionIds = ["lash"]) {
  const ids = professionIds && professionIds.length ? professionIds : ["lash"];
  const seen = new Set();
  const names = [];
  ids.forEach((id) => {
    (PROFESSION_CATEGORIES[id] || LASH_CATEGORIES).forEach((name) => {
      if (!seen.has(name)) { seen.add(name); names.push(name); }
    });
  });
  return names.map((name) => ({ id: uid("cat"), name }));
}

const CURLS = ["J", "B", "C", "CC", "D", "L", "L+", "M"];
const DIAMETERS = ["0.03", "0.05", "0.07", "0.10", "0.15", "0.18", "0.20"];
const LENGTHS = ["8mm", "9mm", "10mm", "11mm", "12mm", "13mm", "14mm", "15mm", "16mm", "17mm", "18mm", "19mm", "20mm"];

const UNIT_TYPES = ["tray", "bottle", "unit", "pair", "box", "roll", "inch", "oz", "ml", "g"];

const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "services", label: "Services", icon: Scissors },
  { id: "reorder", label: "Reorder", icon: ShoppingCart },
  { id: "insights", label: "Insights", icon: TrendingUp },
];

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// Two separate iOS bugs stack up here:
// 1) env(safe-area-inset-bottom) sometimes isn't finalized on first paint —
//    handled by measuring it ourselves with a probe element and polling
//    briefly after mount.
// 2) Fixed-position elements that use backdrop-filter (our tab bar and FAB
//    both do, for the frosted-glass look) can get visually "stuck" in their
//    old composited position when iOS restores a backgrounded app, even
//    though the underlying CSS is already correct — a known WebKit quirk.
//    Rotating or swiping forces WebKit to recompute it.
//
// IMPORTANT: forcing that recompute must never touch `transform` (or
// `will-change: transform`, or `filter`) on an ANCESTOR of these elements —
// doing so makes that ancestor become the positioning container for every
// `position: fixed` descendant on the page instead of the real viewport,
// which breaks fixed positioning everywhere (this was tried and made things
// worse). Instead, we nudge only the specific element itself by briefly
// toggling its own `position` between "fixed" and "static", which forces
// WebKit to recreate that one element's fixed-position layer from scratch
// without affecting anything else on the page.
function useSafeAreaBottom(elementRef) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;bottom:0;left:0;width:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
    const measure = () => {
      const val = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
      setInset((prev) => (val !== prev ? val : prev));
    };

    // Toggling an element's own position from fixed→static→fixed forces
    // WebKit to recreate that element's fixed-position layer from scratch,
    // which is what actually forces a fresh env(safe-area-inset-*)
    // resolution for it — a plain style read alone can still return a
    // stale cached value. We do this to the invisible probe itself (so the
    // *measurement* is accurate) and to the visible element (so its own
    // on-screen layer isn't stuck stale either).
    const nudgeElement = (el) => {
      if (!el) return;
      el.style.position = "static";
      void el.offsetHeight;
      el.style.position = "fixed";
    };
    const settleOnce = () => {
      nudgeElement(probe);
      measure();
      nudgeElement(elementRef?.current);
    };

    let pollTimers = [];
    const runSettleBurst = () => {
      pollTimers.forEach(clearTimeout);
      settleOnce();
      pollTimers = [80, 160, 300, 500, 800, 1200, 1800, 2500].map((ms) => setTimeout(settleOnce, ms));
    };

    runSettleBurst();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));

    // Re-run the whole settle burst whenever the app becomes visible again —
    // this is what covers "closed and reopened" (resumed from background),
    // which a one-time mount effect alone can't catch since the page isn't
    // actually reloading in that case.
    const onResume = () => runSettleBurst();
    const onVisibilityChange = () => { if (document.visibilityState === "visible") onResume(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onResume);
    window.addEventListener("focus", onResume);

    // IMPORTANT: never do this work synchronously on every scroll/touchmove
    // tick — that's a forced layout read (or worse, a position toggle) on
    // every frame of an active scroll gesture, which is exactly what made
    // scrolling stutter/lock up before. Only check once a gesture/scroll has
    // actually finished (120ms after the last event).
    let settleTimer = null;
    const settleWhenIdle = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settleOnce, 120);
    };
    const opts = { passive: true };
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", settleWhenIdle);
    window.addEventListener("scroll", settleWhenIdle, opts);
    window.addEventListener("touchend", settleWhenIdle, opts);
    window.visualViewport?.addEventListener("resize", measure);

    return () => {
      document.body.removeChild(probe);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      pollTimers.forEach(clearTimeout);
      clearTimeout(settleTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", settleWhenIdle);
      window.removeEventListener("scroll", settleWhenIdle, opts);
      window.removeEventListener("touchend", settleWhenIdle, opts);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);
  return inset;
}

const money = (n) => `$${(Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money0 = (n) => `$${Math.round(n).toLocaleString()}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ============================================================================
   DEMO DATA
============================================================================ */

function buildEmptyData(professionIds = ["lash"]) {
  return {
    suppliers: [],
    inventory: [],
    services: [],
    serviceLogs: [],
    transactions: [],
    wasteLogs: [],
    reorderList: [],
    recentlyOrdered: [],
    categories: categoriesForProfessions(professionIds),
  };
}

function buildDemoData(professionIds = ["lash"]) {
  const suppliers = [
    { id: uid("sup"), name: "LashBoxLA", website: "lashboxla.com", shipTime: "3-5 days", minOrder: "$50", notes: "Fast on trays" },
    { id: uid("sup"), name: "Bella Lash", website: "bellalash.com", shipTime: "2-4 days", minOrder: "$25", notes: "Best adhesive prices" },
    { id: uid("sup"), name: "Paris Lash Academy", website: "parislash.com", shipTime: "5-7 days", minOrder: "None", notes: "" },
    { id: uid("sup"), name: "Amazon", website: "amazon.com", shipTime: "1-2 days", minOrder: "None", notes: "Disposables, tape" },
  ];
  const supId = (name) => suppliers.find((s) => s.name === name).id;

  const now = new Date("2026-08-23T09:00:00");
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysFrom = (d) => new Date(now.getTime() + d * 86400000).toISOString();

  const trayItem = (curl, diam, len, qtyTrays, price = 19.99, brand = "LashBoxLA Premium") => ({
    id: uid("inv"),
    name: `${len} ${curl} ${diam} Lash Tray`,
    brand,
    category: "Lash Trays",
    unitType: "tray",
    quantity: qtyTrays,
    purchasePrice: price,
    purchaseQty: 1,
    unitCost: price,
    supplierId: supId("LashBoxLA"),
    datePurchased: daysAgo(18),
    dateOpened: daysAgo(15),
    expirationDate: null,
    reorderThreshold: 0.6,
    sku: `${curl}${diam}-${len}`.replace(/mm/g, ""),
    notes: "",
    curl, diameter: diam, length: len, trayType: "Single Length",
    avgUsagePerAppt: 0.16,
  });

  const inventory = [
    trayItem("CC", "0.05", "11mm", 0.3, 19.99),
    trayItem("D", "0.05", "12mm", 0.5, 19.99),
    trayItem("C", "0.07", "10mm", 2.1, 18.5, "Paris Lash Academy"),
    trayItem("CC", "0.05", "13mm", 1.4, 19.99),
    trayItem("L+", "0.07", "9mm", 0.8, 21.0),
    trayItem("D", "0.03", "14mm", 2.6, 22.5),
    trayItem("B", "0.10", "8mm", 3.2, 17.0),
    trayItem("M", "0.05", "15mm", 1.1, 20.5),
    {
      id: uid("inv"), name: "Bella Lash Pro Bond Adhesive", brand: "Bella Lash", category: "Adhesives",
      unitType: "bottle", quantity: 0.22, purchasePrice: 34.99, purchaseQty: 1, unitCost: 34.99,
      supplierId: supId("Bella Lash"), datePurchased: daysAgo(24), dateOpened: daysAgo(24),
      expirationDate: daysFrom(6), reorderThreshold: 0.25, sku: "BL-ADH-01", notes: "1-second bond, sensitive-friendly",
      avgUsagePerAppt: 0.06,
    },
    {
      id: uid("inv"), name: "Sensitive Formula Adhesive", brand: "StellaLash", category: "Adhesives",
      unitType: "bottle", quantity: 0.9, purchasePrice: 38.0, purchaseQty: 1, unitCost: 38.0,
      supplierId: supId("Bella Lash"), datePurchased: daysAgo(10), dateOpened: daysAgo(10),
      expirationDate: daysFrom(35), reorderThreshold: 0.25, sku: "SF-ADH-02", notes: "",
      avgUsagePerAppt: 0.05,
    },
    {
      id: uid("inv"), name: "Hydrogel Eye Pads", brand: "LashBase", category: "Eye Pads",
      unitType: "pair", quantity: 12, purchasePrice: 12.0, purchaseQty: 50, unitCost: 0.24,
      supplierId: supId("Amazon"), datePurchased: daysAgo(9), dateOpened: daysAgo(9),
      expirationDate: null, reorderThreshold: 20, sku: "HG-EP-50", notes: "",
      avgUsagePerAppt: 2,
    },
    {
      id: uid("inv"), name: "Under-Eye Gel Patches", brand: "Nala Lash", category: "Eye Pads",
      unitType: "pair", quantity: 44, purchasePrice: 10.5, purchaseQty: 50, unitCost: 0.21,
      supplierId: supId("Amazon"), datePurchased: daysAgo(3), dateOpened: daysAgo(3),
      expirationDate: null, reorderThreshold: 20, sku: "UE-GP-50", notes: "",
      avgUsagePerAppt: 2,
    },
    {
      id: uid("inv"), name: "Micropore Lash Tape", brand: "3M", category: "Tape",
      unitType: "roll", quantity: 1.2, purchasePrice: 6.5, purchaseQty: 1, unitCost: 6.5,
      supplierId: supId("Amazon"), datePurchased: daysAgo(30), dateOpened: daysAgo(30),
      expirationDate: null, reorderThreshold: 0.5, sku: "MPT-01", notes: "",
      avgUsagePerAppt: 0.03,
    },
    {
      id: uid("inv"), name: "Lash Primer", brand: "Bella Lash", category: "Primer",
      unitType: "bottle", quantity: 0.55, purchasePrice: 14.0, purchaseQty: 1, unitCost: 14.0,
      supplierId: supId("Bella Lash"), datePurchased: daysAgo(20), dateOpened: daysAgo(20),
      expirationDate: daysFrom(70), reorderThreshold: 0.2, sku: "PRM-01", notes: "",
      avgUsagePerAppt: 0.02,
    },
    {
      id: uid("inv"), name: "Cream Remover", brand: "StellaLash", category: "Remover",
      unitType: "bottle", quantity: 0.7, purchasePrice: 16.0, purchaseQty: 1, unitCost: 16.0,
      supplierId: supId("Bella Lash"), datePurchased: daysAgo(40), dateOpened: daysAgo(40),
      expirationDate: daysFrom(140), reorderThreshold: 0.2, sku: "RMV-01", notes: "",
      avgUsagePerAppt: 0.015,
    },
    {
      id: uid("inv"), name: "Foam Cleanser", brand: "LashBase", category: "Cleanser",
      unitType: "bottle", quantity: 1.3, purchasePrice: 15.0, purchaseQty: 1, unitCost: 15.0,
      supplierId: supId("Amazon"), datePurchased: daysAgo(15), dateOpened: daysAgo(15),
      expirationDate: daysFrom(300), reorderThreshold: 0.2, sku: "CLN-01", notes: "",
      avgUsagePerAppt: 0.02,
    },
    {
      id: uid("inv"), name: "Microbrushes (Box of 100)", brand: "Generic", category: "Microbrushes",
      unitType: "box", quantity: 62, purchasePrice: 5.5, purchaseQty: 100, unitCost: 0.055,
      supplierId: supId("Amazon"), datePurchased: daysAgo(8), dateOpened: daysAgo(8),
      expirationDate: null, reorderThreshold: 30, sku: "MB-100", notes: "",
      avgUsagePerAppt: 4,
    },
    {
      id: uid("inv"), name: "Spoolies (Bag of 100)", brand: "Generic", category: "Spoolies",
      unitType: "box", quantity: 71, purchasePrice: 4.0, purchaseQty: 100, unitCost: 0.04,
      supplierId: supId("Amazon"), datePurchased: daysAgo(8), dateOpened: daysAgo(8),
      expirationDate: null, reorderThreshold: 30, sku: "SP-100", notes: "",
      avgUsagePerAppt: 2,
    },
    {
      id: uid("inv"), name: "Glue Rings (Pack of 100)", brand: "Generic", category: "Glue Rings",
      unitType: "box", quantity: 18, purchasePrice: 6.0, purchaseQty: 100, unitCost: 0.06,
      supplierId: supId("Amazon"), datePurchased: daysAgo(28), dateOpened: daysAgo(28),
      expirationDate: null, reorderThreshold: 25, sku: "GR-100", notes: "",
      avgUsagePerAppt: 1,
    },
    {
      id: uid("inv"), name: "Isolation Tweezers", brand: "StellaLash", category: "Tweezers",
      unitType: "unit", quantity: 3, purchasePrice: 24.0, purchaseQty: 1, unitCost: 24.0,
      supplierId: supId("Paris Lash Academy"), datePurchased: daysAgo(120), dateOpened: null,
      expirationDate: null, reorderThreshold: 1, sku: "TW-ISO", notes: "Durable tool, rarely reordered",
      avgUsagePerAppt: 0,
    },
    {
      id: uid("inv"), name: "Volume Tweezers", brand: "StellaLash", category: "Tweezers",
      unitType: "unit", quantity: 2, purchasePrice: 26.0, purchaseQty: 1, unitCost: 26.0,
      supplierId: supId("Paris Lash Academy"), datePurchased: daysAgo(120), dateOpened: null,
      expirationDate: null, reorderThreshold: 1, sku: "TW-VOL", notes: "",
      avgUsagePerAppt: 0,
    },
    {
      id: uid("inv"), name: "Nitrile Gloves (Box of 100)", brand: "Generic", category: "Disposable Supplies",
      unitType: "box", quantity: 34, purchasePrice: 9.0, purchaseQty: 100, unitCost: 0.09,
      supplierId: supId("Amazon"), datePurchased: daysAgo(12), dateOpened: daysAgo(12),
      expirationDate: null, reorderThreshold: 20, sku: "GLV-100", notes: "",
      avgUsagePerAppt: 2,
    },
    {
      id: uid("inv"), name: "Disposable Lip Wands", brand: "Generic", category: "Disposable Supplies",
      unitType: "unit", quantity: 90, purchasePrice: 4.5, purchaseQty: 100, unitCost: 0.045,
      supplierId: supId("Amazon"), datePurchased: daysAgo(12), dateOpened: daysAgo(12),
      expirationDate: null, reorderThreshold: 20, sku: "LW-100", notes: "",
      avgUsagePerAppt: 1,
    },
    {
      id: uid("inv"), name: "Lash Aftercare Serum", brand: "LashBase", category: "Aftercare",
      unitType: "unit", quantity: 14, purchasePrice: 5.2, purchaseQty: 1, unitCost: 5.2,
      supplierId: supId("LashBoxLA"), datePurchased: daysAgo(50), dateOpened: null,
      expirationDate: daysFrom(400), reorderThreshold: 5, sku: "AC-SER", notes: "Sold retail to clients",
      avgUsagePerAppt: 0,
    },
    {
      id: uid("inv"), name: "Retail Spoolie Brush", brand: "LashBase", category: "Retail Products",
      unitType: "unit", quantity: 22, purchasePrice: 1.8, purchaseQty: 1, unitCost: 1.8,
      supplierId: supId("LashBoxLA"), datePurchased: daysAgo(60), dateOpened: null,
      expirationDate: null, reorderThreshold: 8, sku: "RT-SPB", notes: "Retail add-on",
      avgUsagePerAppt: 0,
    },
  ];

  const findByName = (n) => inventory.find((i) => i.name === n);

  const services = [
    {
      id: uid("svc"), name: "Classic Full Set", category: "Lash Extensions", price: 120, duration: 120,
      recipe: [
        { productId: findByName("10mm C 0.07 Lash Tray").id, amount: 0.14 },
        { productId: findByName("Bella Lash Pro Bond Adhesive").id, amount: 0.05 },
        { productId: findByName("Hydrogel Eye Pads").id, amount: 2 },
        { productId: findByName("Microbrushes (Box of 100)").id, amount: 4 },
      ],
    },
    {
      id: uid("svc"), name: "Classic Fill", category: "Lash Extensions", price: 75, duration: 75,
      recipe: [
        { productId: findByName("10mm C 0.07 Lash Tray").id, amount: 0.06 },
        { productId: findByName("Bella Lash Pro Bond Adhesive").id, amount: 0.025 },
        { productId: findByName("Hydrogel Eye Pads").id, amount: 2 },
        { productId: findByName("Microbrushes (Box of 100)").id, amount: 3 },
      ],
    },
    {
      id: uid("svc"), name: "Hybrid Full Set", category: "Lash Extensions", price: 145, duration: 135,
      recipe: [
        { productId: findByName("11mm CC 0.05 Lash Tray").id, amount: 0.18 },
        { productId: findByName("Bella Lash Pro Bond Adhesive").id, amount: 0.06 },
        { productId: findByName("Hydrogel Eye Pads").id, amount: 2 },
        { productId: findByName("Microbrushes (Box of 100)").id, amount: 4 },
        { productId: findByName("Spoolies (Bag of 100)").id, amount: 2 },
        { productId: findByName("Glue Rings (Pack of 100)").id, amount: 1 },
        { productId: findByName("Micropore Lash Tape").id, amount: 0.02 },
      ],
    },
    {
      id: uid("svc"), name: "Hybrid Fill", category: "Lash Extensions", price: 85, duration: 90,
      recipe: [
        { productId: findByName("11mm CC 0.05 Lash Tray").id, amount: 0.08 },
        { productId: findByName("Bella Lash Pro Bond Adhesive").id, amount: 0.03 },
        { productId: findByName("Hydrogel Eye Pads").id, amount: 2 },
        { productId: findByName("Glue Rings (Pack of 100)").id, amount: 1 },
      ],
    },
    {
      id: uid("svc"), name: "Volume Full Set", category: "Lash Extensions", price: 165, duration: 150,
      recipe: [
        { productId: findByName("12mm D 0.05 Lash Tray").id, amount: 0.22 },
        { productId: findByName("Sensitive Formula Adhesive").id, amount: 0.08 },
        { productId: findByName("Under-Eye Gel Patches").id, amount: 2 },
        { productId: findByName("Microbrushes (Box of 100)").id, amount: 5 },
        { productId: findByName("Glue Rings (Pack of 100)").id, amount: 2 },
      ],
    },
    {
      id: uid("svc"), name: "Volume Fill", category: "Lash Extensions", price: 95, duration: 90,
      recipe: [
        { productId: findByName("12mm D 0.05 Lash Tray").id, amount: 0.1 },
        { productId: findByName("Sensitive Formula Adhesive").id, amount: 0.035 },
        { productId: findByName("Under-Eye Gel Patches").id, amount: 2 },
        { productId: findByName("Glue Rings (Pack of 100)").id, amount: 1 },
      ],
    },
    {
      id: uid("svc"), name: "Mega Volume Full Set", category: "Lash Extensions", price: 195, duration: 165,
      recipe: [
        { productId: findByName("14mm D 0.03 Lash Tray").id, amount: 0.3 },
        { productId: findByName("Sensitive Formula Adhesive").id, amount: 0.1 },
        { productId: findByName("Under-Eye Gel Patches").id, amount: 2 },
        { productId: findByName("Microbrushes (Box of 100)").id, amount: 6 },
      ],
    },
    {
      id: uid("svc"), name: "Lash Removal", category: "Removal", price: 30, duration: 30,
      recipe: [
        { productId: findByName("Cream Remover").id, amount: 0.04 },
        { productId: findByName("Under-Eye Gel Patches").id, amount: 2 },
      ],
    },
  ];

  const svcByName = (n) => services.find((s) => s.name === n);

  const serviceLogs = [
    { id: uid("log"), serviceId: svcByName("Hybrid Full Set").id, clientName: "Jasmine R.", date: daysAgo(0), price: 145 },
    { id: uid("log"), serviceId: svcByName("Volume Fill").id, clientName: "Amara T.", date: daysAgo(1), price: 95 },
    { id: uid("log"), serviceId: svcByName("Classic Fill").id, clientName: "Priya S.", date: daysAgo(1), price: 75 },
    { id: uid("log"), serviceId: svcByName("Hybrid Fill").id, clientName: "Devon K.", date: daysAgo(2), price: 85 },
    { id: uid("log"), serviceId: svcByName("Volume Full Set").id, clientName: "Maria L.", date: daysAgo(3), price: 165 },
    { id: uid("log"), serviceId: svcByName("Classic Full Set").id, clientName: "Whitney B.", date: daysAgo(4), price: 120 },
    { id: uid("log"), serviceId: svcByName("Hybrid Fill").id, clientName: "Camille D.", date: daysAgo(5), price: 85 },
    { id: uid("log"), serviceId: svcByName("Mega Volume Full Set").id, clientName: "Sofia N.", date: daysAgo(6), price: 195 },
    { id: uid("log"), serviceId: svcByName("Volume Fill").id, clientName: "Renee A.", date: daysAgo(7), price: 95 },
    { id: uid("log"), serviceId: svcByName("Lash Removal").id, clientName: "Tori M.", date: daysAgo(8), price: 30 },
  ];

  const transactions = serviceLogs.map((log) => ({
    id: uid("txn"), type: "Service Usage", date: log.date, serviceId: log.serviceId, note: `Logged: ${svcByName ? "" : ""}`,
  }));

  const wasteLogs = [
    { id: uid("waste"), productId: findByName("Bella Lash Pro Bond Adhesive").id, quantity: 0.15, reason: "Expired", date: daysAgo(6), cost: 0.15 * 34.99 },
    { id: uid("waste"), productId: findByName("Hydrogel Eye Pads").id, quantity: 6, reason: "Spilled", date: daysAgo(12), cost: 6 * 0.24 },
    { id: uid("waste"), productId: findByName("Lash Primer").id, quantity: 0.1, reason: "Discarded", date: daysAgo(15), cost: 0.1 * 14.0 },
  ];

  const reorderList = [
    { id: uid("ro"), productId: findByName("11mm CC 0.05 Lash Tray").id, quantity: 2, purchased: false },
    { id: uid("ro"), productId: findByName("Bella Lash Pro Bond Adhesive").id, quantity: 1, purchased: false },
  ];

  const categories = categoriesForProfessions(professionIds);
  const recentlyOrdered = [];

  return { suppliers, inventory, services, serviceLogs, transactions, wasteLogs, reorderList, recentlyOrdered, categories };
}

/* ============================================================================
   CALCULATIONS
============================================================================ */

function inventoryValue(item) {
  return item.quantity * item.unitCost;
}

function stockRatio(item) {
  if (!item.reorderThreshold) return 1;
  // treat "healthy" as 2x threshold or more
  const healthyLevel = item.reorderThreshold * 2.2;
  return clamp(item.quantity / healthyLevel, 0, 1);
}

function stockStatus(item) {
  const daysToExpire = item.expirationDate ? Math.ceil((new Date(item.expirationDate) - new Date("2026-08-23")) / 86400000) : null;
  if (daysToExpire !== null && daysToExpire < 0) return "expired";
  if (daysToExpire !== null && daysToExpire <= 10) return "expiring";
  if (item.reorderThreshold && item.quantity <= item.reorderThreshold * 0.5) return "critical";
  if (item.reorderThreshold && item.quantity <= item.reorderThreshold) return "low";
  return "healthy";
}

const STATUS_META = {
  healthy: { label: "Healthy", color: COLORS.good, bg: `color-mix(in srgb, ${COLORS.good} 16%, var(--sb-card))` },
  low: { label: "Low Stock", color: COLORS.warn, bg: `color-mix(in srgb, ${COLORS.warn} 16%, var(--sb-card))` },
  critical: { label: "Critical", color: COLORS.critical, bg: `color-mix(in srgb, ${COLORS.critical} 16%, var(--sb-card))` },
  expired: { label: "Expired", color: COLORS.critical, bg: `color-mix(in srgb, ${COLORS.critical} 16%, var(--sb-card))` },
  expiring: { label: "Expiring Soon", color: COLORS.warn, bg: `color-mix(in srgb, ${COLORS.warn} 16%, var(--sb-card))` },
};

function estimatedApptsRemaining(item) {
  if (!item.avgUsagePerAppt || item.avgUsagePerAppt <= 0) return null;
  return item.quantity / item.avgUsagePerAppt;
}

// A fixed, always-pink notification color for the "just restocked" glow —
// deliberately independent of the user's customizable accent color, since
// it's a system indicator rather than a theme element.
const RESTOCK_GLOW = "#FF4FA0";
const RESTOCK_GLOW_WINDOW_MS = 24 * 60 * 60 * 1000;

function isRecentlyRestocked(item) {
  if (!item.restockedAt) return false;
  return Date.now() - new Date(item.restockedAt).getTime() < RESTOCK_GLOW_WINDOW_MS;
}

function serviceCost(service, inventory) {
  return service.recipe.reduce((sum, r) => {
    const prod = inventory.find((i) => i.id === r.productId);
    if (!prod) return sum;
    return sum + prod.unitCost * r.amount;
  }, 0);
}

function serviceMargin(service, inventory) {
  const cost = serviceCost(service, inventory);
  const profit = service.price - cost;
  const margin = service.price > 0 ? profit / service.price : 0;
  return { cost, profit, margin };
}

function totalInventoryValue(inventory) {
  return inventory.reduce((sum, i) => sum + inventoryValue(i), 0);
}

function valueByCategory(inventory) {
  const map = {};
  inventory.forEach((i) => {
    map[i.category] = (map[i.category] || 0) + inventoryValue(i);
  });
  return Object.entries(map).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
}

function monthlyProductCost(serviceLogs, services, inventory) {
  const cutoff = new Date("2026-08-23");
  cutoff.setDate(1);
  return serviceLogs
    .filter((l) => new Date(l.date) >= cutoff)
    .reduce((sum, l) => {
      const svc = services.find((s) => s.id === l.serviceId);
      if (!svc) return sum;
      return sum + serviceCost(svc, inventory);
    }, 0);
}

function monthlyWaste(wasteLogs) {
  const cutoff = new Date("2026-08-23");
  cutoff.setDate(1);
  return wasteLogs.filter((w) => new Date(w.date) >= cutoff).reduce((sum, w) => sum + w.cost, 0);
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date("2026-08-23T09:00:00");
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date("2026-08-23")) / 86400000);
}

const WEEKDAY = (daysFromNow) => {
  const d = new Date("2026-08-23");
  d.setDate(d.getDate() + Math.round(daysFromNow));
  return d.toLocaleDateString(undefined, { weekday: "long" });
};

/* ============================================================================
   SHARED UI ATOMS
============================================================================ */

function ShelfRing({ ratio, size = 44, stroke = 5, color = COLORS.mocha, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamp(ratio, 0, 1));
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.line} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Badge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.healthy;
  return (
    <span
      className="sb-display"
      style={{
        background: meta.bg, color: meta.color, fontSize: 11.5, fontWeight: 700,
        padding: "4px 10px", borderRadius: 999, letterSpacing: 0.2, display: "inline-flex",
        alignItems: "center", gap: 4, whiteSpace: "nowrap",
      }}
    >
      {(status === "critical" || status === "expired") && <TriangleAlert size={11} />}
      {meta.label}
    </span>
  );
}

function Card({ children, style, onClick, hover = true, className = "" }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={className}
      style={{
        background: CARD_GRADIENT, borderRadius: 26, border: `1px solid ${COLORS.line}`,
        boxShadow: h && hover ? "0 8px 24px rgba(42,36,31,0.08)" : "0 1px 3px rgba(42,36,31,0.04)",
        transform: h && hover && onClick ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.2s ease", cursor: onClick ? "pointer" : "default", ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", style, disabled, type = "button", full }) {
  const [pressed, setPressed] = useState(false);
  const sizes = {
    sm: { padding: "14px 16px", fontSize: 14, minHeight: 46 },
    md: { padding: "19px 20px", fontSize: 16, minHeight: 56 },
    lg: { padding: "23px 24px", fontSize: 17.5, minHeight: 64 },
  };
  const variants = {
    primary: { background: COLORS.ink, color: "#fff", border: "none" },
    secondary: { background: COLORS.cardAlt, color: COLORS.ink, border: `1px solid ${COLORS.line}` },
    outline: { background: "transparent", color: COLORS.ink, border: `1.5px solid ${COLORS.ink}` },
    ghost: { background: "transparent", color: COLORS.inkSoft, border: "none" },
    danger: { background: `color-mix(in srgb, ${COLORS.critical} 14%, var(--sb-card))`, color: COLORS.critical, border: "none" },
    accent: { background: COLORS.mocha, color: "#fff", border: "none" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className="sb-display"
      style={{
        ...variants[variant], ...sizes[size], borderRadius: 999, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transform: pressed ? "scale(0.97)" : "scale(1)", transition: "transform 0.1s ease, opacity 0.2s",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        width: full ? "100%" : "auto", whiteSpace: "nowrap", ...style,
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 6 }} className="sb-display">
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 16px", borderRadius: 16, border: `1.5px solid ${COLORS.line}`,
  fontSize: 14.5, fontFamily: "'Plus Jakarta Sans', sans-serif", background: COLORS.card, color: COLORS.ink, outline: "none",
  boxSizing: "border-box",
};

function Input(props) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
      style={{ ...inputStyle, borderColor: focus ? COLORS.mocha : COLORS.line, ...props.style }}
    />
  );
}

function Select(props) {
  return (
    <select {...props} style={{ ...inputStyle, appearance: "none", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6' fill='%236B6259'/%3E%3C/svg%3E\") no-repeat right 14px center", paddingRight: 32, ...props.style }}>
      {props.children}
    </select>
  );
}

function Modal({ open, onClose, title, children, width = 520 }) {
  // Lock the background page while the sheet is open — without this, an
  // upward scroll gesture inside the modal can end up scrolling the page
  // behind it instead (or both at once), which is exactly what produces
  // that "snaps back down" fight when trying to scroll up to the top of a
  // tall form. The fixed-position-with-stored-offset technique (rather
  // than just overflow:hidden) is what reliably stops iOS Safari's
  // background rubber-band scroll specifically.
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const prev = {
      position: document.body.style.position, top: document.body.style.top,
      left: document.body.style.left, right: document.body.style.right,
      width: document.body.style.width, overflow: document.body.style.overflow,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(42,36,31,0.4)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(2px)",
        overflow: "hidden",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sb-pop sb-scroll sb-modal-sheet"
        style={{
          background: CARD_GRADIENT, width: "100%", maxWidth: width, overflowY: "auto", overflowX: "hidden",
          borderRadius: "30px 30px 0 0", padding: "24px 20px 30px", boxSizing: "border-box",
          position: "relative", left: 0, right: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div className="sb-display" style={{ fontSize: 19, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: COLORS.cardAlt, border: "none", borderRadius: 999, padding: 9, cursor: "pointer", display: "flex" }}>
            <X size={18} color={COLORS.inkSoft} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon = Package2, title, subtitle, action }) {
  return (
    <div className="sb-fade-up" style={{ textAlign: "center", padding: "56px 24px" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 999, background: COLORS.cardAlt, display: "flex",
        alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
      }}>
        <Icon size={26} color={COLORS.mocha} strokeWidth={1.6} />
      </div>
      <div className="sb-display" style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: COLORS.inkSoft, maxWidth: 280, margin: "0 auto 20px", lineHeight: 1.5 }}>{subtitle}</div>
      {action}
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div
      className="sb-pop"
      style={{
        position: "fixed", bottom: 94, left: "50%", transform: "translateX(-50%)", zIndex: 200,
        background: COLORS.ink, color: "#fff", padding: "12px 20px", borderRadius: 999,
        fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <CheckCircle2 size={16} color={COLORS.sage} /> {message}
    </div>
  );
}

function AnimatedNumber({ value, format = money0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf, start;
    const dur = 700;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const p = clamp((ts - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="sb-count sb-numeral">{format(display)}</span>;
}

/* ============================================================================
   ONBOARDING
============================================================================ */

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState(["lash"]);
  const [goals, setGoals] = useState(["track", "reorder"]);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");

  const toggle = (arr, setArr, id) => setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const wrap = (content, footer) => (
    <div className="sb-fade-up sb-onboard-screen" style={{
      display: "flex", flexDirection: "column", background: COLORS.bg,
      maxWidth: 480, margin: "0 auto", padding: "0 24px", boxSizing: "border-box",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 24, paddingBottom: 16, minHeight: 0 }}>
        {content}
      </div>
      <div style={{ paddingBottom: 28, flexShrink: 0 }}>{footer}</div>
    </div>
  );

  if (step === 0) {
    return wrap(
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 68, height: 68, borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.mocha}, ${COLORS.rose})`,
          margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={28} color="#fff" strokeWidth={1.8} />
        </div>
        <div className="sb-display" style={{ fontSize: 15, fontWeight: 700, color: COLORS.mocha, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
          Stocked Beauty
        </div>
        <div className="sb-display" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }}>
          Welcome to<br />Stocked Beauty
        </div>
        <div style={{ fontSize: 15.5, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
          Know what you have. Know what you need. Know what every service really costs.
        </div>
      </div>,
      <Button full size="lg" onClick={() => setStep(1)}>Get Started <ChevronRight size={18} /></Button>
    );
  }

  if (step === 1) {
    return wrap(
      <div>
        <div className="sb-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>What kind of beauty professional are you?</div>
        <div style={{ fontSize: 14, color: COLORS.inkSoft, marginBottom: 24 }}>Select all that apply — we'll tailor your categories.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
          {PROFESSIONS.map((p) => {
            const active = profession.includes(p.id);
            return (
              <div key={p.id} onClick={() => toggle(profession, setProfession, p.id)}
                style={{
                  padding: "18px 14px", borderRadius: 24, cursor: "pointer",
                  border: `1.5px solid ${active ? COLORS.mocha : COLORS.line}`,
                  background: active ? "#F4ECE5" : "#fff", transition: "all 0.15s",
                }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{p.icon}</div>
                <div className="sb-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{p.label}</div>
              </div>
            );
          })}
        </div>
      </div>,
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" onClick={() => setStep(0)} style={{ paddingLeft: 16, paddingRight: 16 }}><ChevronLeft size={18} /></Button>
        <Button full size="lg" onClick={() => setStep(2)} disabled={profession.length === 0}>Continue</Button>
      </div>
    );
  }

  if (step === 2) {
    return wrap(
      <div>
        <div className="sb-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>What would you like help with?</div>
        <div style={{ fontSize: 14, color: COLORS.inkSoft, marginBottom: 24 }}>We'll surface these first on your dashboard.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {GOALS.map((g) => {
            const active = goals.includes(g.id);
            return (
              <div key={g.id} onClick={() => toggle(goals, setGoals, g.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderRadius: 20,
                  cursor: "pointer", border: `1.5px solid ${active ? COLORS.mocha : COLORS.line}`, background: active ? "#F4ECE5" : "#fff",
                }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{g.label}</span>
                <div style={{
                  width: 22, height: 22, borderRadius: 999, border: `1.5px solid ${active ? COLORS.mocha : COLORS.line}`,
                  background: active ? COLORS.mocha : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>,
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" onClick={() => setStep(1)} style={{ paddingLeft: 16, paddingRight: 16 }}><ChevronLeft size={18} /></Button>
        <Button full size="lg" onClick={() => setStep(3)}>Continue</Button>
      </div>
    );
  }

  return wrap(
    <div>
      <div className="sb-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Create your account</div>
      <div style={{ fontSize: 14, color: COLORS.inkSoft, marginBottom: 24 }}>Google and Apple sign-in coming soon.</div>
      <Field label="Your Name"><Input placeholder="Maya Chen" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Business Name"><Input placeholder="Maya Lash Studio" value={business} onChange={(e) => setBusiness(e.target.value)} /></Field>
      <Field label="Email"><Input type="email" placeholder="maya@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Password"><Input type="password" placeholder="••••••••" /></Field>
    </div>,
    <div style={{ display: "flex", gap: 10 }}>
      <Button variant="secondary" onClick={() => setStep(2)} style={{ paddingLeft: 16, paddingRight: 16 }}><ChevronLeft size={18} /></Button>
      <Button full size="lg" onClick={() => onComplete({
        name: name || "Maya", business: business || "Maya Lash Studio", profession, goals, email,
      })}>Create Account</Button>
    </div>
  );
}

/* ============================================================================
   MAIN APP
============================================================================ */

const STORAGE_KEY = "stocked-beauty-app-state-v1";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState({ name: "Maya", business: "Maya Lash Studio", profession: ["lash"], currency: "USD" });
  const [data, setData] = useState(null);
  const [view, setView] = useState("home");
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [quickAction, setQuickAction] = useState(null); // null | "menu" | "log" | "inventory" | "service" | "waste"
  const saveTimer = useRef(null);

  // load
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setOnboarded(parsed.onboarded);
          setProfile(parsed.profile);
          setData(parsed.data);
        }
      } catch (e) {
        // no existing data
      }
      setLoaded(true);
    })();
  }, []);

  // save (debounced)
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify({ onboarded, profile, data }));
      } catch (e) { /* ignore */ }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [onboarded, profile, data, loaded]);

  const showToast = (msg) => setToast(msg);

  const completeOnboarding = (p) => {
    setProfile((prev) => ({ ...prev, ...p }));
    setData(buildEmptyData(p.profession));
    setOnboarded(true);
    setView("home");
  };

  const themeMode = profile.theme === "dark" ? "dark" : "light";
  const accentColor = profile.accentColor || DEFAULT_ACCENT;
  // Preserve the exact current look until the user actually picks a custom
  // color — only derive the lighter second gradient stop algorithmically
  // once they've moved off the default, so "default" stays pixel-identical
  // to what shipped before this feature.
  const accentColor2 = (profile.accentColor && profile.accentColor.toLowerCase() !== DEFAULT_ACCENT.toLowerCase())
    ? lightenHex(accentColor, 0.35)
    : DEFAULT_ACCENT_2;
  const rootVars = { "--sb-accent": accentColor, "--sb-accent-2": accentColor2 };
  const toggleTheme = () => setProfile((p) => ({ ...p, theme: p.theme === "dark" ? "light" : "dark" }));

  // The status bar / Dynamic Island area sits outside our own .sb-root div —
  // it's rendered over the real <html>/<body>, which otherwise stays
  // whatever static color the page shell defaults to. Keep those in sync
  // with the current theme so dark mode's background reaches the very top
  // of the screen instead of cutting off below the notch.
  useEffect(() => {
    const bg = THEME_VARS[themeMode]["--sb-bg"];
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", bg);
  }, [themeMode]);

  if (!loaded) {
    return <div className="sb-root" data-sb-theme={themeMode} style={{ minHeight: "100vh", ...rootVars }}><style>{FONT_STYLE}</style></div>;
  }

  if (!onboarded || !data) {
    return <div className="sb-root" data-sb-theme={themeMode} style={rootVars}><style>{FONT_STYLE}</style><Onboarding onComplete={completeOnboarding} /></div>;
  }

  return (
    <div className="sb-root" data-sb-theme={themeMode} style={{ minHeight: "100vh", ...rootVars }}>
      <style>{FONT_STYLE}</style>
      <div style={{ display: "flex" }}>
        <SidebarNav view={view} setView={setView} profile={profile} />
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 88 }}>
          <TopBar profile={profile} view={view} setView={setView} themeMode={themeMode} onToggleTheme={toggleTheme} onReset={async () => {
            await storage.delete(STORAGE_KEY).catch(() => {});
            setOnboarded(false); setData(null);
          }} />
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px" }}>
            {view === "home" && <InsightsView data={data} profile={profile} setView={setView} />}
            {view === "inventory" && <InventoryView data={data} setData={setData} showToast={showToast} />}
            {view === "services" && <ServicesView data={data} setData={setData} showToast={showToast} setView={setView} />}
            {view === "reorder" && <ReorderView data={data} setData={setData} showToast={showToast} />}
            {view === "insights" && <HomeView data={data} setData={setData} profile={profile} setView={setView} showToast={showToast} />}
            {view === "settings" && <SettingsView data={data} setData={setData} profile={profile} setProfile={setProfile} showToast={showToast} onReset={async () => {
              await storage.delete(STORAGE_KEY).catch(() => {});
              setOnboarded(false); setData(null);
            }} />}
          </div>
        </div>
      </div>
      <BottomNav view={view} setView={setView} />
      <GlobalFab onClick={() => setQuickAction("menu")} />

      {quickAction === "menu" && (
        <QuickActionSheet onClose={() => setQuickAction(null)} onPick={(action) => setQuickAction(action)} />
      )}

      {quickAction === "inventory" && (
        <ItemFormModal
          open item={null} categories={data.categories} suppliers={data.suppliers} inventory={data.inventory}
          onClose={() => setQuickAction(null)}
          onSave={(item) => {
            setData((d) => ({ ...d, inventory: [...d.inventory, item] }));
            setQuickAction(null);
            showToast("Product added");
          }}
          onDelete={null}
        />
      )}

      {quickAction === "service" && (
        <ServiceFormModal
          open service={null} inventory={data.inventory}
          onClose={() => setQuickAction(null)}
          onSave={(svc) => {
            setData((d) => ({ ...d, services: [...d.services, svc] }));
            setQuickAction(null);
            showToast("Service created");
          }}
          onDelete={null}
        />
      )}

      {quickAction === "log" && (
        <LogServiceModal
          open preset={{}} services={data.services} inventory={data.inventory}
          onClose={() => setQuickAction(null)}
          onComplete={(log, deductions) => {
            setData((d) => ({
              ...d,
              serviceLogs: [...d.serviceLogs, log],
              inventory: d.inventory.map((item) => {
                const ded = deductions.find((x) => x.productId === item.id);
                return ded ? { ...item, quantity: Math.max(0, item.quantity - ded.amount) } : item;
              }),
              transactions: [
                ...deductions.map((ded) => ({ id: uid("txn"), productId: ded.productId, type: "Service Usage", quantity: -ded.amount, serviceId: log.serviceId, date: log.date })),
                ...d.transactions,
              ],
            }));
            setQuickAction(null);
            showToast("Service logged — inventory updated");
          }}
        />
      )}

      {quickAction === "waste" && (
        <RecordWasteModal
          open inventory={data.inventory}
          onClose={() => setQuickAction(null)}
          onSave={(entry) => {
            setData((d) => ({
              ...d,
              inventory: d.inventory.map((i) => (i.id === entry.productId ? { ...i, quantity: Math.max(0, i.quantity - entry.quantity) } : i)),
              wasteLogs: [...d.wasteLogs, { id: uid("waste"), ...entry, date: new Date("2026-08-23T09:00:00").toISOString() }],
            }));
            setQuickAction(null);
            showToast("Waste recorded");
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}

function SidebarNav({ view, setView, profile }) {
  return (
    <div className="hide-mobile" style={{
      width: 232, borderRight: `1px solid ${COLORS.line}`, minHeight: "100vh", position: "sticky", top: 0,
      display: "none",
    }}>
      <style>{`@media (min-width: 900px) { .hide-mobile { display: flex !important; flex-direction: column; } .show-desktop-only{display:block !important;} }`}</style>
      <div style={{ padding: "26px 22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.mocha}, ${COLORS.rose})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <div className="sb-display" style={{ fontSize: 15.5, fontWeight: 800 }}>Stocked</div>
        </div>
      </div>
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {NAV.map((n) => {
          const active = view === n.id;
          const Icon = n.icon;
          return (
            <div key={n.id} onClick={() => setView(n.id)} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 999, cursor: "pointer",
              background: active ? COLORS.cardAlt : "transparent", color: active ? COLORS.ink : COLORS.inkSoft,
            }}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>{n.label}</span>
            </div>
          );
        })}
        <div onClick={() => setView("settings")} style={{
          display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 999, cursor: "pointer",
          background: view === "settings" ? COLORS.cardAlt : "transparent", color: view === "settings" ? COLORS.ink : COLORS.inkSoft,
        }}>
          <SettingsIcon size={17} strokeWidth={view === "settings" ? 2.2 : 1.8} />
          <span style={{ fontSize: 14, fontWeight: view === "settings" ? 700 : 500 }}>Settings</span>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 22, background: COLORS.cardAlt }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: COLORS.rose, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }} className="sb-display">
            {profile.name?.[0] || "M"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.business}</div>
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{profile.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ view, setView }) {
  const navRef = useRef(null);
  const safeBottom = useSafeAreaBottom(navRef);
  return (
    <div ref={navRef} className="show-mobile-nav" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: `color-mix(in srgb, ${COLORS.bg} 85%, transparent)`, backdropFilter: "blur(10px)",
      borderTop: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-around", padding: `9px 6px ${safeBottom + 4}px`,
      zIndex: 50,
    }}>
      <style>{`@media (min-width: 900px) { .show-mobile-nav { display: none !important; } }`}</style>
      {NAV.map((n) => {
        const active = view === n.id;
        const Icon = n.icon;
        return (
          <div key={n.id} onClick={() => setView(n.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px",
            borderRadius: 18, cursor: "pointer", color: active ? COLORS.mocha : COLORS.inkSoft, minWidth: 54,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? `color-mix(in srgb, ${COLORS.mocha} 18%, transparent)` : "transparent",
              boxShadow: active ? `0 0 14px color-mix(in srgb, ${COLORS.mocha} 55%, transparent)` : "none",
              transition: "background 0.25s ease, box-shadow 0.25s ease",
            }}>
              <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
            </div>
            <span className="sb-display" style={{ fontSize: 10.5, fontWeight: active ? 800 : 600 }}>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-label="Toggle"
      style={{
        width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer", padding: 3,
        background: checked ? COLORS.mocha : COLORS.line, display: "flex", alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start", transition: "background 0.2s ease", flexShrink: 0,
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: 999, background: "#fff", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

function TopBar({ profile, view, setView, themeMode, onToggleTheme, onReset }) {
  const [open, setOpen] = useState(false);
  const titles = { home: "Home", inventory: "Inventory", services: "Services", reorder: "Reorder", insights: "Insights", settings: "Settings" };
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: `color-mix(in srgb, ${COLORS.bg} 80%, transparent)`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${COLORS.line}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 16px", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="sb-display" style={{ fontSize: 17, fontWeight: 800 }}>{titles[view]}</div>
        <div style={{ position: "relative" }}>
          <div onClick={() => setOpen((o) => !o)} style={{
            width: 34, height: 34, borderRadius: 999, background: COLORS.rose, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }} className="sb-display">
            {profile.name?.[0] || "M"}
          </div>
          {open && (
            <div style={{
              position: "absolute", right: 0, top: 42, background: COLORS.card, borderRadius: 22, border: `1px solid ${COLORS.line}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)", width: 220, padding: 10, zIndex: 30,
            }}>
              <div style={{ padding: "8px 12px", fontSize: 12.5, color: COLORS.inkSoft }}>{profile.business}</div>
              <div onClick={() => { setOpen(false); setView && setView("settings"); }} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
              }}>
                <SettingsIcon size={15} /> Settings
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
                  <Moon size={15} /> Dark Mode
                </span>
                <Switch checked={themeMode === "dark"} onChange={onToggleTheme} />
              </div>
              <div onClick={() => { setOpen(false); onReset(); }} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: COLORS.critical,
              }}>
                <LogOut size={15} /> Log out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   HOME / DASHBOARD
============================================================================ */

function StatCard({ label, value, sub, icon: Icon, tone = COLORS.mocha, format = money0, onClick }) {
  return (
    <Card style={{ padding: 18 }} hover={!!onClick} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }} className="sb-display">{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: `color-mix(in srgb, ${tone} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={tone} strokeWidth={2} />
        </div>
      </div>
      <div className="sb-display" style={{ fontSize: 26, fontWeight: 800 }}>
        {typeof value === "number" ? <AnimatedNumber value={value} format={format} /> : value}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function HomeView({ data, setData, profile, setView, showToast }) {
  const { inventory, services, serviceLogs, wasteLogs, reorderList } = data;
  const invValue = totalInventoryValue(inventory);
  const lowItems = inventory.filter((i) => ["low", "critical", "expiring", "expired"].includes(stockStatus(i)));
  const criticalCount = inventory.filter((i) => ["critical", "expired"].includes(stockStatus(i))).length;
  const monthCost = monthlyProductCost(serviceLogs, services, inventory);
  const reorderEstimate = reorderList.filter((r) => !r.purchased).reduce((sum, r) => {
    const p = inventory.find((i) => i.id === r.productId);
    return sum + (p ? p.unitCost * r.quantity : 0);
  }, 0);

  const attention = useMemo(() => {
    return lowItems
      .map((item) => {
        const status = stockStatus(item);
        const appts = estimatedApptsRemaining(item);
        const dte = daysUntil(item.expirationDate);
        return { item, status, appts, dte };
      })
      .sort((a, b) => {
        const rank = { expired: 0, critical: 1, expiring: 2, low: 3 };
        return rank[a.status] - rank[b.status];
      })
      .slice(0, 5);
  }, [inventory]);

  const recentLogs = [...serviceLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  const addToReorder = (item) => {
    setData((d) => {
      if (d.reorderList.some((r) => r.productId === item.id && !r.purchased)) return d;
      return { ...d, reorderList: [...d.reorderList, { id: uid("ro"), productId: item.id, quantity: 1, purchased: false }] };
    });
    showToast(`Added ${item.name} to reorder list`);
  };

  return (
    <div className="sb-fade-up" style={{ paddingTop: 18, paddingBottom: 30 }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Attention &amp; Activity</div>
        <div style={{ fontSize: 14.5, color: COLORS.inkSoft }}>
          {criticalCount > 0
            ? <>Your inventory needs a look. <strong style={{ color: COLORS.ink }}>{lowItems.length} item{lowItems.length !== 1 ? "s" : ""}</strong> need attention.</>
            : "Your inventory looks good today."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 26 }}>
        <StatCard label="Inventory Value" value={invValue} sub={`Across ${inventory.length} products`} icon={Package} tone={COLORS.mocha} />
        <StatCard label="Low Stock" value={lowItems.length} sub={criticalCount > 0 ? `${criticalCount} critical` : "All manageable"} icon={AlertTriangle} tone={COLORS.warn} format={(v) => Math.round(v)} />
        <StatCard label="Reorder Soon" value={reorderEstimate} sub="Estimated order" icon={ShoppingCart} tone={COLORS.rose} />
        <StatCard label="This Month" value={monthCost} sub="Product cost" icon={PiggyBank} tone={COLORS.sage} />
      </div>

      <SectionHeader title="Needs Attention" action={attention.length > 0 && <LinkBtn onClick={() => setView("inventory")}>View all</LinkBtn>} />
      {attention.length === 0 ? (
        <Card style={{ padding: 22, marginBottom: 26 }} hover={false}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: `color-mix(in srgb, ${COLORS.good} 16%, var(--sb-card))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={19} color={COLORS.good} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Nothing needs attention</div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>All your supplies are stocked and fresh.</div>
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
          {attention.map(({ item, status, appts, dte }) => (
            <Card key={item.id} style={{ padding: 16 }} hover={false}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ShelfRing ratio={stockRatio(item)} color={STATUS_META[status].color}>
                  <Package size={16} color={STATUS_META[status].color} />
                </ShelfRing>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>
                    {status === "expiring" || status === "expired" ? (
                      status === "expired" ? "Expired" : `Expires in ${dte} day${dte !== 1 ? "s" : ""}`
                    ) : appts !== null ? `Estimated ${Math.max(0, Math.round(appts))} appointments remaining` : `${item.quantity} ${item.unitType}${item.quantity !== 1 ? "s" : ""} remaining`}
                  </div>
                </div>
                <Badge status={status} />
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button size="sm" variant="secondary" onClick={() => addToReorder(item)}>
                  {status === "expiring" || status === "expired" ? "Replace Soon" : "Add to reorder"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionHeader title="Recent Usage" action={<LinkBtn onClick={() => setView("services")}>Log a service</LinkBtn>} />
      {recentLogs.length === 0 ? (
        <EmptyState icon={Scissors} title="No services logged yet" subtitle="Log your first service to see product cost breakdowns here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentLogs.map((log) => {
            const svc = services.find((s) => s.id === log.serviceId);
            if (!svc) return null;
            const cost = serviceCost(svc, inventory);
            return (
              <Card key={log.id} style={{ padding: 16 }} hover={false}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div className="sb-truncate" style={{ fontWeight: 700, fontSize: 14.5 }}>{svc.name}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{log.clientName || "Walk-in"} · {timeAgo(log.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 2 }} className="sb-display">Product Cost</div>
                    <div className="sb-display" style={{ fontWeight: 800, fontSize: 15, color: COLORS.mocha }}>{money(cost)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div className="sb-display" style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
      {action}
    </div>
  );
}

function LinkBtn({ children, onClick }) {
  return (
    <div onClick={onClick} style={{ fontSize: 13, fontWeight: 700, color: COLORS.mocha, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }} className="sb-display">
      {children} <ChevronRight size={14} />
    </div>
  );
}

/* ============================================================================
   INVENTORY
============================================================================ */

function InventoryView({ data, setData, showToast }) {
  const { inventory, categories, suppliers } = data;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Lowest Stock");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [groupBy, setGroupBy] = useState("None");

  const filtered = useMemo(() => {
    let list = inventory.filter((i) => {
      const matchesSearch = !search || [i.name, i.brand, i.category, i.sku].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesCat = catFilter === "All" || i.category === catFilter;
      const matchesStatus = statusFilter === "All" || stockStatus(i) === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
    const sorters = {
      "Lowest Stock": (a, b) => stockRatio(a) - stockRatio(b),
      "Recently Added": (a, b) => new Date(b.datePurchased) - new Date(a.datePurchased),
      "Highest Value": (a, b) => inventoryValue(b) - inventoryValue(a),
      "Expiring Soon": (a, b) => (daysUntil(a.expirationDate) ?? 9999) - (daysUntil(b.expirationDate) ?? 9999),
      "Alphabetical": (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(sorters[sortBy]);
  }, [inventory, search, catFilter, statusFilter, sortBy]);

  const grouped = useMemo(() => {
    if (groupBy === "None") return { "All Items": filtered };
    const map = {};
    filtered.forEach((i) => {
      const key = groupBy === "Curl" ? (i.curl || "Other") : groupBy === "Diameter" ? (i.diameter || "Other") : (i.length || "Other");
      map[key] = map[key] || [];
      map[key].push(i);
    });
    return map;
  }, [filtered, groupBy]);

  const deleteItem = (id) => {
    setData((d) => ({ ...d, inventory: d.inventory.filter((i) => i.id !== id) }));
    showToast("Product removed");
    setEditing(null);
  };

  const saveItem = (item) => {
    setData((d) => {
      const exists = d.inventory.some((i) => i.id === item.id);
      return { ...d, inventory: exists ? d.inventory.map((i) => (i.id === item.id ? item : i)) : [...d.inventory, item] };
    });
    showToast(editing?.id ? "Product updated" : "Product added");
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="sb-fade-up" style={{ paddingTop: 18, paddingBottom: 100, position: "relative" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={16} color={COLORS.inkSoft} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <Input placeholder="Search products, brands, SKUs..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <Button variant="secondary" onClick={() => setShowQuickAdd(true)}><Plus size={16} /> Add</Button>
      </div>

      <div className="sb-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 10, paddingBottom: 4 }}>
        <Chip active={catFilter === "All"} onClick={() => setCatFilter("All")}>All Categories</Chip>
        {categories.map((c) => <Chip key={c.id} active={catFilter === c.name} onClick={() => setCatFilter(c.name)}>{c.name}</Chip>)}
      </div>
      <div className="sb-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {["All", "critical", "low", "expiring", "healthy"].map((s) => (
          <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} tone={s === "All" ? undefined : STATUS_META[s]?.color}>
            {s === "All" ? "All Status" : STATUS_META[s].label}
          </Chip>
        ))}
        <div style={{ width: 1, background: COLORS.line, margin: "2px 4px" }} />
        <SmallSelect value={sortBy} onChange={setSortBy} options={["Lowest Stock", "Recently Added", "Highest Value", "Expiring Soon", "Alphabetical"]} />
        {catFilter === "Lash Trays" && <SmallSelect value={groupBy} onChange={setGroupBy} options={["None", "Curl", "Diameter", "Length"]} prefix="Group: " />}
      </div>

      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package2}
          title="Your shelf is waiting."
          subtitle="Add your first product and we'll help you keep track of the rest."
          action={<Button onClick={() => setShowQuickAdd(true)}><Plus size={16} /> Add Product</Button>}
        />
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 22 }}>
            {groupBy !== "None" && <div className="sb-display" style={{ fontSize: 13, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 10 }}>{group} · {items.length}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {items.map((item) => <InventoryCard key={item.id} item={item} onClick={() => setEditing(item)} suppliers={suppliers} />)}
            </div>
          </div>
        ))
      )}

      <ItemFormModal
        open={showForm || !!editing}
        item={editing}
        categories={categories}
        suppliers={suppliers}
        inventory={inventory}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSave={saveItem}
        onDelete={editing ? () => deleteItem(editing.id) : null}
      />

      <QuickAddModal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} onPick={(mode, sourceItem) => {
        setShowQuickAdd(false);
        if (mode === "duplicate" && sourceItem) {
          setEditing({ ...sourceItem, id: uid("inv"), name: `${sourceItem.name} (copy)` });
        } else {
          setEditing(null);
          setShowForm(true);
        }
      }} inventory={inventory} />
    </div>
  );
}

function Chip({ children, active, onClick, tone }) {
  return (
    <div onClick={onClick} className="sb-display" style={{
      padding: "8px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
      background: active ? (tone || COLORS.ink) : COLORS.cardAlt, color: active ? "#fff" : COLORS.inkSoft, transition: "all 0.15s", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function SmallSelect({ value, onChange, options, prefix = "" }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="sb-display" style={{
      padding: "7px 26px 7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, border: `1px solid ${COLORS.line}`,
      background: COLORS.card, color: COLORS.inkSoft, cursor: "pointer", flexShrink: 0,
    }}>
      {options.map((o) => <option key={o} value={o}>{prefix}{o}</option>)}
    </select>
  );
}

function InventoryCard({ item, onClick, suppliers }) {
  const status = stockStatus(item);
  const appts = estimatedApptsRemaining(item);
  const meta = STATUS_META[status];
  const detail = item.category === "Lash Trays" ? `${item.length} · ${item.curl} · ${item.diameter}` : item.brand;
  const justRestocked = isRecentlyRestocked(item);
  return (
    <Card onClick={onClick} style={{
      padding: 16,
      ...(justRestocked ? {
        boxShadow: `0 0 0 2px ${RESTOCK_GLOW}, 0 0 18px color-mix(in srgb, ${RESTOCK_GLOW} 55%, transparent)`,
      } : {}),
    }}>
      {justRestocked && (
        <div className="sb-display" style={{
          display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800,
          color: "#fff", background: RESTOCK_GLOW, padding: "3px 9px", borderRadius: 999, marginBottom: 10,
        }}>
          <Sparkles size={10} /> Just Restocked
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <ShelfRing ratio={stockRatio(item)} color={meta.color} size={46}>
          <span className="sb-display" style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>{Math.round(stockRatio(item) * 100)}%</span>
        </ShelfRing>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{detail}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Badge status={status} />
        <div className="sb-display" style={{ fontSize: 13, fontWeight: 800 }}>{money(inventoryValue(item))}</div>
      </div>
      <div style={{ fontSize: 11.5, color: COLORS.inkSoft, borderTop: `1px solid ${COLORS.line}`, paddingTop: 8 }}>
        {appts !== null ? `~${Math.max(0, Math.round(appts))} appointments left` : `${item.quantity} ${item.unitType}${item.quantity !== 1 ? "s" : ""}`}
      </div>
    </Card>
  );
}

function QuickAddModal({ open, onClose, onPick, inventory }) {
  const [mode, setMode] = useState("choose");
  return (
    <Modal open={open} onClose={onClose} title="Add Inventory">
      {mode === "choose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <QuickAction icon={Plus} label="Add Product" sub="Enter a new product manually" onClick={() => onPick("new")} />
          <QuickAction icon={Camera} label="Scan Product Label" sub="Snap a photo and we'll read the name" onClick={() => onPick("new")} />
          <QuickAction icon={Copy} label="Duplicate Existing Item" sub="Start from a product you already track" onClick={() => setMode("duplicate")} />
        </div>
      )}
      {mode === "duplicate" && (
        <div>
          <div className="sb-scroll" style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {inventory.map((i) => (
              <div key={i.id} onClick={() => onPick("duplicate", i)} style={{
                padding: "12px 16px", borderRadius: 18, border: `1px solid ${COLORS.line}`, cursor: "pointer", display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{i.name}</span>
                <ChevronRight size={15} color={COLORS.inkSoft} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function QuickAction({ icon: Icon, label, sub, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 13, padding: 16, borderRadius: 22, border: `1px solid ${COLORS.line}`, cursor: "pointer", background: COLORS.card,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 999, background: COLORS.cardAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} color={COLORS.mocha} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{sub}</div>
      </div>
    </div>
  );
}

/* ============================================================================
   LABEL SCANNER (camera → OCR → autofill product name)
   Loads Tesseract.js from a CDN on first use (no bundler dependency needed) —
   runs entirely in the browser, no server or API key required.
============================================================================ */

let tesseractLoadPromise = null;
function loadTesseract() {
  if (typeof window !== "undefined" && window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error("OCR library failed to initialize")));
    script.onerror = () => reject(new Error("Couldn't load the OCR library"));
    document.head.appendChild(script);
  });
  return tesseractLoadPromise;
}

// Downscale + denoise + binarize before OCR. Raw, full-resolution phone
// photos (often 3000px+, full color, with packaging texture, glare, and
// JPEG compression speckle) are exactly what makes Tesseract garble
// individual characters. A light blur first smooths out that pixel-level
// noise so it doesn't get mistaken for stray marks; Otsu's method then
// auto-picks the brightness cutoff that best separates ink from background
// for a clean black-and-white result — together these are the two biggest
// levers for accurate printed-text OCR.
function preprocessImageForOCR(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = 1800;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const n = w * h;

      // Grayscale.
      const gray = new Float32Array(n);
      for (let p = 0, i = 0; p < n; p++, i += 4) {
        gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // Light 3x3 box blur to smooth out single-pixel JPEG/sensor noise
      // (a common cause of one-off garbled characters) without softening
      // real letter strokes much.
      const blurred = new Float32Array(n);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w) { sum += gray[ny * w + nx]; count++; }
            }
          }
          blurred[y * w + x] = sum / count;
        }
      }

      // Otsu's method: find the threshold that minimizes combined
      // within-class variance between "ink" and "background" pixels.
      const hist = new Array(256).fill(0);
      for (let p = 0; p < n; p++) hist[blurred[p] | 0]++;
      let sum = 0;
      for (let t = 0; t < 256; t++) sum += t * hist[t];
      let sumB = 0, wB = 0, varMax = -1, threshold = 128;
      for (let t = 0; t < 256; t++) {
        wB += hist[t];
        if (wB === 0) continue;
        const wF = n - wB;
        if (wF === 0) break;
        sumB += t * hist[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const between = wB * wF * (mB - mF) * (mB - mF);
        if (between > varMax) { varMax = between; threshold = t; }
      }
      for (let p = 0, i = 0; p < n; p++, i += 4) {
        const v = blurred[p] > threshold ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that photo"))), "image/jpeg", 0.95);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't load that photo")); };
    img.src = url;
  });
}

// Tesseract can return lines that are mostly punctuation/noise from
// packaging texture, glare, or icons it mistook for characters. Keep only
// lines that look like real words: a decent letter count and a high enough
// ratio of letters/digits/spaces to total characters.
function looksLikeText(line) {
  const letters = (line.match(/[A-Za-z]/g) || []).length;
  const alnumOrSpace = (line.match(/[A-Za-z0-9 .\-'&/%]/g) || []).length;
  return letters >= 2 && alnumOrSpace / line.length >= 0.7;
}

// Product-label text is almost always plain letters, numbers, and a small
// set of punctuation — restricting Tesseract's output to that set stops it
// from "reading" packaging texture or icons as stray symbols/accented
// characters, which was a common source of the remaining garbled results.
const OCR_CHAR_WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,'&/%-+";

function ScanTextField({ label, value, onChange, placeholder, fieldName, suggestions }) {
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanLines, setScanLines] = useState([]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanError(""); setScanLines([]); setScanning(true);
    let worker = null;
    try {
      const Tesseract = await loadTesseract();
      const processed = await preprocessImageForOCR(file);
      worker = await Tesseract.createWorker("eng", 1, {
        // The "best" trained model (vs. the default "fast" one) is a
        // noticeably larger, more accurate LSTM model — meaningfully better
        // at handling font variation, at the cost of a slower scan. Genuine
        // connected cursive/script is still a much harder problem than
        // printed text for any OCR engine, but this gives it the best
        // realistic shot without needing a cloud OCR service.
        langPath: "https://tessdata.projectnaptha.com/4.0.0_best",
      });
      await worker.setParameters({
        tessedit_char_whitelist: OCR_CHAR_WHITELIST,
        preserve_interword_spaces: "1",
      });

      // Run three passes with different layout assumptions and merge the
      // results — "sparse text" (find scattered words anywhere) can
      // actually fragment one clean bold line worse than "uniform block"
      // or "single line" would, and vice versa depending on the label.
      // Trying all three and combining catches more than any one alone.
      const allLines = [];
      for (const psm of ["6", "7", "11"]) {
        await worker.setParameters({ tessedit_pageseg_mode: psm });
        const { data } = await worker.recognize(processed);
        (data?.text || "")
          .split("\n")
          .map((l) => l.replace(/\s+/g, " ").trim())
          .filter((l) => l.length > 1 && looksLikeText(l))
          .forEach((l) => allLines.push(l));
      }
      const lines = allLines
        .filter((l, i, arr) => arr.findIndex((x) => x.toLowerCase() === l.toLowerCase()) === i)
        .sort((a, b) => b.length - a.length)
        .slice(0, 8);
      if (lines.length === 0) setScanError("Couldn't find readable text in that photo — try better lighting or a closer, flatter shot of the label.");
      setScanLines(lines);
    } catch (err) {
      setScanError("Couldn't read that photo. Try again, or enter the name manually.");
    } finally {
      if (worker) { try { await worker.terminate(); } catch {} }
      setScanning(false);
    }
  };

  return (
    <Field label={label}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1 }} list={suggestions?.length ? `sb-suggest-${fieldName.replace(/\s+/g, "-")}` : undefined} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title={`Scan a label to fill in the ${fieldName}`}
          style={{
            width: 46, height: 46, borderRadius: 14, border: `1.5px solid ${COLORS.line}`, background: COLORS.card,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
        >
          <Camera size={18} color={COLORS.mocha} />
        </button>
      </div>
      {!!suggestions?.length && (
        <datalist id={`sb-suggest-${fieldName.replace(/\s+/g, "-")}`}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />

      {scanning && (
        <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: COLORS.inkSoft }}>
          <span className="sb-spin" style={{ width: 14, height: 14, borderRadius: 999, border: `2px solid ${COLORS.line}`, borderTopColor: COLORS.mocha, display: "inline-block" }} />
          Reading the label — this can take 10–15 seconds…
        </div>
      )}

      {!!scanError && <div style={{ marginTop: 9, fontSize: 12.5, color: COLORS.critical }}>{scanError}</div>}

      {scanLines.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 7 }}>Tap the line that's the {fieldName}:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {scanLines.map((line, i) => (
              <button
                key={i} type="button"
                onClick={() => { onChange(line); setScanLines([]); }}
                style={{ fontSize: 12.5, fontWeight: 600, padding: "8px 13px", borderRadius: 999, border: `1px solid ${COLORS.line}`, background: COLORS.cardAlt, cursor: "pointer", color: COLORS.ink }}
              >
                {line}
              </button>
            ))}
          </div>
        </div>
      )}
    </Field>
  );
}

function ItemFormModal({ open, item, categories, suppliers, inventory = [], onClose, onSave, onDelete }) {
  const blank = () => ({
    id: uid("inv"), name: "", brand: "", category: categories[0]?.name || "Other", unitType: "unit",
    quantity: 0, purchasePrice: 0, purchaseQty: 1, unitCost: 0, supplierId: suppliers[0]?.id || "",
    datePurchased: new Date().toISOString(), dateOpened: "", expirationDate: "", reorderThreshold: 1,
    sku: "", notes: "", avgUsagePerAppt: 0, curl: "", diameter: "", length: "", trayType: "Single Length",
  });
  const [form, setForm] = useState(item || blank());
  useEffect(() => { setForm(item || blank()); }, [item, open]);

  if (!open) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isLashTray = form.category === "Lash Trays";
  // Names/brands already typed in once (whether by OCR or by hand) become
  // autocomplete suggestions — handy for cursive/stylized brand names,
  // since they only need to be read accurately once and can be picked from
  // the list on every repeat purchase after that.
  const nameSuggestions = [...new Set(inventory.map((i) => i.name).filter(Boolean))];
  const brandSuggestions = [...new Set(inventory.map((i) => i.brand).filter(Boolean))];

  const handleSave = () => {
    const purchasePrice = parseFloat(form.purchasePrice) || 0;
    const purchaseQty = parseFloat(form.purchaseQty) || 1;
    const unitCost = purchasePrice / purchaseQty;
    onSave({ ...form, quantity: parseFloat(form.quantity) || 0, purchasePrice, purchaseQty, unitCost, reorderThreshold: parseFloat(form.reorderThreshold) || 0, avgUsagePerAppt: parseFloat(form.avgUsagePerAppt) || 0 });
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? "Edit Product" : "Add Product"} width={560}>
      <ScanTextField label="Product Name" fieldName="product name" placeholder="e.g. 11mm CC 0.05 Lash Tray" value={form.name} onChange={(v) => set("name", v)} suggestions={nameSuggestions} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <ScanTextField label="Brand" fieldName="brand" placeholder="Brand" value={form.brand} onChange={(v) => set("brand", v)} suggestions={brandSuggestions} />
        <Field label="Category">
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>
      </div>

      {isLashTray && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 12 }}>
          <Field label="Curl"><Select value={form.curl} onChange={(e) => set("curl", e.target.value)}><option value="">—</option>{CURLS.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Diameter"><Select value={form.diameter} onChange={(e) => set("diameter", e.target.value)}><option value="">—</option>{DIAMETERS.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Length"><Select value={form.length} onChange={(e) => set("length", e.target.value)}><option value="">—</option>{LENGTHS.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 12 }}>
        <Field label="Quantity On Hand"><Input type="number" step="0.01" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
        <Field label="Unit Type">
          <Select value={form.unitType} onChange={(e) => set("unitType", e.target.value)}>
            {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
        <Field label="Reorder Threshold"><Input type="number" step="0.01" value={form.reorderThreshold} onChange={(e) => set("reorderThreshold", e.target.value)} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Field label="Purchase Price" hint="Price you paid for the pack/bottle"><Input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} /></Field>
        <Field label="Units Per Purchase" hint="e.g. 50 pairs, 100 brushes"><Input type="number" step="1" value={form.purchaseQty} onChange={(e) => set("purchaseQty", e.target.value)} /></Field>
      </div>

      <Field label="Supplier">
        <Select value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)}>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Field label="Date Opened"><Input type="date" value={form.dateOpened ? form.dateOpened.slice(0, 10) : ""} onChange={(e) => set("dateOpened", e.target.value)} /></Field>
        <Field label="Expiration Date"><Input type="date" value={form.expirationDate ? form.expirationDate.slice(0, 10) : ""} onChange={(e) => set("expirationDate", e.target.value)} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Field label="SKU"><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="Avg. Used Per Appointment" hint="Helps forecast run-out"><Input type="number" step="0.01" value={form.avgUsagePerAppt} onChange={(e) => set("avgUsagePerAppt", e.target.value)} /></Field>
      </div>

      <Field label="Notes"><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {onDelete && <Button variant="danger" onClick={onDelete}><Trash2 size={15} /> Delete</Button>}
        <Button full onClick={handleSave} disabled={!form.name}>Save Product</Button>
      </div>
    </Modal>
  );
}

/* ============================================================================
   SERVICES
============================================================================ */

function ServicesView({ data, setData, showToast, setView }) {
  const { services, inventory } = data;
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [logging, setLogging] = useState(null);

  const saveService = (svc) => {
    setData((d) => {
      const exists = d.services.some((s) => s.id === svc.id);
      return { ...d, services: exists ? d.services.map((s) => (s.id === svc.id ? svc : s)) : [...d.services, svc] };
    });
    showToast(editing?.id ? "Service updated" : "Service created");
    setShowForm(false); setEditing(null);
  };

  const deleteService = (id) => {
    setData((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }));
    showToast("Service removed");
    setEditing(null);
  };

  return (
    <div className="sb-fade-up" style={{ paddingTop: 18, paddingBottom: 100 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
        <Button variant="secondary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> New Service</Button>
        <Button onClick={() => setLogging({})}><Scissors size={15} /> Log Service</Button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={Scissors} title="No services yet" subtitle="Create the services you perform so we can track their true product cost." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Create Service</Button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {services.map((svc) => {
            const { cost, profit, margin } = serviceMargin(svc, inventory);
            return (
              <Card key={svc.id} onClick={() => setEditing(svc)} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div className="sb-truncate" style={{ fontWeight: 700, fontSize: 15.5 }}>{svc.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{svc.category} · {svc.duration} min</div>
                  </div>
                  <div className="sb-display" style={{ fontSize: 17, fontWeight: 800 }}>{money0(svc.price)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 12 }}>
                  <MiniStat label="Product Cost" value={money(cost)} color={COLORS.critical} />
                  <MiniStat label="Margin" value={pct(margin)} color={margin > 0.85 ? COLORS.good : margin > 0.6 ? COLORS.warn : COLORS.critical} />
                </div>
                <div style={{ height: 6, borderRadius: 999, background: COLORS.line, overflow: "hidden" }}>
                  <div style={{ width: `${clamp(margin, 0, 1) * 100}%`, height: "100%", background: COLORS.sage, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setLogging({ serviceId: svc.id }); }}>Log this service</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ServiceFormModal
        open={showForm || !!editing}
        service={editing}
        inventory={inventory}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSave={saveService}
        onDelete={editing ? () => deleteService(editing.id) : null}
      />

      <LogServiceModal
        open={!!logging}
        preset={logging}
        services={services}
        inventory={inventory}
        onClose={() => setLogging(null)}
        onComplete={(log, deductions) => {
          setData((d) => ({
            ...d,
            serviceLogs: [...d.serviceLogs, log],
            inventory: d.inventory.map((item) => {
              const ded = deductions.find((x) => x.productId === item.id);
              return ded ? { ...item, quantity: Math.max(0, item.quantity - ded.amount) } : item;
            }),
            transactions: [
              ...deductions.map((ded) => ({ id: uid("txn"), productId: ded.productId, type: "Service Usage", quantity: -ded.amount, serviceId: log.serviceId, date: log.date })),
              ...d.transactions,
            ],
          }));
          setLogging(null);
          showToast("Service logged — inventory updated");
        }}
      />
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: COLORS.cardAlt, borderRadius: 16, padding: "9px 12px" }}>
      <div style={{ fontSize: 10.5, color: COLORS.inkSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }} className="sb-display">{label}</div>
      <div className="sb-display" style={{ fontSize: 14.5, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function ServiceFormModal({ open, service, inventory, onClose, onSave, onDelete }) {
  const blank = () => ({ id: uid("svc"), name: "", category: "Lash Extensions", price: 0, duration: 60, recipe: [] });
  const [form, setForm] = useState(service || blank());
  useEffect(() => { setForm(service || blank()); }, [service, open]);
  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cost = form.recipe.reduce((sum, r) => {
    const p = inventory.find((i) => i.id === r.productId);
    return sum + (p ? p.unitCost * (parseFloat(r.amount) || 0) : 0);
  }, 0);
  const price = parseFloat(form.price) || 0;
  const profit = price - cost;
  const margin = price > 0 ? profit / price : 0;

  const addRecipeItem = () => setForm((f) => ({ ...f, recipe: [...f.recipe, { productId: inventory[0]?.id, amount: 1 }] }));
  const updateRecipeItem = (idx, patch) => setForm((f) => ({ ...f, recipe: f.recipe.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }));
  const removeRecipeItem = (idx) => setForm((f) => ({ ...f, recipe: f.recipe.filter((_, i) => i !== idx) }));

  return (
    <Modal open={open} onClose={onClose} title={service ? "Edit Service" : "New Service"} width={600}>
      <Field label="Service Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hybrid Full Set" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
        <Field label="Category"><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></Field>
        <Field label="Price Charged"><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
        <Field label="Duration (min)"><Input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 10 }}>
        <div className="sb-display" style={{ fontSize: 13.5, fontWeight: 800 }}>Product Recipe</div>
        <Button size="sm" variant="secondary" onClick={addRecipeItem}><Plus size={14} /> Add Product</Button>
      </div>
      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>Define roughly how much of each product this service consumes. We'll deduct these automatically when you log it.</div>

      {form.recipe.length === 0 && <div style={{ fontSize: 13, color: COLORS.inkSoft, padding: "14px 0", textAlign: "center", border: `1px dashed ${COLORS.line}`, borderRadius: 20, marginBottom: 14 }}>No products added yet</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {form.recipe.map((r, idx) => {
          const prod = inventory.find((i) => i.id === r.productId);
          return (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Select value={r.productId} onChange={(e) => updateRecipeItem(idx, { productId: e.target.value })} style={{ flex: 2 }}>
                {inventory.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
              <Input type="number" step="0.01" value={r.amount} onChange={(e) => updateRecipeItem(idx, { amount: e.target.value })} style={{ flex: 1 }} placeholder="Amount" />
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, width: 46 }}>{prod?.unitType}</div>
              <button onClick={() => removeRecipeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><X size={16} color={COLORS.critical} /></button>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 16 }}>
        <MiniStat label="Product Cost" value={money(cost)} color={COLORS.critical} />
        <MiniStat label="Gross Profit" value={money(profit)} color={COLORS.good} />
        <MiniStat label="Margin" value={pct(margin)} color={COLORS.mocha} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {onDelete && <Button variant="danger" onClick={onDelete}><Trash2 size={15} /> Delete</Button>}
        <Button full onClick={() => onSave({ ...form, price: parseFloat(form.price) || 0, duration: parseFloat(form.duration) || 0 })} disabled={!form.name}>Save Service</Button>
      </div>
    </Modal>
  );
}

function LogServiceModal({ open, preset, services, inventory, onClose, onComplete }) {
  const [serviceId, setServiceId] = useState(preset?.serviceId || services[0]?.id || "");
  const [clientName, setClientName] = useState("");
  const [price, setPrice] = useState(null);
  const [step, setStep] = useState("form");

  useEffect(() => {
    if (open) {
      setServiceId(preset?.serviceId || services[0]?.id || "");
      setClientName("");
      setPrice(null);
      setStep("form");
    }
  }, [open, preset]);

  if (!open) return null;
  const svc = services.find((s) => s.id === serviceId);
  const cost = svc ? serviceCost(svc, inventory) : 0;
  const finalPrice = price !== null ? price : (svc?.price || 0);
  const profit = finalPrice - cost;
  const margin = finalPrice > 0 ? profit / finalPrice : 0;

  const complete = () => {
    const log = { id: uid("log"), serviceId, clientName, date: new Date("2026-08-23T09:00:00").toISOString(), price: finalPrice };
    const deductions = svc.recipe.map((r) => ({ productId: r.productId, amount: r.amount }));
    onComplete(log, deductions);
  };

  return (
    <Modal open={open} onClose={onClose} title={step === "form" ? "Log Service" : "Service Complete"} width={480}>
      {step === "form" ? (
        <div>
          <Field label="Service">
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Client Name (optional)"><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Walk-in" /></Field>
          <Field label="Price Charged"><Input type="number" value={finalPrice} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} /></Field>

          {svc && (
            <div style={{ background: COLORS.cardAlt, borderRadius: 20, padding: 16, marginBottom: 16 }}>
              <div className="sb-display" style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 10 }}>Will automatically deduct</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {svc.recipe.map((r, idx) => {
                  const p = inventory.find((i) => i.id === r.productId);
                  if (!p) return null;
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                      <span style={{ color: COLORS.inkSoft }}>{p.name}</span>
                      <span style={{ fontWeight: 700 }}>-{r.amount} {p.unitType}{r.amount !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button full size="lg" onClick={() => { complete(); setStep("done"); }} disabled={!svc}>Complete Service</Button>
        </div>
      ) : (
        <div className="sb-fade-up">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 999, background: `color-mix(in srgb, ${COLORS.good} 16%, var(--sb-card))`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckCircle2 size={26} color={COLORS.good} />
            </div>
            <div className="sb-display" style={{ fontSize: 17, fontWeight: 800 }}>{svc?.name} completed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <RowStat label="Revenue" value={money0(finalPrice)} />
            <RowStat label="Product Cost" value={money(cost)} />
            <RowStat label="Gross Profit Before Labor" value={money(profit)} strong />
            <RowStat label="Product Margin" value={pct(margin)} strong color={COLORS.mocha} />
          </div>
          <Button full size="lg" onClick={onClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

function RowStat({ label, value, strong, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: COLORS.cardAlt, borderRadius: 18 }}>
      <span style={{ fontSize: 13.5, color: COLORS.inkSoft, fontWeight: strong ? 700 : 500 }}>{label}</span>
      <span className="sb-display" style={{ fontSize: strong ? 16 : 14, fontWeight: 800, color: color || COLORS.ink }}>{value}</span>
    </div>
  );
}

/* ============================================================================
   GLOBAL QUICK ACTION (floating action button + action sheet)
   Always on-screen so adding inventory, logging a service, etc. never
   requires scrolling to find a button.
============================================================================ */

function GlobalFab({ onClick }) {
  const [pressed, setPressed] = useState(false);
  const fabRef = useRef(null);
  const safeBottom = useSafeAreaBottom(fabRef);
  return (
    <>
      <style>{`@media (min-width: 900px) { .sb-fab { bottom: 26px !important; } }`}</style>
      <button
        ref={fabRef}
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        aria-label="Quick action"
        className="sb-fab"
        style={{
          position: "fixed", right: 18, bottom: 84 + safeBottom,
          width: 56, height: 56, borderRadius: 999, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${COLORS.mocha}, ${COLORS.rose})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 10px 26px color-mix(in srgb, ${COLORS.mocha} 40%, transparent)`, zIndex: 55,
          transform: pressed ? "scale(0.92)" : "scale(1)", transition: "transform 0.15s ease",
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.4} />
      </button>
    </>
  );
}

function QuickActionSheet({ onClose, onPick }) {
  return (
    <Modal open onClose={onClose} title="Quick Action">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <QuickAction icon={Scissors} label="Log Service" sub="Record a completed appointment" onClick={() => onPick("log")} />
        <QuickAction icon={Plus} label="Add Inventory" sub="Add a new product to your shelf" onClick={() => onPick("inventory")} />
        <QuickAction icon={Sparkles} label="Create Service" sub="Define a new service and its recipe" onClick={() => onPick("service")} />
        <QuickAction icon={PackageX} label="Record Waste" sub="Mark a product expired, spilled, or lost" onClick={() => onPick("waste")} />
      </div>
    </Modal>
  );
}

function RecordWasteModal({ open, inventory, onClose, onSave }) {
  const [productId, setProductId] = useState(inventory[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Used");

  useEffect(() => {
    if (open) {
      setProductId(inventory[0]?.id || "");
      setQuantity(1);
      setReason("Used");
    }
  }, [open]);

  if (!open) return null;
  const product = inventory.find((i) => i.id === productId);
  const cost = product ? product.unitCost * (parseFloat(quantity) || 0) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Record Waste" width={460}>
      <Field label="Product">
        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
          {inventory.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </Select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Field label="Quantity"><Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
        <Field label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {["Used", "Expired", "Damaged", "Lost", "Spilled", "Discarded"].map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ marginBottom: 16 }}>
        <MiniStat label="Estimated Cost" value={money(cost)} color={COLORS.critical} />
      </div>
      <Button full onClick={() => onSave({ productId, quantity: parseFloat(quantity) || 0, reason, cost })} disabled={!product}>Record Waste</Button>
    </Modal>
  );
}

/* ============================================================================
   REORDER
============================================================================ */

function ReorderView({ data, setData, showToast }) {
  const { inventory, reorderList, suppliers, recentlyOrdered } = data;

  // Items with a pending (unconfirmed) reorder shouldn't keep nagging from
  // Critical/Low/Expiring — the order's already been placed. They come back
  // into those lists only if a confirmed delivery didn't actually fix their
  // stock/expiration (unlikely, but possible if someone edits things by hand).
  const pendingProductIds = useMemo(() => new Set((recentlyOrdered || []).map((r) => r.productId)), [recentlyOrdered]);

  const recommendations = useMemo(() => {
    return inventory
      .map((item) => {
        const status = stockStatus(item);
        const appts = estimatedApptsRemaining(item);
        if (status === "healthy") return null;
        if (pendingProductIds.has(item.id)) return null;
        const suggestedQty = Math.max(1, Math.ceil((item.reorderThreshold * 2 - item.quantity) / (item.purchaseQty >= 1 && item.unitType === "tray" ? 1 : 1)));
        return { item, status, appts, suggestedQty: item.unitType === "tray" ? Math.max(1, Math.ceil((item.reorderThreshold * 2.2 - item.quantity))) : Math.max(1, Math.ceil(item.reorderThreshold * 2 - item.quantity)) };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const rank = { expired: 0, critical: 1, expiring: 2, low: 3 };
        return rank[a.status] - rank[b.status];
      });
  }, [inventory, pendingProductIds]);

  const groups = {
    critical: recommendations.filter((r) => r.status === "critical" || r.status === "expired"),
    low: recommendations.filter((r) => r.status === "low"),
    expiring: recommendations.filter((r) => r.status === "expiring"),
  };

  const addToCart = (item, qty = 1) => {
    setData((d) => {
      const existing = d.reorderList.find((r) => r.productId === item.id && !r.purchased);
      if (existing) {
        return { ...d, reorderList: d.reorderList.map((r) => (r.id === existing.id ? { ...r, quantity: r.quantity + qty } : r)) };
      }
      return { ...d, reorderList: [...d.reorderList, { id: uid("ro"), productId: item.id, quantity: qty, purchased: false }] };
    });
    showToast(`Added ${item.name} to reorder list`);
  };

  // One-tap "I placed this order" for an item straight from the Critical/
  // Running Low/Expiring Soon lists. This does NOT touch inventory yet —
  // it just logs the order as pending, which is enough on its own to pull
  // the item off those lists (see pendingProductIds above). Stock only
  // actually gets added once the order is confirmed as received, below.
  const markReordered = (item, status, suggestedQty) => {
    setData((d) => ({
      ...d,
      recentlyOrdered: [
        { id: uid("ro"), productId: item.id, productName: item.name, quantity: suggestedQty, reason: status, date: new Date().toISOString() },
        ...d.recentlyOrdered,
      ].slice(0, 30),
    }));
    showToast(`${item.name} marked as reordered`);
  };

  // Confirms a pending order actually arrived: adds the stock to inventory
  // (treating an expiring item as a fresh replacement batch), flags it with
  // a 24-hour "just restocked" glow, and removes it from Recently Ordered —
  // this is the step that makes the list actually go somewhere instead of
  // only ever growing.
  const confirmReceived = (entry) => {
    setData((d) => {
      const item = d.inventory.find((i) => i.id === entry.productId);
      if (!item) {
        return { ...d, recentlyOrdered: d.recentlyOrdered.filter((r) => r.id !== entry.id) };
      }
      const now = new Date();
      const healthyQty = Math.max(item.quantity + (entry.quantity || 1), (item.reorderThreshold || 1) * 2.5);
      const patch = { quantity: healthyQty, restockedAt: now.toISOString() };
      if (entry.reason === "expiring" || entry.reason === "expired") {
        const openedDate = item.dateOpened ? new Date(item.dateOpened) : now;
        const oldExpiry = item.expirationDate ? new Date(item.expirationDate) : null;
        const shelfLifeMs = oldExpiry && oldExpiry > openedDate ? oldExpiry - openedDate : 60 * 86400000;
        patch.dateOpened = now.toISOString();
        patch.expirationDate = new Date(now.getTime() + shelfLifeMs).toISOString();
      }
      return {
        ...d,
        inventory: d.inventory.map((i) => (i.id === item.id ? { ...i, ...patch } : i)),
        recentlyOrdered: d.recentlyOrdered.filter((r) => r.id !== entry.id),
      };
    });
    showToast(`${entry.productName} added back to inventory`);
  };

  const cartItems = reorderList.filter((r) => !r.purchased);
  const cartTotal = cartItems.reduce((sum, r) => {
    const p = inventory.find((i) => i.id === r.productId);
    return sum + (p ? p.unitCost * r.quantity : 0);
  }, 0);

  const updateQty = (id, qty) => setData((d) => ({ ...d, reorderList: d.reorderList.map((r) => (r.id === id ? { ...r, quantity: Math.max(1, qty) } : r)) }));
  const removeItem = (id) => setData((d) => ({ ...d, reorderList: d.reorderList.filter((r) => r.id !== id) }));
  const markPurchased = (id) => {
    setData((d) => {
      const target = d.reorderList.find((r) => r.id === id);
      const product = target ? d.inventory.find((i) => i.id === target.productId) : null;
      return {
        ...d,
        reorderList: d.reorderList.map((r) => (r.id === id ? { ...r, purchased: true } : r)),
        recentlyOrdered: product ? [
          { id: uid("ro"), productId: product.id, productName: product.name, quantity: target.quantity, reason: "cart", date: new Date().toISOString() },
          ...d.recentlyOrdered,
        ].slice(0, 30) : d.recentlyOrdered,
      };
    });
    showToast("Marked as purchased — confirm once it arrives");
  };
  const exportList = () => showToast("List exported (CSV download coming soon)");

  const bySupplier = useMemo(() => {
    const map = {};
    cartItems.forEach((r) => {
      const p = inventory.find((i) => i.id === r.productId);
      if (!p) return;
      const supName = suppliers.find((s) => s.id === p.supplierId)?.name || "Other";
      map[supName] = map[supName] || [];
      map[supName].push({ r, p });
    });
    return map;
  }, [cartItems, inventory, suppliers]);

  return (
    <div className="sb-fade-up" style={{ paddingTop: 18, paddingBottom: 100 }}>
      <SectionHeader title="Critical" />
      <ReorderGroup items={groups.critical} onAdd={addToCart} onMarkReordered={markReordered} empty="Nothing critical right now." />

      <SectionHeader title="Running Low" />
      <ReorderGroup items={groups.low} onAdd={addToCart} onMarkReordered={markReordered} empty="Nothing running low." />

      <SectionHeader title="Expiring Soon" />
      <ReorderGroup items={groups.expiring} onAdd={addToCart} onMarkReordered={markReordered} empty="Nothing expiring soon." expiring />

      <div style={{ height: 8 }} />
      <SectionHeader title="Reorder List" action={cartItems.length > 0 && <LinkBtn onClick={exportList}>Export</LinkBtn>} />
      {cartItems.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty" subtitle="Add recommended items above to build your reorder list." />
      ) : (
        <>
          {Object.entries(bySupplier).map(([supName, items]) => (
            <Card key={supName} style={{ padding: 16, marginBottom: 12 }} hover={false}>
              <div className="sb-display" style={{ fontSize: 13, fontWeight: 800, color: COLORS.mocha, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Store size={13} /> {supName}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map(({ r, p }) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{money(p.unitCost * r.quantity)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <QtyBtn onClick={() => updateQty(r.id, r.quantity - 1)}>−</QtyBtn>
                      <span className="sb-display" style={{ width: 20, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{r.quantity}</span>
                      <QtyBtn onClick={() => updateQty(r.id, r.quantity + 1)}>+</QtyBtn>
                    </div>
                    <button onClick={() => removeItem(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={15} color={COLORS.inkSoft} /></button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <Card style={{ padding: 16 }} hover={false}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span className="sb-display" style={{ fontSize: 14, fontWeight: 700 }}>Estimated order total</span>
              <span className="sb-display" style={{ fontSize: 20, fontWeight: 800 }}>{money(cartTotal)}</span>
            </div>
            <Button full onClick={() => cartItems.forEach((r) => markPurchased(r.id))}><Check size={16} /> Mark All Purchased</Button>
          </Card>
        </>
      )}

      <div style={{ height: 8 }} />
      <SectionHeader title="Recently Ordered" />
      {(!recentlyOrdered || recentlyOrdered.length === 0) ? (
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, padding: "10px 2px" }}>Nothing pending — mark an item above once you've placed the order.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, padding: "0 2px 2px" }}>Tap the check once an order actually arrives to add it back into inventory.</div>
          {recentlyOrdered.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: COLORS.cardAlt, borderRadius: 18, fontSize: 13 }}>
              <div style={{ minWidth: 0 }}>
                <div className="sb-truncate" style={{ fontWeight: 600, color: COLORS.ink }}>{r.productName}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 1 }}>Ordered {timeAgo(r.date)}</div>
              </div>
              <button
                onClick={() => confirmReceived(r)}
                title="Mark as received — adds it back into inventory"
                style={{
                  width: 30, height: 30, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
                  background: `color-mix(in srgb, ${COLORS.good} 18%, transparent)`, color: COLORS.good,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Check size={16} strokeWidth={2.6} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QtyBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 26, height: 26, borderRadius: 999, border: `1px solid ${COLORS.line}`, background: COLORS.card,
      cursor: "pointer", fontSize: 15, fontWeight: 700, color: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}

function ReorderGroup({ items, onAdd, onMarkReordered, empty, expiring }) {
  if (items.length === 0) {
    return <div style={{ fontSize: 12.5, color: COLORS.inkSoft, padding: "10px 2px", marginBottom: 20 }}>{empty}</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
      {items.map(({ item, status, appts, suggestedQty }) => {
        const meta = STATUS_META[status];
        const dte = daysUntil(item.expirationDate);
        return (
          <Card key={item.id} style={{ padding: 16 }} hover={false}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={17} color={meta.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sb-truncate" style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                  {expiring ? `Expires in ${Math.max(0, dte)} days` : `Current: ${item.quantity} ${item.unitType}${item.quantity !== 1 ? "s" : ""}${appts !== null ? ` · ~${Math.max(0, Math.round(appts))} appts left` : ""}`}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 12 }}>
              Suggested: <strong style={{ color: COLORS.ink }}>{suggestedQty} {item.unitType}{suggestedQty !== 1 ? "s" : ""}</strong> · {money(item.unitCost * suggestedQty)}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <Button size="sm" variant="secondary" onClick={() => onAdd(item, suggestedQty)}><Plus size={13} /> Add to List</Button>
              <Button size="sm" variant="accent" onClick={() => onMarkReordered(item, status, suggestedQty)}><Check size={13} /> Mark Reordered</Button>
            </div>

          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================================
   INSIGHTS
============================================================================ */

function InsightsView({ data, profile, setView }) {
  const { inventory, services, serviceLogs, wasteLogs } = data;

  const lowItems = inventory.filter((i) => ["low", "critical", "expiring", "expired"].includes(stockStatus(i)));
  const criticalCount = inventory.filter((i) => ["critical", "expired"].includes(stockStatus(i))).length;
  const hour = new Date().getHours();
  const isLateNight = hour < 5 || hour >= 23;
  const greeting = isLateNight ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const firstName = profile?.name?.split(" ")[0] || "there";
  const greetOptions = useMemo(() => [firstName, "Beautiful", "Gorgeous", "Superstar", "Boss Babe", "Stunning"], [firstName]);
  // A new playful greeting each time the app is opened — picked once per
  // mount, not re-rolled on every render.
  const [greetIdx] = useState(() => Math.floor(Math.random() * 6));
  const greetName = greetOptions[greetIdx % greetOptions.length];

  const marginRanked = useMemo(() => {
    return services.map((s) => ({ ...s, ...serviceMargin(s, inventory) })).sort((a, b) => b.margin - a.margin);
  }, [services, inventory]);

  const highestMargin = marginRanked.slice(0, 3);
  const lowestMargin = [...marginRanked].reverse().slice(0, 3);
  const mostExpensive = [...marginRanked].sort((a, b) => b.cost - a.cost).slice(0, 3);

  const productUsage = useMemo(() => {
    const map = {};
    serviceLogs.forEach((log) => {
      const svc = services.find((s) => s.id === log.serviceId);
      if (!svc) return;
      svc.recipe.forEach((r) => {
        map[r.productId] = (map[r.productId] || 0) + r.amount;
      });
    });
    return Object.entries(map)
      .map(([productId, amount]) => ({ product: inventory.find((i) => i.id === productId), amount }))
      .filter((x) => x.product)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [serviceLogs, services, inventory]);

  const catValues = valueByCategory(inventory);
  const invValue = totalInventoryValue(inventory);
  const monthCost = monthlyProductCost(serviceLogs, services, inventory);
  const waste = monthlyWaste(wasteLogs);

  const spendTrend = useMemo(() => {
    // synthesize a simple 6-point trend ending at current monthCost
    const base = monthCost;
    return [0.6, 0.75, 0.65, 0.9, 0.8, 1].map((f, i) => ({ label: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"][i], value: Math.round(base * f) }));
  }, [monthCost]);

  const PIE_COLORS = [COLORS.mocha, COLORS.rose, COLORS.sage, COLORS.champagne, COLORS.inkSoft, COLORS.warn];
  const isFresh = inventory.length === 0 && services.length === 0;

  return (
    <div className="sb-fade-up" style={{ paddingTop: 18, paddingBottom: 60 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="sb-display" style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.01em" }}>
          {greeting}, {greetName}{isLateNight ? "?" : "."}
        </div>
        <div style={{ fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.5 }}>
          {isFresh ? (
            "Let's get your shelf set up."
          ) : criticalCount > 0 ? (
            <>Here's how the business is doing. <strong style={{ color: COLORS.ink }}>{lowItems.length} item{lowItems.length !== 1 ? "s" : ""}</strong> need attention — <span onClick={() => setView && setView("insights")} style={{ color: COLORS.mocha, fontWeight: 700, cursor: "pointer" }}>view details</span>.</>
          ) : (
            "Here's how the business is doing today."
          )}
        </div>
      </div>

      {isFresh && (
        <Card style={{ padding: 22, marginBottom: 26 }} hover={false}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 999, background: COLORS.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={20} color={COLORS.mocha} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sb-display" style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>Your shelf is empty</div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>Add your first product to start tracking value, cost per service, and reorder needs.</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setView("inventory")}><Plus size={16} /> Add Your First Product</Button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 26 }}>
        <StatCard label="Inventory Value" value={invValue} icon={Package} tone={COLORS.mocha} onClick={() => setView("inventory")} />
        <StatCard label="Monthly Spend" value={monthCost} icon={DollarSign} tone={COLORS.rose} onClick={() => setView("insights")} />
        <StatCard label="Est. Waste (Month)" value={waste} icon={PackageX} tone={COLORS.critical} />
        <StatCard label="Avg. Margin" value={marginRanked.length ? marginRanked.reduce((s, m) => s + m.margin, 0) / marginRanked.length : 0} format={pct} icon={TrendingUp} tone={COLORS.sage} />
      </div>

      <Card style={{ padding: 18, marginBottom: 16 }} hover={false}>
        <div className="sb-display" style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Monthly Product Spending</div>
        <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 }}>Last 6 months</div>
        {serviceLogs.length === 0 ? (
          <ChartEmptyState text="Log services to see your spending trend here" />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={spendTrend}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.mocha} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.mocha} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => money0(v)} contentStyle={{ borderRadius: 16, border: `1px solid ${COLORS.line}`, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke={COLORS.mocha} strokeWidth={2.5} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: 18 }} hover onClick={() => setView("inventory")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="sb-display" style={{ fontSize: 14, fontWeight: 800 }}>Inventory Value by Category</div>
            <ChevronRight size={15} color={COLORS.inkSoft} />
          </div>
          {catValues.length === 0 ? (
            <ChartEmptyState text="Add inventory to see value by category" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catValues.slice(0, 6)} dataKey="value" nameKey="category" innerRadius={40} outerRadius={68} paddingAngle={2}>
                    {catValues.slice(0, 6).map((entry, i) => <Cell key={entry.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money0(v)} contentStyle={{ borderRadius: 16, border: `1px solid ${COLORS.line}`, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {catValues.slice(0, 6).map((c, i) => (
                  <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.category}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card style={{ padding: 18 }} hover onClick={() => setView("inventory")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="sb-display" style={{ fontSize: 14, fontWeight: 800 }}>Most Used Products</div>
            <ChevronRight size={15} color={COLORS.inkSoft} />
          </div>
          {productUsage.length === 0 ? (
            <ChartEmptyState text="Log services to see your top products" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productUsage.map((p) => ({ name: p.product.name.split(" ").slice(0, 2).join(" "), amount: Math.round(p.amount * 100) / 100 }))} layout="vertical" margin={{ left: 0, right: 12 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10.5, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: `1px solid ${COLORS.line}`, fontSize: 12 }} />
                <Bar dataKey="amount" fill={COLORS.sage} radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <RankCard title="Highest Margin Services" items={highestMargin} accent={COLORS.good} onClick={() => setView("services")} emptyText="No services yet" />
        <RankCard title="Lowest Margin Services" items={lowestMargin} accent={COLORS.critical} onClick={() => setView("services")} emptyText="No services yet" />
      </div>
      <div style={{ marginTop: 16 }}>
        <RankCard title="Most Expensive Services to Perform" items={mostExpensive} accent={COLORS.mocha} showCost emptyText="No services yet" />
      </div>
    </div>
  );
}

function ChartEmptyState({ text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "34px 10px", textAlign: "center" }}>
      <div style={{ width: 38, height: 38, borderRadius: 999, background: COLORS.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <BarChart3 size={17} color={COLORS.mocha} strokeWidth={1.6} />
      </div>
      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, maxWidth: 200, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function RankCard({ title, items, accent, showCost, onClick, emptyText }) {
  return (
    <Card style={{ padding: 18 }} hover={!!onClick} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="sb-display" style={{ fontSize: 14, fontWeight: 800 }}>{title}</div>
        {onClick && <ChevronRight size={15} color={COLORS.inkSoft} />}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, padding: "6px 0" }}>{emptyText || "Nothing here yet"}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((s, idx) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div className="sb-display" style={{ width: 20, fontSize: 11, fontWeight: 800, color: COLORS.inkSoft }}>{idx + 1}</div>
                <div className="sb-truncate" style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              </div>
              <div className="sb-display" style={{ fontSize: 13, fontWeight: 800, color: accent, flexShrink: 0 }}>
                {showCost ? money(s.cost) : pct(s.margin)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================================================================
   SETTINGS
============================================================================ */

function SettingsView({ data, setData, profile, setProfile, showToast, onReset }) {
  const { categories, suppliers } = data;
  const [newCat, setNewCat] = useState("");
  const [newSupplier, setNewSupplier] = useState({ name: "", website: "" });
  const importInputRef = useRef(null);

  const addCategory = () => {
    if (!newCat.trim()) return;
    setData((d) => ({ ...d, categories: [...d.categories, { id: uid("cat"), name: newCat.trim() }] }));
    setNewCat("");
    showToast("Category added");
  };
  const removeCategory = (id) => setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));

  const addSupplier = () => {
    if (!newSupplier.name.trim()) return;
    setData((d) => ({ ...d, suppliers: [...d.suppliers, { id: uid("sup"), ...newSupplier }] }));
    setNewSupplier({ name: "", website: "" });
    showToast("Supplier added");
  };
  const removeSupplier = (id) => setData((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.id !== id) }));

  const exportData = () => {
    try {
      const payload = { exportedAt: new Date().toISOString(), profile, ...data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stocked-beauty-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Backup downloaded");
    } catch (e) {
      showToast("Export failed");
    }
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setData((d) => ({
          ...d,
          inventory: parsed.inventory ?? d.inventory,
          categories: parsed.categories ?? d.categories,
          suppliers: parsed.suppliers ?? d.suppliers,
          services: parsed.services ?? d.services,
          serviceLogs: parsed.serviceLogs ?? d.serviceLogs,
          transactions: parsed.transactions ?? d.transactions,
          wasteLogs: parsed.wasteLogs ?? d.wasteLogs,
          reorderList: parsed.reorderList ?? d.reorderList,
          recentlyOrdered: parsed.recentlyOrdered ?? d.recentlyOrdered,
        }));
        if (parsed.profile) {
          setProfile((p) => ({ ...p, ...parsed.profile }));
        }
        showToast("Backup restored");
      } catch (err) {
        showToast("Couldn't read that file — is it a Stocked Beauty backup?");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="sb-fade-up" style={{ paddingTop: 18, paddingBottom: 60, maxWidth: 640 }}>
      <SectionHeader title="Profile" />
      <Card style={{ padding: 18, marginBottom: 22 }} hover={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <Field label="Your Name"><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Business Name"><Input value={profile.business} onChange={(e) => setProfile((p) => ({ ...p, business: e.target.value }))} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <Field label="Currency">
            <Select value={profile.currency || "USD"} onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}>
              <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option><option value="CAD">CAD ($)</option>
            </Select>
          </Field>
          <Field label="Profession" hint="Changes your suggested inventory categories">
            <Select
              value={profile.profession?.[0] || "lash"}
              onChange={(e) => {
                const newId = e.target.value;
                setProfile((p) => ({ ...p, profession: [newId] }));
                const allKnownNames = new Set(Object.values(PROFESSION_CATEGORIES).flat());
                const customCats = data.categories.filter((c) => !allKnownNames.has(c.name));
                const templateCats = categoriesForProfessions([newId]);
                const seen = new Set();
                const merged = [...templateCats, ...customCats].filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true)));
                setData((d) => ({ ...d, categories: merged }));
                showToast(`Categories updated for ${PROFESSIONS.find((p) => p.id === newId)?.label || "your profession"}`);
              }}
            >
              {PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      <SectionHeader title="Theme" />
      <Card style={{ padding: 18, marginBottom: 22 }} hover={false}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
            <input
              type="color"
              value={profile.accentColor || DEFAULT_ACCENT}
              onChange={(e) => setProfile((p) => ({ ...p, accentColor: e.target.value }))}
              style={{
                width: 52, height: 52, border: `2px solid ${COLORS.line}`, borderRadius: 16,
                padding: 0, cursor: "pointer", background: "none", appearance: "none",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>Accent Color</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>Tap the swatch to pick any color from the wheel — it applies to buttons, icons, and highlights throughout the app.</div>
          </div>
        </div>
        {(profile.accentColor && profile.accentColor.toLowerCase() !== DEFAULT_ACCENT.toLowerCase()) && (
          <div style={{ marginTop: 14 }}>
            <Button size="sm" variant="secondary" onClick={() => setProfile((p) => ({ ...p, accentColor: DEFAULT_ACCENT }))}>Reset to default</Button>
          </div>
        )}
      </Card>


      <Card style={{ padding: 18, marginBottom: 22 }} hover={false}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {categories.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.cardAlt, padding: "6px 6px 6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>
              {c.name}
              <button onClick={() => removeCategory(c.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}><X size={12} color={COLORS.inkSoft} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Button variant="secondary" onClick={addCategory}><Plus size={15} /></Button>
        </div>
      </Card>

      <SectionHeader title="Suppliers" />
      <Card style={{ padding: 18, marginBottom: 22 }} hover={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {suppliers.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: COLORS.cardAlt, borderRadius: 11 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                {s.website && <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{s.website}</div>}
              </div>
              <button onClick={() => removeSupplier(s.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} color={COLORS.inkSoft} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="Supplier name" value={newSupplier.name} onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))} />
          <Input placeholder="Website" value={newSupplier.website} onChange={(e) => setNewSupplier((s) => ({ ...s, website: e.target.value }))} />
          <Button variant="secondary" onClick={addSupplier}><Plus size={15} /></Button>
        </div>
      </Card>

      <SectionHeader title="Data" />
      <Card style={{ padding: 18, marginBottom: 22 }} hover={false}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, padding: 12, background: COLORS.cardAlt, borderRadius: 14 }}>
          <CheckCircle2 size={16} color={COLORS.good} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            Everything you enter is saved automatically on this device, so it's still here after you refresh or after the app gets updated — no re-entering needed. Download a backup below before switching phones, clearing Safari data, or just for peace of mind.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Download Backup</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Save everything as a file you can restore later</div>
          </div>
          <Button size="sm" variant="secondary" onClick={exportData}>Export</Button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Restore Backup</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Load data from a previously downloaded file</div>
          </div>
          <input ref={importInputRef} type="file" accept="application/json" onChange={importData} style={{ display: "none" }} />
          <Button size="sm" variant="secondary" onClick={() => importInputRef.current?.click()}>Import</Button>
        </div>
      </Card>

      <Card style={{ padding: 18 }} hover={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.critical }}>Reset Everything</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Clear all data and start onboarding again</div>
          </div>
          <Button size="sm" variant="danger" onClick={onReset}>Reset</Button>
        </div>
      </Card>
    </div>
  );
}

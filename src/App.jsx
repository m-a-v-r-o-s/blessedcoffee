import { useState, useEffect, useRef } from "react";
import Testimonials from "./components/Testimonials";


const LOGO = "/blessed-logo.webp";

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    nav: { home: "Home", menu: "Menu", findUs: "Find Us", joinUs: "Openings" },
    langBtn: "ΕΛ",
    callBtn: "Call Us",
    orderNow: "ORDER NOW",
    orderVia: "Or Order Via",
    viewMenu: "View Menu & Call Us",
    heroTagline: "",
    heroSub: "A taste of heaven in every cup.",
    testimonialTitle: "What Our Guests Say",
    testimonialSub: "Real reviews from real people",
    coffeePartnerLabel: "Our Coffee Partner",
    findUsTitle: "Find Us",
    findUsAddress: "Rodou 68, Athens 104 45",
    findUsHours: "Opening Hours",
    hours: ["Monday – Saturday: 06:00 – 22:00", "Sunday: 07:00 – 22:00"],
    menuTitle: "Our Menu",
    menuSub: "Fresh coffee grounds, crafted with love.",
    menuCTA: "Want to order? Call us!",
    menuCallBtn: "Call to Order",
    cats: { coffee: "Coffee", drinks: "Soft Drinks", pastries: "Pastries & Snacks", beer: "Beer" },
    joinTitle: "Join Our Team",
    joinSub: "We're always looking for passionate people to join the Blessed family.",
    openings: "Current Openings",
    applyTitle: "Apply Now",
    applyName: "Full Name",
    applyPhone: "Phone Number",
    applyPosition: "Position",
    applyPositionPlaceholder: "Select a position",
    applySubmit: "Send Application",
    applySuccess: "Thanks! We'll be in touch soon.",
    footerLeft: "© 2026 Blessed Coffee. All Rights Reserved.",
    footerRight: "© 2026 Akos Digital. All Rights Reserved.",
    positions: ["Barista", "Delivery Driver"],
    jobs: [
      { title: "Barista", desc: "We're looking for a passionate barista with experience in specialty coffee. Full or part-time available.", tags: ["Full-time", "Part-time", "Experience required"] },
      { title: "Delivery Driver", desc: "Reliable delivery driver needed for morning and evening shifts.", tags: ["Flexible hours", "Responsible Driver"] },
    ],
    reviews: [
      { name: "Martha Grigoriou. via Google Maps", stars: 5, text: "Nice coffee and something for cravings, it's a must, when accompanied by fast and polite service!", date: "3 months ago" },
      { name: "Mourati via Google Maps", stars: 5, text: "One of the best coffees I have tasted, very polite staff and very helpful, flexible space inside and outside for those who are smokers. I would recommend it to everyone who wants to sit down for coffee in the square.", date: "1 year ago" },
      { name: "Blackoni Chris via Google Maps", stars: 5, text: "The only shop I saw in the delivery shop they send you a glass of ice for the energy drink. I won't say anything else, bravo to the enthusiasts who have an appetite for work and love what they do.", date: "11 months ago" },
      { name: "Ninaki Euangelou via Google Maps", stars: 5, text: "The guys are amazing, very teamy in all shifts, very helpful and direct! clean, well-groomed, delicious, the coffee is awesome and in terms of quality and technique! Thank you very much for the enjoyment!", date: "1 month ago" },
      { name: "Κορλεονε Γλυνος. via Google Maps", stars: 5, text: "Congratulations excellent coffee guys well done I had a long time to enjoy coffee like this! I happened to order through a platform and I was very satisfied 🙏🏻💙", date: "3 months ago" },
    ],
  },
  gr: {
    nav: { home: "Αρχικη", menu: "Μενου", findUs: "Βρειτε μας", joinUs: "Θεσεις εργασιας" },
    langBtn: "EN",
    callBtn: "Καλέστε μας",
    orderNow: "ΠΑΡΑΓΓΕΙΛΕ ΤΩΡΑ",
    orderVia: "Ή Μέσω",
    viewMenu: "Δειτε το Μενου & Καλεστε μας",
    heroTagline: "",
    heroSub: "Παραδεισένια γεύση σε κάθε ποτήρι.",
    testimonialTitle: "Τι λένε οι πελάτες μας",
    testimonialSub: "Αληθινες κριτικες από αληθινους ανθρωπους",
    coffeePartnerLabel: "ΣΥΝΕΡΓΑΤΗΣ ΚΑΦΕ",
    findUsTitle: "Βρείτε μας",
    findUsAddress: "Ρόδου 68, Αθήνα 104 45",
    findUsHours: "Ωραριο λειτουργιας",
    hours: ["Δευτέρα – Σάββατο: 06:00 – 22:00", "Κυριακή: 07:00 – 22:00"],
    menuTitle: "Το Μενού μας",
    menuSub: "Φρέσκα υλικά και μεράκι.",
    menuCTA: "Θέλετε να παραγγείλετε; Καλέστε μας!",
    menuCallBtn: "Τηλεφωνικη παραγγελια",
    cats: { coffee: "Καφές", drinks: "Αναψυκτικά", pastries: "Σνακ & Γλυκά", beer: "Μπύρες" },
    joinTitle: "Γίνε μέλος της ομάδας",
    joinSub: "Ψάχνουμε πάντα παθιασμένους ανθρώπους για την οικογένεια του Blessed.",
    openings: "Ανοιχτες θεσεις",
    applyTitle: "Κάνε αίτηση",
    applyName: "Ονοματεπώνυμο",
    applyPhone: "Τηλέφωνο",
    applyPosition: "Θέση",
    applyPositionPlaceholder: "Επίλεξε θέση",
    applySubmit: "Αποστολή αίτησης",
    applySuccess: "Ευχαριστούμε! Θα επικοινωνήσουμε σύντομα.",
    footerLeft: "© 2026 Blessed Coffee. Με επιφύλαξη παντός δικαιώματος.",
    footerRight: "© 2026 Akos Digital. Με επιφύλαξη παντός δικαιώματος.",
    positions: ["Barista", "Διανομέας"],
    jobs: [
      { title: "Barista", desc: "Ζητάμε barista με πάθος για τον specialty καφέ. Πλήρης ή μερική απασχόληση.", tags: ["Πληρης", "Μερικη", "Απαιτειται εμπειρια"] },
      { title: "Διανομέας", desc: "Αναζητούμε διανομέα για πρωινές και βραδινές βάρδιες.", tags: ["Ευελικτο ωραριο", "Υπευθυνος Οδηγος"] },
    ],
    reviews: [
      { name: "Martha Grigoriou μεσω Google Maps", stars: 5, text: "Ωραίος καφες και κατι για την λιγούρα,ειναι οτι πρεπει,οταν συνοδεύεται απο γρήγορη και ευγενική εξυπηρετηση!", date: "3 μήνες πριν" },
      { name: "Mourati μεσω Google Maps", stars: 5, text: "Απ τους καλύτερους καφέδες που έχω δοκιμάσει, ευγενέστατο προσωπικό και πολύ εξυπηρετικό, ευέλικτος χωρος μεσα και εξω για όσους είναι καπνιστές. Θα το πρότεινα σε όλους όσους θέλουν να κάτσουν για καφέ στην πλατεία", date: "1 χρόνος πριν" },
      { name: "Blackoni Chris μεσω Google Maps", stars: 5, text: "Το μοναδικό μαγαζί που είδα στο ντελίβερι να σου στέλνουν ποτηράκι με πάγο για το energy drink. Δεν θα πω κάτι άλλο, μπράβο στους μερακλήδες που έχουν όρεξη για δουλειά και αγαπάνε αυτό που κάνουν.", date: "11 μήνες πριν" },
     { name: "Ninaki Euangelou μεσω Google Maps", stars: 5, text: "Τα παιδιά είναι καταπληκτικά, πολύ ομαδικά σε όλες τις βάρδιες, εξυπηρετικότατα κ αμεσότατα! καθαρα, περιποιημενα, νοστιμα, ο καφές φοβερός κ από ποιότητα κ από τεχνική! Ευχαριστούμε πολύ για την απόλαυση!", date: "1 μήνας πριν" },
      { name: "Κορλεονε Γλυνος μεσω Google Maps", stars: 5, text: "Συγχαρητήρια εξαιρετικός καφές παιδιά μπράβο σας είχα καιρό να απολαύσω έτσι καφέ! Έτυχε να παραγγείλω μέσω πλατφόρμας και έμεινα πολύ ικανοποιημένος 🙏🏻💙", date: "3 μήνες πpιν" },
    ],
  },
};

// ─── MENU DATA ────────────────────────────────────────────────────────────────
const MENU = {
  coffee: [
    { name: "Freddo Espresso", prices: ["2.3€", "2.2€"] },
    { name: "Freddo Cappuccino", prices: ["2.6€", "2.5€"] },
    { name: "Cappuccino Latte", prices: ["2.6€", "2.5€"] },
    { name: "Cappuccino", prices: ["2.6€", "2.5€"] },
    { name: "Espresso", prices: ["1.8€", "1.7€"] },
    { name: "Macchiato", prices: ["2.1€", "2.1€"] },
    { name: "Frappe", prices: ["1.8€", "—"] },
    { name: "NES", prices: ["1.8€", "—"] },
    { name: "Φιλτρου", prices: ["2€", "—"] },
    { name: "Ελληνικός", prices: ["1.8€", "—"] },
    { name: "Americano", prices: ["2€", "—"] },
  ],
  drinks: [
    { name: "Coca Cola Κουτί 330ml", price: "1.5€" },
    { name: "Λούξ", price: "1.5€" },
    { name: "Monster", price: "2.5€" },
    { name: "Amita", price: "1.4€" },
    { name: "Amita Motion", price: "1.8€" },
    { name: "Hell", price: "1.5€" },
    { name: "Redbull", price: "2.5€" },
    { name: "Σόδα Schweppes Κουτί 330ml", price: "1.5€" },
    { name: "Sprite Κουτί 330ml", price: "1.5€" },
    { name: "Fanta 330ml", price: "1.5€" },
    { name: "Τσαι Λεμόνι", price: "1.5€" },
    { name: "Τσαι Ροδακινο", price: "1.5€" },
    { name: "Νερό", price: "0.5€" },
  ],
  pastries: [
    { name: "Τυρόπιτα", price: "1.9€" },
    { name: "Σπανακόπιτα", price: "1.6€" },
    { name: "Τυρόπιτα Κουρού", price: "2.5€" },
    { name: "Φλογέρα Φιλαδέλφεια", price: "2.8€" },
    { name: "Μπουγάτσα Κρέμα", price: "2.8€" },
    { name: "Λουκανικόπιτα", price: "2.5€" },
    { name: "Κρουασάν", price: "2.5€" },
    { name: "Πεινιπάι", price: "2.9€" },
    { name: "Ζαμπονοτυρόπιτα", price: "2.8€" },
    { name: "Πίτσα", price: "2.8€" },
    { name: "Σπανακόπιτα με Τυρί", price: "2.5€" },
    { name: "Banoffee 80gr", price: "2.7€" },
    { name: "Tarta Cookies 100gr", price: "2.7€" },
    { name: "Μιλφέι Πραλίνα με Καζούζα & Σπόρτα 60gr", price: "2.5€" },
    { name: "Mini Soft Cookies Βανίλια 100gr", price: "2.7€" },
    { name: "Mini Brownies Σοκολάτα 100gr", price: "2.7€" },
    { name: "Mini Τρουφετάκια Φουντούκι 100gr", price: "2.7€" },
    { name: "Mini Τρουφετάκια Σοκολάτας 100gr", price: "2.7€" },
    { name: "Cheesecake", price: "2.9€" },
    { name: "Banoffee", price: "2.9€" },
    { name: "Προφιτερόλ", price: "2.9€" },
    { name: "Sweet Dubai", price: "3.2€" },
    { name: "Black Forest", price: "3.2€" },
  ],
  beer: [
    
    { name: "Amstel", prices: ["4.€", "3.€"] },
    { name: "Alfa", prices: ["4.€", "3€"] },
    { name: "Heineken", prices: ["4.€", "3.5€"] },
    { name: "Corona", prices: ["4.€", "3.5€"] },
    { name: "Kaiser", prices: ["4.€", "3.5€"] },
    { name: "Fischer", prices: ["4.€", "3.5€"] },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Stars = ({ n }) => "★".repeat(n) + "☆".repeat(5 - n);

export default function BlessedCoffee() {
  const [lang, setLang] = useState(() => localStorage.getItem("bc_lang") || "en");
  const [page, setPage] = useState("home");
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewPaused, setReviewPaused] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", position: "" });
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timerRef = useRef(null);
  const t = T[lang];

  // Language persistence
  useEffect(() => { localStorage.setItem("bc_lang", lang); }, [lang]);

  // Background slideshow
 

  // Auto-rotate reviews


  const goReview = (i) => {
    setReviewIdx(i);
    setReviewPaused(true);
  };

  const navigate = (p) => {
    setPage(p);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.position) return;
    setSubmitted(true);
  };

  const warmPalette = {
    cream: "#FAF6F0",
    tan: "#E8DDD0",
    brown: "#6B4C35",
    darkBrown: "#3D2B1F",
    gold: "#C9972A",
    text: "#2C1A0E",
    muted: "#8A7060",
    white: "#FFFFFF",
  };

const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Barlow Semi Condensed', sans-serif; background: ${warmPalette.cream}; color: ${warmPalette.text}; }

    .nav-link {
      font-family: 'Barlow Semi Condensed', sans-serif;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${warmPalette.darkBrown};
      cursor: pointer;
      padding: 6px 2px;
      position: relative;
      transition: color 0.2s;
      background: none; border: none;
    }
    .nav-link::after {
      content: '';
      position: absolute; bottom: 0; left: 0;
      width: 0; height: 2px;
      background: #fff;
      transition: width 0.25s;
    }
    .nav-link:hover::after, .nav-link.active::after { width: 100%; }
    .nav-link:hover, .nav-link.active { color: #fff; }

    .btn-gold {
      background: ${warmPalette.gold};
      color: ${warmPalette.white};
      border: none;
      padding: 13px 28px;
      font-family: 'Barlow Semi Condensed', sans-serif;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      text-decoration: none;
      display: inline-block;
    }
    .btn-gold:hover { background: ${warmPalette.brown}; transform: translateY(-2px); }

    .btn-outline {
      background: transparent;
      color: ${warmPalette.darkBrown};
      border: 2px solid ${warmPalette.darkBrown};
      padding: 11px 26px;
      font-family: 'Barlow Semi Condensed', sans-serif;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    .btn-outline:hover { background: ${warmPalette.darkBrown}; color: #fff; }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(32px, 5vw, 54px);
      font-weight: 700;
      color: ${warmPalette.darkBrown};
      line-height: 1.1;
    }

    .platform-btn {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      height: 44px;
      transition: all 0.22s ease;
      border-radius: 3px;
      text-decoration: none;
    }
    .platform-btn:hover {
      background: rgba(255,255,255,0.14);
      border-color: ${warmPalette.gold};
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    .menu-cta-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 54px;
      background: ${warmPalette.gold};
      border: none;
      color: #fff;
      font-family: 'Barlow Semi Condensed', sans-serif;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.22s ease;
      border-radius: 3px;
    }
    .menu-cta-btn:hover {
      background: ${warmPalette.brown};
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(0,0,0,0.35);
    }

    .review-card {
      background: ${warmPalette.white};
      border: 1.5px solid ${warmPalette.tan};
      padding: 40px 48px;
      max-width: 680px;
      margin: 0 auto;
      text-align: center;
      position: relative;
    }

    .menu-item-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 10px 0;
      border-bottom: 1px dotted ${warmPalette.tan};
      font-size: 14px;
    }
    .menu-item-row:last-child { border-bottom: none; }

    .menu-cat-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: ${warmPalette.brown};
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${warmPalette.gold};
      display: inline-block;
    }

    .job-card {
      background: ${warmPalette.white};
      border: 1.5px solid ${warmPalette.tan};
      padding: 28px 32px;
      transition: box-shadow 0.2s;
    }
    .job-card:hover { box-shadow: 0 8px 32px rgba(61,43,31,0.1); }

    .tag {
      display: inline-block;
      background: ${warmPalette.tan};
      color: ${warmPalette.brown};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 10px;
      margin: 3px 3px 3px 0;
    }

    .form-input {
      width: 100%;
      background: ${warmPalette.white};
      border: 1.5px solid ${warmPalette.tan};
      padding: 13px 16px;
      font-family: 'Barlow Semi Condensed', sans-serif;
      font-size: 14px;
      color: ${warmPalette.text};
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus { border-color: ${warmPalette.gold}; }

    .divider-ornament {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 0 auto;
      max-width: 300px;
    }
    .divider-ornament::before, .divider-ornament::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${warmPalette.tan};
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in { animation: fadeIn 0.5s ease forwards; }

    .texture-bg {
      background-image:
        radial-gradient(circle at 20% 50%, rgba(201,151,42,0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(107,76,53,0.05) 0%, transparent 40%);
    }

    :root { --slide-cols: 1fr 1fr 1fr; }

    @media (max-width: 768px) {
      :root { --slide-cols: 1fr 1fr; }
      .nav-desktop { display: none !important; }
      .mobile-menu-btn { display: flex !important; }
      .call-desktop { display: none !important; }
      .order-cards-grid { flex-direction: column; align-items: stretch; }
      .review-card { padding: 28px 24px; }
      .find-grid { grid-template-columns: 1fr !important; }
    }
    @media (min-width: 769px) {
      .mobile-menu-btn { display: none !important; }
    }
  `;

  const review = t.reviews[reviewIdx];

 // ── HEADER ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",   label: t.nav.home },
  { id: "menu",   label: t.nav.menu },
  { id: "findus", label: t.nav.findUs, scroll: true },
  { id: "joinus", label: t.nav.joinUs },
];

const navBtnStyle = {
  background: "none", border: "none", cursor: "pointer",
  fontFamily: "'Barlow Semi Condensed', sans-serif",
  fontWeight: 700, fontSize: 12, letterSpacing: "0.15em",
  color: "#ccc", transition: "color 0.2s", textAlign: "left",
};

const handleNavClick = (item) => {
  if (item.scroll) {
    navigate("home");
    setTimeout(() => document.getElementById("findus")?.scrollIntoView({ behavior: "smooth" }), 100);
  } else {
    navigate(item.id);
  }
};

const Header = () => (
  <header style={{ background: "#000", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #222" }}>
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>

      {/* LEFT: desktop nav OR mobile hamburger */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <nav className="nav-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} style={navBtnStyle}
              onClick={() => handleNavClick(item)}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "none" }}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* CENTER LOGO */}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", cursor: "pointer", top: 1 }} onClick={() => navigate("home")}>
        <img src={LOGO} alt="Blessed Coffee" style={{ height: 150, width: "auto", objectFit: "contain" }} />
      </div>

      {/* RIGHT: Instagram + Facebook always visible, Call desktop-only, Language always visible */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

        <a href="https://www.instagram.com/blessedcoffee2024/" target="_blank" rel="noreferrer"
          style={{ color: "#ccc", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </a>

        <a href="https://www.facebook.com/profile.php?id=61569255849766" target="_blank" rel="noreferrer"
          style={{ color: "#ccc", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        </a>

        <a href="tel:+302112181815" className="call-desktop" style={{ textDecoration: "none" }}>
          <button
            style={{ padding: "8px 16px", fontSize: 11, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.15em", background: "#333", border: "1px solid #555", color: "#fff", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#444"; e.currentTarget.style.borderColor = "#777"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#333"; e.currentTarget.style.borderColor = "#555"; }}
          >
            {t.callBtn}
          </button>
        </a>

        <button
          onClick={() => setLang(l => l === "en" ? "gr" : "en")}
          style={{ background: "#333", border: "1px solid #555", padding: "7px 13px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", cursor: "pointer", color: "#fff", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#444"; e.currentTarget.style.borderColor = "#777"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#333"; e.currentTarget.style.borderColor = "#555"; }}
        >
          {t.langBtn}
        </button>
      </div>
    </div>

    {/* MOBILE DROPDOWN */}
    {mobileMenuOpen && (
      <div style={{ background: "#111", borderTop: "1px solid #222", padding: "8px 0 16px" }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            onClick={() => handleNavClick(item)}
            style={{ ...navBtnStyle, display: "block", width: "100%", padding: "12px 24px", fontSize: 13, borderBottom: "1px solid #1a1a1a" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#1a1a1a"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.background = "transparent"; }}
          >
            {item.label}
          </button>
        ))}
      </div>
    )}
  </header>
);

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const Footer = () => (
    <footer style={{ background: "#000000", color: warmPalette.tan, padding: "24px 24px", borderTop: `3px solid ${warmPalette.gold}` }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, letterSpacing: "0.12em" }}>{t.footerLeft}</p>
        <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, letterSpacing: "0.12em" }}>{t.footerRight}</p>
      </div>
    </footer>
  );

  // ── HOME PAGE ────────────────────────────────────────────────────────────────
  const HomePage = () => (
    <div>
      {/* HERO */}
      <section className="texture-bg" style={{ minHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px", position: "relative", overflow: "hidden", background: "#000" }}>

        {/* Static background image */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/background.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          filter: "brightness(0.55)"
        }} />

        {/* Top edge gradient — covers white panel borders baked into the image */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 90,
          background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          zIndex: 1,
          pointerEvents: "none"
        }} />

        

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
          <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 300, fontSize: 13, letterSpacing: "0.4em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 28 }}>
            {t.heroTagline}
          </p>
          
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(20px, 4.5vw, 58px)", color: "#fff", whiteSpace: "nowrap", lineHeight: 1.3, letterSpacing: "0.01em", marginTop: "1em", marginBottom: 48 }}>
            {t.heroSub}
          </p>
          <div style={{ marginTop: 280, marginBottom: 5, width: "100%", maxWidth: 400, margin: "210px auto 5px" }}>

            {/* Primary CTA */}
            <button className="menu-cta-btn" onClick={() => navigate("menu")} style={{ marginBottom: 10 }}>
              {t.viewMenu}
            </button>

            {/* Delivery platforms */}
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 400, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#fff", marginBottom: 8, textAlign: "center" }}>{t.orderVia}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <a href="https://www.e-food.gr/delivery/athina/blessed-coffee-kai-coctails-7652934" target="_blank" rel="noreferrer" className="platform-btn">
                <img src="/efood-logo.webp" alt="e-food" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </a>
              <a href="https://wolt.com/en/grc/athens/restaurant/blessed-coffee-ro-do" target="_blank" rel="noreferrer" className="platform-btn">
                <img src="/wolt-logo.webp" alt="Wolt" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </a>
              <a href="https://box.gr/delivery/kato-patisia/blessed-coffee-and-spirits" target="_blank" rel="noreferrer" className="platform-btn" style={{ background: "#0d1117", borderColor: "rgba(255,255,255,0.18)" }}>
                <img src="/box-logo.png" alt="Box" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      

      
         <Testimonials t={t} />

      {/* MRS ROSE PARTNERSHIP */}
      <section style={{ padding: "60px 24px", background: warmPalette.tan, borderTop: `1px solid ${warmPalette.tan}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontFamily: "'Barlow Semi Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: warmPalette.muted,
            marginBottom: 28
          }}>
            {t.coffeePartnerLabel}
          </p>
          <img
            src="/mrsrose.webp"
            alt="Mrs. Rose Caffè"
            loading="lazy"
            style={{
              height: 140,
              width: "auto",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
              mixBlendMode: "multiply"
            }}
          />
        </div>
      </section>

      {/* FIND US */}
      <section id="findus" style={{ padding: "100px 24px", background: warmPalette.cream }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 12 }}></p>
            <h2 className="section-title">{t.findUsTitle}</h2>
          </div>
          <div className="find-grid" style={{
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 60,
  alignItems: "center",
  justifyItems: "center"
}}>

            {/* Map */}
            <div style={{ border: `2px solid ${warmPalette.tan}`, overflow: "hidden", height: 380 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3143.848258999412!2d23.72437279554395!3d38.00399970171721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1a2d0879e2663%3A0xae1b9a8dccbf3a7e!2zzqHPjM60zr_PhSA2OCwgzpHOuM6uzr3OsSAxMDQgNDU!5e0!3m2!1sel!2sgr!4v1779614962924!5m2!1sel!2sgr"
                width="100%" height="100%" style={{ border: 0 }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Blessed Coffee location"  
              />
            </div>
            {/* Info */}
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 8 }}>Address</p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: warmPalette.darkBrown }}>{t.findUsAddress}</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 12 }}>{t.findUsHours}</p>
                  {t.hours.map((h, i) => (
                    <p key={i} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 15, color: warmPalette.text, lineHeight: 2 }}>{h}</p>
                  ))}
                </div>
                <div>
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 8 }}>Phone</p>
                  <a href="tel:+302112181815" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 16, color: warmPalette.darkBrown, textDecoration: "none", display: "block" }}>211 218 1815</a>
                  <a href="tel:+306932917800" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 16, color: warmPalette.darkBrown, textDecoration: "none" }}>693 291 7800</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // ── MENU PAGE (Dark Theme) ───────────────────────────────────────────────────
const MenuPage = () => {

  const dark = {
    bg: "#000",
    card: "#111",
    border: "#333",
    text: "#fff",
    textSoft: "#ccc",
    accent: "#888"
  };

  return (
    <div style={{ padding: "80px 24px", background: dark.bg }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p style={{
            fontFamily: "'Barlow Semi Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: dark.textSoft,
            marginBottom: 12
          }}>
            Blessed Coffee
          </p>

          <h1 className="section-title" style={{ marginBottom: 10, color: dark.text }}>
            {t.menuTitle}
          </h1>

          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            color: dark.accent,
            fontSize: 17,
            marginBottom: 40
          }}>
            {t.menuSub}
          </p>
        </div>

        {/* CTA Banner */}
        <div style={{
          background: dark.card,
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 60,
          border: `1px solid ${dark.border}`
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            color: dark.textSoft,
            fontSize: 18
          }}>
            {t.menuCTA}
          </p>

          <a href="tel:+302112181815" className="btn-gold">
            {t.menuCallBtn} · 211 218 1815
          </a>
        </div>

        {/* COFFEE (unchanged) */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>{t.cats.coffee}</span>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "0 40px"
          }}>
            <div style={{
              gridColumn: "1/-1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 40,
              paddingBottom: 6,
              marginBottom: 4,
              borderBottom: `1px solid ${dark.border}`
            }}>
              <span style={{
                fontFamily: "'Barlow Semi Condensed', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: dark.textSoft
              }}>MRS ROSE</span>

              <span style={{
                fontFamily: "'Barlow Semi Condensed', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: dark.textSoft
              }}>DOLCE</span>
            </div>

            {MENU.coffee.map((item, i) => (
              <div key={i} className="menu-item-row">
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", color: dark.text }}>{item.name}</span>
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, color: dark.textSoft }}>
                  {item.prices[0]} / {item.prices[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DRINKS */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>{t.cats.drinks}</span>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "0 40px"
          }}>
            {MENU.drinks.map((item, i) => (
              <div key={i} className="menu-item-row">
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", color: dark.text }}>{item.name}</span>
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, color: dark.textSoft }}>{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BEER */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>{t.cats.beer}</span>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "0 40px"
          }}>
            <div style={{
              gridColumn: "1/-1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 40,
              paddingBottom: 6,
              marginBottom: 4,
              borderBottom: `1px solid ${dark.border}`
            }}>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: dark.textSoft }}>Τραπέζι</span>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: dark.textSoft }}>Take Away</span>
            </div>

            {MENU.beer.map((item, i) => (
              <div key={i} className="menu-item-row">
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", color: dark.text }}>{item.name}</span>
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, color: dark.textSoft }}>
                  {item.prices[0]} / {item.prices[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* NEW SECTIONS BELOW */}
        {/* ───────────────────────────────────────────── */}

        {/* COCKTAILS */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>Cocktails</span>

          {[
            "Zombie",
            "Daquiri",
            "Pornstar",
            "Mojito",
            "Cucumber Basil",
            "Bubble Blessed"
          ].map((name, i) => (
            <div key={i} className="menu-item-row">
              <span style={{ color: dark.text }}>{name}</span>
              <span style={{ fontWeight: 700, color: dark.textSoft }}>6€</span>
            </div>
          ))}
        </div>

        {/* PROTEIN BARS */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>Protein Bars</span>

          {[
            "Σοκολάτα Γαλακτός 40GR",
            "Σοκολάτα - Μπισκότο 40GR",
            "Μαύρη Σοκολάτα 40GR"
          ].map((name, i) => (
            <div key={i} className="menu-item-row">
              <span style={{ color: dark.text }}>{name}</span>
              <span style={{ fontWeight: 700, color: dark.textSoft }}>1.8€</span>
            </div>
          ))}
        </div>

        {/* SANDWICHES */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>Sandwiches</span>

          {[
            ["Γαλλική μπαγκέτα φιλέτο κοτόπουλο", "2.9€"],
            ["Γαλλική μπαγκέτα γαλοπούλα", "2.6€"],
            ["Μπαγκέτα σικάλεως γαλοπούλα", "2.6€"],
            ["Βιεννέζικο με ζαμπόν", "2.9€"],
            ["Αραβική με ζαμπόν", "2.7€"],
            ["Αραβική με γαλοπούλα", "2.7€"],
            ["Αραβική με κοτόπουλο", "2.9€"],
            ["Χάμπουργκερ με μπιφτέκι", "3€"],
            ["Τριπλό τοστ σικάλεως", "3€"]
          ].map(([name, price], i) => (
            <div key={i} className="menu-item-row">
              <span style={{ color: dark.text }}>{name}</span>
              <span style={{ fontWeight: 700, color: dark.textSoft }}>{price}</span>
            </div>
          ))}
        </div>

        {/* RED ALMOND SWEETS */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>Γλυκά Snacks (Red Almond)</span>

          {[
            ["Τάρτα Cookies 100γρ", "2.7€"],
            ["Τάρτα Banoffee 80γρ", "2.7€"],
            ["Τάρτα Πραλίνα Φουντουκιού 100γρ", "2.7€"],
            ["Μπάρα Ενέργειας με Καρύδι & Φρούτα 60γρ", "2.5€"],
            ["Μπάρα Σοκολάτας με Φουντούκια 60γρ", "2.5€"],
            ["Mini Soft Cookies Βανίλια με Κομμάτια Σοκολάτας 100γρ", "2.7€"],
            ["Mini Brownies Σοκολάτα 100γρ", "2.7€"],
            ["Mini Γκοφρετάκια 100γρ", "2.7€"],
            ["Mini Γκοφρετάκια Φράουλα 100γρ", "2.7€"],
            ["Κριτσινοκούλουρο Ηλιόσπορος 100γρ", "2.7€"],
            ["Κριτσινάκι με Επικάλυψη Σοκολάτας", "2.7€"]
          ].map(([name, price], i) => (
            <div key={i} className="menu-item-row">
              <span style={{ color: dark.text }}>{name}</span>
              <span style={{ fontWeight: 700, color: dark.textSoft }}>{price}</span>
            </div>
          ))}
        </div>

        {/* ZAGKAS SWEETS */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>Γλυκά (Ζάγκας)</span>

          {[
            ["Banoffee", "2.9€"],
            ["Cheesecake", "2.9€"],
            ["Προφιτερόλ", "2.9€"],
            ["Sweet Dubai", "3.2€"],
            ["Black Forest", "3.2€"]
          ].map(([name, price], i) => (
            <div key={i} className="menu-item-row">
              <span style={{ color: dark.text }}>{name}</span>
              <span style={{ fontWeight: 700, color: dark.textSoft }}>{price}</span>
            </div>
          ))}
        </div>

        {/* SFOGLIATES */}
        <div style={{ marginBottom: 56 }}>
          <span className="menu-cat-title" style={{ color: dark.text }}>Σφολιάτες</span>

          {[
            ["Τυρόπιτα", "1.6€"],
            ["Τυρόπιτα Κουρού", "1.9€"],
            ["Φλογέρα Philadelphia", "2.8€"],
            ["Μπουγάτσα Κρέμα", "2.8€"],
            ["Πίτσα", "2.8€"],
            ["Ζαμπονοτυρόπιτα", "2.9€"],
            ["Πεϊνιρλί", "2.8€"],
            ["Κρουασάν", "2.5€"],
            ["Λουκανικόπιτα", "2.5€"],
            ["Σπανακόπιτα με Τυρί", "2.5€"]
          ].map(([name, price], i) => (
            <div key={i} className="menu-item-row">
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", color: dark.text }}>{name}</span>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, color: dark.textSoft }}>{price}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};


  // ── JOIN US PAGE ─────────────────────────────────────────────────────────────
  const JoinUsPage = () => (
    <div style={{ padding: "80px 24px", background: warmPalette.cream }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 12 }}>We're Hiring</p>
          <h1 className="section-title" style={{ marginBottom: 12 }}>{t.joinTitle}</h1>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: warmPalette.muted, fontSize: 18 }}>{t.joinSub}</p>
        </div>

        {/* Job openings */}
        <h2 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.25em", textTransform: "uppercase", color: warmPalette.gold, marginBottom: 20 }}>{t.openings}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 60 }}>
          {t.jobs.map((job, i) => (
            <div key={i} className="job-card">
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: warmPalette.darkBrown, marginBottom: 10 }}>{job.title}</h3>
              <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 15, color: warmPalette.muted, lineHeight: 1.7, marginBottom: 14 }}>{job.desc}</p>
              <div>{job.tags.map((tag, j) => <span key={j} className="tag">{tag}</span>)}</div>
            </div>
          ))}
        </div>

       {/* Contact */}
<div style={{ background: warmPalette.tan, padding: "48px 40px", textAlign: "center" }}>
  <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 20, color: warmPalette.darkBrown, marginBottom: 28 }}>
    {lang === "en" ? "Interested? Reach out to us directly!" : "Ενδιαφέρεσαι; Επικοινώνησε μαζί μας!"}
  </p>
  <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
    <a href="tel:+302112181815" className="btn-gold">📞 211 218 1815</a>
    <a href="tel:+306932917800" className="btn-outline">📞 693 291 7800</a>
  </div>
</div>
      </div>
    </div>
  );

  return (
    <div>
      <style>{css}</style>
      <Header />
      <main>
        {page === "home" && <HomePage />}
        {page === "menu" && <MenuPage />}
        {page === "joinus" && <JoinUsPage />}
      </main>
      <Footer />
    </div>
  );
}

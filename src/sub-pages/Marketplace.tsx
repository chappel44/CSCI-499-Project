import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase-client";

// ─── Types ────────────────────────────────────────────────────
type Condition = "New" | "Used";
type SortKey   = "newest" | "price-asc" | "price-desc" | "saves";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: Condition;
  images: string[];
  seller_name: string | null;
  verified: boolean;
  sold: boolean;
  created_at: string;
  save_count?: number;
  stock: number; // available quantity; 1 = one unit only, 2 = two available
}

interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  listing_id: string;
  other_user_id: string;
  other_username: string;
  listing_title: string;
  last_message: string;
  last_at: string;
  unread: number;
}

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "All"         },
  { id: "electronics", label: "Electronics" },
  { id: "fashion",     label: "Fashion"     },
  { id: "jewellery",   label: "Jewellery"   },
  { id: "sports",      label: "Sports"      },
];

const GRAD = "linear-gradient(135deg,#00AAFF,#6B30FF)";

const COND: Record<Condition, { bg: string; color: string }> = {
  "New":  { bg: "rgba(16,185,129,0.12)",  color: "rgb(5,150,105)"  },
  "Used": { bg: "rgba(245,158,11,0.12)",  color: "rgb(180,110,0)"  },
};

// Fake deals-completed counts per seller
const SELLER_DEALS: Record<string, number> = {
  Bob: 47, Jack: 83, Axel: 31, Chris: 12, Ryan: 64,
  Luca: 29, Finn: 8, Omar: 55, Noah: 102, Eli: 19,
};

const t = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const MOCK_LISTINGS: Listing[] = [
  // Electronics
  { id:"e1",  user_id:"mock", title:"Apple MacBook Pro 16-inch M3 Pro – Space Black",     price:2199.99, category:"electronics", condition:"Used", seller_name:"Bob",   verified:true,  sold:false, save_count:24, created_at:t(0),  description:"M3 Pro chip 18 GB RAM 512 GB SSD. AppleCare+ until 2026. Original 140W charger and box.",         images:["/img1.jpeg"], stock:1 },
  { id:"e2",  user_id:"mock", title:"Apple iPhone 16 Pro Max 256 GB – Natural Titanium",  price:1099.00, category:"electronics", condition:"New",  seller_name:"Jack",  verified:true,  sold:false, save_count:41, created_at:t(2),  description:"Sealed box factory unlocked. Works with all carriers. Ships same day.",                             images:["/img2.jpeg"], stock:2 },
  { id:"e3",  user_id:"mock", title:"Apple MacBook Air 15-inch M3 – Midnight",            price:1149.00, category:"electronics", condition:"Used", seller_name:"Axel",  verified:true,  sold:false, save_count:19, created_at:t(5),  description:"MacBook Air 15 M3 8 GB 256 GB SSD. Used 2 months, perfect condition. Original packaging.",         images:["/img3.jpeg"], stock:1 },
  { id:"e4",  user_id:"mock", title:"Apple iPhone 15 128 GB – Pink – Unlocked",           price:649.00,  category:"electronics", condition:"Used", seller_name:"Chris", verified:false, sold:false, save_count:11, created_at:t(8),  description:"Small scuff on back corner, screen pristine. Battery health 91%.",                                  images:["/img4.jpeg"], stock:1 },
  { id:"e5",  user_id:"mock", title:"Apple MacBook Pro 14-inch M3 – Silver",              price:1699.00, category:"electronics", condition:"Used", seller_name:"Ryan",  verified:true,  sold:false, save_count:30, created_at:t(12), description:"M3 8 GB 512 GB SSD. Purchased 3 months ago, kept in sleeve daily.",                                 images:["/img5.jpeg"], stock:1 },
  { id:"e6",  user_id:"mock", title:"Apple iPhone 16 256 GB – Ultramarine",               price:799.00,  category:"electronics", condition:"New",  seller_name:"Luca",  verified:true,  sold:false, save_count:22, created_at:t(15), description:"Sealed, never opened. Bought as a gift, wrong model. Factory unlocked.",                             images:["/img6.jpeg"], stock:2 },
  { id:"e7",  user_id:"mock", title:"Apple MacBook Air 13-inch M2 – Starlight",           price:849.00,  category:"electronics", condition:"Used", seller_name:"Finn",  verified:false, sold:false, save_count:8,  created_at:t(20), description:"M2 8 GB 256 GB SSD. Minor wear on palm rest. Battery 88%.",                                          images:["/img7.jpeg"], stock:1 },
  { id:"e8",  user_id:"mock", title:"Apple iPhone 16 Pro 512 GB – Desert Titanium",       price:1249.00, category:"electronics", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:35, created_at:t(25), description:"2 weeks old. Screen protector from day one. Immaculate.",                                             images:["/img8.jpeg"], stock:1 },
  { id:"e9",  user_id:"mock", title:"Apple MacBook Pro 16-inch M4 Pro – Space Black",     price:2699.00, category:"electronics", condition:"New",  seller_name:"Noah",  verified:true,  sold:false, save_count:47, created_at:t(30), description:"Latest M4 Pro 24 GB 512 GB SSD. Sealed retail box full Apple warranty.",                              images:["/img9.jpeg"], stock:2 },
  { id:"e10", user_id:"mock", title:"Apple iPhone 15 Pro Max 256 GB – Natural Titanium",  price:899.00,  category:"electronics", condition:"Used", seller_name:"Eli",   verified:false, sold:false, save_count:14, created_at:t(36), description:"Used 10 months. Battery 86%. Minor frame scuffs, screen perfect. Unlocked.",                          images:["/img10.jpeg"], stock:1 },
  // Fashion
  { id:"f1",  user_id:"mock", title:"Nike Tech Fleece Full-Zip Hoodie – Dark Grey – L",   price:89.99,  category:"fashion", condition:"Used", seller_name:"Jack",  verified:true,  sold:false, save_count:18, created_at:t(1),  description:"Worn twice. No damage, tags still attached.",                          images:["/img11.jpeg"], stock:1 },
  { id:"f2",  user_id:"mock", title:"Uniqlo Ultra Light Down Jacket – Navy – M",          price:49.90,  category:"fashion", condition:"Used", seller_name:"Chris", verified:true,  sold:false, save_count:9,  created_at:t(4),  description:"Worn regularly last winter, no marks or snags.",                       images:["/img12.jpeg"], stock:1 },
  { id:"f3",  user_id:"mock", title:"Nike Club Fleece Joggers – Black – M",               price:44.99,  category:"fashion", condition:"Used", seller_name:"Axel",  verified:false, sold:false, save_count:12, created_at:t(7),  description:"Worn 3 times, no pilling.",                                            images:["/img13.jpeg"], stock:2 },
  { id:"f4",  user_id:"mock", title:"Uniqlo Merino Crew Neck Sweater – Camel – S",        price:39.90,  category:"fashion", condition:"Used", seller_name:"Bob",   verified:false, sold:false, save_count:6,  created_at:t(10), description:"Slight pilling under arms, otherwise perfect. Dry cleaned.",           images:["/img14.jpeg"], stock:1 },
  { id:"f5",  user_id:"mock", title:"Nike Windrunner Jacket – White Black – M",           price:74.99,  category:"fashion", condition:"Used", seller_name:"Ryan",  verified:true,  sold:false, save_count:21, created_at:t(14), description:"Worn a few times. No stains, zips work perfectly.",                   images:["/img15.jpeg"], stock:1 },
  { id:"f6",  user_id:"mock", title:"Uniqlo Crew Neck T-Shirt 3-Pack – White – XL",      price:19.90,  category:"fashion", condition:"New",  seller_name:"Luca",  verified:false, sold:false, save_count:4,  created_at:t(18), description:"Brand new 3-pack. Never opened. Bought wrong size.",                  images:["/img16.jpeg"], stock:2 },
  { id:"f7",  user_id:"mock", title:"Nike Essential Running Jacket – Blue – S",           price:59.99,  category:"fashion", condition:"Used", seller_name:"Finn",  verified:false, sold:false, save_count:7,  created_at:t(22), description:"Small fade on left sleeve. Otherwise great condition.",                images:["/img17.jpeg"], stock:1 },
  { id:"f8",  user_id:"mock", title:"Uniqlo Kando Pants – Beige – 30x32",                price:34.90,  category:"fashion", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:13, created_at:t(27), description:"Worn twice to the office. Lightweight and stretchy.",                 images:["/img18.jpeg"], stock:1 },
  { id:"f9",  user_id:"mock", title:"Nike Swoosh Graphic Tee – Black – XL",              price:29.99,  category:"fashion", condition:"Used", seller_name:"Noah",  verified:false, sold:false, save_count:5,  created_at:t(32), description:"Print still crisp. Small mark inside collar.",                        images:["/img19.jpeg"], stock:2 },
  { id:"f10", user_id:"mock", title:"Uniqlo Fleece Full-Zip Jacket – Olive – L",         price:44.90,  category:"fashion", condition:"Used", seller_name:"Eli",   verified:false, sold:false, save_count:10, created_at:t(38), description:"Very warm. Worn maybe 4 times. No damage.",                           images:["/img20.jpeg"], stock:1 },
  // Jewellery
  { id:"j1",  user_id:"mock", title:"10K Gold 0.25ct Diamond Solitaire Ring – Size 7",   price:349.00, category:"jewellery", condition:"Used", seller_name:"Bob",   verified:true,  sold:false, save_count:33, created_at:t(2),  description:"10K gold solitaire 0.25ct round brilliant. Appraisal included.",    images:["/img21.jpeg"], stock:1 },
  { id:"j2",  user_id:"mock", title:"14K Rose Gold Cuban Link Chain – 18in 4mm",         price:629.00, category:"jewellery", condition:"New",  seller_name:"Axel",  verified:true,  sold:false, save_count:15, created_at:t(5),  description:"Solid 14K rose gold Cuban chain. Hallmarked with certificate.",      images:["/img22.jpeg"], stock:1 },
  { id:"j3",  user_id:"mock", title:"Sterling Silver Hoop Earrings 40mm – Pair",         price:28.00,  category:"jewellery", condition:"New",  seller_name:"Chris", verified:false, sold:false, save_count:8,  created_at:t(9),  description:"925 sterling silver hoops. Hypoallergenic. Never worn.",             images:["/img23.jpeg"], stock:2 },
  { id:"j4",  user_id:"mock", title:"14K White Gold Diamond Tennis Bracelet 1ct",        price:895.00, category:"jewellery", condition:"Used", seller_name:"Ryan",  verified:true,  sold:false, save_count:44, created_at:t(13), description:"14K white gold tennis bracelet 1ct total. Original box and appraisal.", images:["/img24.png"], stock:1 },
  { id:"j5",  user_id:"mock", title:"Gold Plated Chunky Chain Necklace – 20in",          price:42.00,  category:"jewellery", condition:"Used", seller_name:"Luca",  verified:false, sold:false, save_count:6,  created_at:t(17), description:"Light tarnish on the clasp, chain itself perfect.",                  images:["/img25.jpeg"], stock:1 },
  { id:"j6",  user_id:"mock", title:"925 Silver Vintage Signet Ring – Size 9",           price:65.00,  category:"jewellery", condition:"Used", seller_name:"Finn",  verified:false, sold:false, save_count:11, created_at:t(21), description:"Engraved star design. Worn twice. No scratches.",                    images:["/img26.jpeg"], stock:1 },
  { id:"j7",  user_id:"mock", title:"14K Gold Stud Earrings 0.5ct Total Diamonds",      price:425.00, category:"jewellery", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:29, created_at:t(26), description:"0.25ct each. Butterfly backs. Original jeweller box.",               images:["/img27.jpeg"], stock:1 },
  { id:"j8",  user_id:"mock", title:"Rose Gold Minimalist Watch – Stainless Steel",      price:89.00,  category:"jewellery", condition:"Used", seller_name:"Noah",  verified:false, sold:false, save_count:9,  created_at:t(31), description:"Light scratches on case back. Battery new.",                          images:["/img28.jpeg"], stock:1 },
  { id:"j9",  user_id:"mock", title:"10K Gold Rope Chain Necklace – 22in 2mm",          price:185.00, category:"jewellery", condition:"New",  seller_name:"Eli",   verified:true,  sold:false, save_count:17, created_at:t(35), description:"10K solid yellow gold. Brand new with tags. Gift box included.",     images:["/img29.jpeg"], stock:2 },
  { id:"j10", user_id:"mock", title:"Aquamarine Silver Pendant Necklace – 18in",         price:55.00,  category:"jewellery", condition:"Used", seller_name:"Jack",  verified:false, sold:false, save_count:7,  created_at:t(40), description:"Aquamarine gemstone pendant on 925 silver chain. Worn once.",        images:["/img30.jpeg"], stock:1 },
  // Sports
  { id:"s1",  user_id:"mock", title:"Nike Air Max 95 Triple Black – Men Size 10",        price:149.99, category:"sports", condition:"Used", seller_name:"Axel",  verified:true,  sold:false, save_count:27, created_at:t(3),  description:"Worn 3 times. Soles still clean. Original box and extra laces.",   images:["/img31.jpeg"], stock:1 },
  { id:"s2",  user_id:"mock", title:"Nike Tech Pack Woven Trousers – Black – M",         price:119.95, category:"sports", condition:"New",  seller_name:"Bob",   verified:true,  sold:false, save_count:12, created_at:t(6),  description:"Brand new with tags. Tapered fit, zip pockets.",                   images:["/img32.jpeg"], stock:2 },
  { id:"s3",  user_id:"mock", title:"Nike Air Force 1 White – Men Size 11",              price:89.99,  category:"sports", condition:"Used", seller_name:"Chris", verified:false, sold:false, save_count:16, created_at:t(9),  description:"Worn about 10 times, slight creasing on toe box. Cleaned.",        images:["/img33.jpeg"], stock:1 },
  { id:"s4",  user_id:"mock", title:"Nike Dri-FIT Running Shorts – Grey – L",            price:34.99,  category:"sports", condition:"Used", seller_name:"Ryan",  verified:false, sold:false, save_count:5,  created_at:t(13), description:"Worn twice for the gym. No fade or damage.",                       images:["/img34.jpeg"], stock:2 },
  { id:"s5",  user_id:"mock", title:"Nike Air Max 270 React – White Volt – Size 9.5",    price:109.99, category:"sports", condition:"Used", seller_name:"Luca",  verified:true,  sold:false, save_count:20, created_at:t(17), description:"Lightly worn, no yellowing on sole. Box included.",                images:["/img35.jpeg"], stock:1 },
  { id:"s6",  user_id:"mock", title:"Nike Pro Compression Tights – Black – M",           price:49.99,  category:"sports", condition:"New",  seller_name:"Finn",  verified:false, sold:false, save_count:4,  created_at:t(21), description:"Brand new in wrapper. Never worn.",                                 images:["/img36.jpeg"], stock:2 },
  { id:"s7",  user_id:"mock", title:"Nike Metcon 9 Training Shoes – White Black – 10",   price:119.99, category:"sports", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:23, created_at:t(26), description:"Used for gym training 5 times. Soles barely worn.",                images:["/img37.jpeg"], stock:1 },
  { id:"s8",  user_id:"mock", title:"Nike Pegasus 41 Running Shoes – Blue – 10.5",       price:129.99, category:"sports", condition:"Used", seller_name:"Noah",  verified:false, sold:false, save_count:14, created_at:t(31), description:"Approx 80 miles. Upper clean, midsole cushion great.",             images:["/img38.jpeg"], stock:1 },
  { id:"s9",  user_id:"mock", title:"Nike Tech Fleece Joggers – Navy – L",               price:79.99,  category:"sports", condition:"Used", seller_name:"Eli",   verified:true,  sold:false, save_count:18, created_at:t(35), description:"Worn a handful of times. No pilling. Elastic ankles perfect.",     images:["/img39.jpeg"], stock:1 },
  { id:"s10", user_id:"mock", title:"Nike Air Max 1 – Wheat Gum – Men Size 9",           price:139.99, category:"sports", condition:"Used", seller_name:"Jack",  verified:false, sold:false, save_count:10, created_at:t(40), description:"Worn regularly over a summer. Uppers clean.",                      images:["/img40.jpeg"], stock:2 },
];

// ─── Promoted listings (paid Featured tier — shown pinned at top) ─
const PROMO_START_SECONDS = 1000 * 3600;
const PROMO_EPOCH = Date.now();

const PROMOTED_LISTINGS: Listing[] = [
  {
    id: "p1", user_id: "mock",
    title: "Apple MacBook Pro 16-inch M4 Max – 128 GB – Space Black",
    price: 3499.00, category: "electronics", condition: "New",
    seller_name: "Noah", verified: true, sold: false, save_count: 62,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    description: "M4 Max chip, 128 GB unified memory, 2 TB SSD. Sealed retail box. Full Apple warranty and receipt. Ships same day.",
    images: ["/img9.jpeg"], stock: 1,
  },
  {
    id: "p2", user_id: "mock",
    title: "Nike Air Jordan 1 Retro High OG – Chicago – Size 10",
    price: 389.00, category: "sports", condition: "New",
    seller_name: "Axel", verified: true, sold: false, save_count: 88,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    description: "DS Chicago colourway. Original box, lace bag, receipt. Purchased from Nike SNKRS. Never worn or tried on.",
    images: ["/img31.jpeg"], stock: 1,
  },
];

// ─── Countdown timer hook ──────────────────────────────────────
function useCountdown(startSeconds: number, epochMs: number) {
  const elapsed = Math.floor((Date.now() - epochMs) / 1000);
  const [secs, setSecs] = useState(Math.max(0, startSeconds - elapsed));
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h  = Math.floor(secs / 3600);
  const m  = Math.floor((secs % 3600) / 60);
  const s  = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}h ${pad(m)}m ${pad(s)}s`;
}

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (p: number) => "$" + Number(p).toLocaleString("en-US", { minimumFractionDigits: 2 });
const isMock = (id: string) => /^[efjs]/.test(id) || /^p/.test(id);

// ─── PromotedCard ─────────────────────────────────────────────
function PromotedCard({
  item, saved, onView, onToggleSave, onAddToCart,
}: {
  item: Listing; saved: boolean;
  onView: () => void; onToggleSave: (e: React.MouseEvent) => void; onAddToCart: (e: React.MouseEvent) => void;
}) {
  const countdown = useCountdown(PROMO_START_SECONDS, PROMO_EPOCH);
  const c     = COND[item.condition] ?? COND["Used"];
  const imgs  = Array.isArray(item.images) ? item.images : [];
  const deals = SELLER_DEALS[item.seller_name ?? ""] ?? 0;

  return (
    <div
      onClick={onView}
      className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 relative"
      style={{
        width: 220,
        background: "rgba(255,255,255,0.85)",
        border: "1.5px solid rgba(245,158,11,0.45)",
        boxShadow: "0 4px 24px rgba(245,158,11,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Promoted ribbon */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-2.5 py-1 z-10"
        style={{ background: "linear-gradient(90deg,rgba(245,158,11,0.92),rgba(234,88,12,0.88))" }}
      >
        <div className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[9px] font-black text-white uppercase tracking-wider">Featured</span>
        </div>
        <span className="text-[9px] font-bold text-white/90 font-mono">{countdown}</span>
      </div>

      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 156, marginTop: 22 }}>
        {imgs.length > 0 ? (
          <img
            src={imgs[0]} alt={item.title}
            className="w-full h-full transition-transform duration-300 hover:scale-105"
            style={{ objectFit: "cover", objectPosition: "center", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.07),rgba(234,88,12,0.07))" }}>
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {item.verified && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: GRAD }}>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Verified
          </div>
        )}
        <button
          onClick={onToggleSave}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition hover:scale-110"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer" }}
        >
          <svg className="w-3.5 h-3.5" fill={saved ? "#EF4444" : "none"} viewBox="0 0 24 24" stroke={saved ? "#EF4444" : "#9CA3AF"} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1" onClick={onView}>
        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 self-start" style={{ background: c.bg, color: c.color }}>{item.condition}</span>
        <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 flex-1">{item.title}</h2>
        <p className="text-base font-extrabold mb-0.5" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(item.price)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: GRAD }}>
            {(item.seller_name ?? "?")[0].toUpperCase()}
          </div>
          <span className="text-[10px] text-gray-500 truncate">{item.seller_name}</span>
          <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{deals} deals</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-3.5 pb-3.5 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition"
          style={{ background: GRAD, border: "none" }}
        >
          View
        </button>
        <button
          onClick={onAddToCart}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          style={{ border: "none" }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// ─── TiltCard ─────────────────────────────────────────────────
function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
    el.style.boxShadow = `${-x * 16}px ${y * 16}px 40px rgba(0,170,255,0.2),0 8px 28px rgba(107,48,255,0.13)`;
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
    el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)";
  };
  return (
    <div ref={ref} className={className} style={{ ...style, transition: "transform 0.15s ease,box-shadow 0.15s ease", willChange: "transform" }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col w-56 flex-shrink-0" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.8)" }}>
      <div className="animate-pulse" style={{ height: 160, background: "linear-gradient(135deg,rgba(0,170,255,0.08),rgba(107,48,255,0.08))" }} />
      <div className="p-3.5 flex flex-col gap-2">
        {[3/4, 1/2, 1/3].map((w, i) => <div key={i} className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${w*100}%` }} />)}
        <div className="flex gap-2 mt-2">
          <div className="flex-1 h-8 rounded-lg bg-gray-200/70 animate-pulse" />
          <div className="flex-1 h-8 rounded-lg bg-gray-200/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── SellerBadge ──────────────────────────────────────────────
function SellerBadge({ name, verified }: { name: string; verified: boolean }) {
  const deals = SELLER_DEALS[name] ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ background: GRAD }}>
        {name[0].toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800">{name}</span>
          {verified && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: GRAD }}>
              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Verified
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-400">{deals} deals completed</p>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────
function DetailModal({ listing, uid, onClose, onMessage, onAddToCart, saved, onToggleSave }: {
  listing: Listing; uid: string | null; onClose: () => void;
  onMessage: () => void; onAddToCart: () => void; saved: boolean; onToggleSave: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [];
  const c = COND[listing.condition] ?? COND["Used"];
  const isOwn = uid === listing.user_id;

  const markSold = async () => {
    await supabase.from("marketplace_listings").update({ sold: true }).eq("id", listing.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden" style={{ maxHeight: "92vh", overflowY: "auto" }}>
        {/* Image */}
        <div className="relative bg-gray-100" style={{ height: 280 }}>
          {imgs.length > 0 ? (
            <img src={imgs[imgIdx]} alt={listing.title} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "center", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.09),rgba(107,48,255,0.09))" }}>
              <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          {imgs.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className="w-2 h-2 rounded-full transition" style={{ background: i === imgIdx ? "#6B30FF" : "rgba(255,255,255,0.6)", border: "none" }} />)}
              </div>
              <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow text-gray-700 text-lg" style={{ border: "none" }}>&#8249;</button>
              <button onClick={() => setImgIdx(i => Math.min(imgs.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow text-gray-700 text-lg" style={{ border: "none" }}>&#8250;</button>
            </>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-600 hover:text-gray-900" style={{ border: "none" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {listing.verified && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-white" style={{ background: GRAD }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Verified
            </div>
          )}
          {listing.sold && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
              <span className="text-white font-extrabold text-2xl tracking-widest uppercase">Sold</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex-1 leading-snug">{listing.title}</h2>
            <button onClick={onToggleSave} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-red-300 flex-shrink-0 transition" style={{ background: "none" }}>
              <svg className="w-4 h-4" fill={saved ? "#EF4444" : "none"} viewBox="0 0 24 24" stroke={saved ? "#EF4444" : "#9CA3AF"} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
              </svg>
            </button>
          </div>

          <p className="text-2xl font-extrabold mb-3" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {fmt(listing.price)}
          </p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: c.bg, color: c.color }}>{listing.condition}</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 capitalize">{listing.category}</span>
            {(listing.save_count ?? 0) > 0 && <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">{listing.save_count} saved</span>}
          </div>

          {listing.description && <p className="text-sm text-gray-600 leading-relaxed mb-5">{listing.description}</p>}

          <div className="p-3 rounded-xl mb-5" style={{ background: "#F8FAFF" }}>
            <SellerBadge name={listing.seller_name ?? "Unknown"} verified={listing.verified} />
            <p className="text-xs text-gray-400 mt-1 ml-10">
              Listed {new Date(listing.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {isOwn ? (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition" style={{ border: "none" }}>Close</button>
              {!listing.sold && <button onClick={markSold} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90" style={{ background: "linear-gradient(90deg,#EF4444,#F97316)", border: "none" }}>Mark as Sold</button>}
            </div>
          ) : (() => {
              const inCart = JSON.parse(sessionStorage.getItem("verifind_cart") ?? "[]") as {id:string;qty:number}[];
              const cartQty = inCart.find(x => x.id === listing.id)?.qty ?? 0;
              const maxStock = listing.stock ?? 1;
              const atMax = cartQty >= maxStock;
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={onAddToCart}
                      disabled={listing.sold || atMax}
                      className="w-full py-3 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: listing.sold || atMax ? "rgba(0,0,0,0.08)" : GRAD, border: "none", color: listing.sold || atMax ? "#9ca3af" : "#fff" }}
                    >
                      {listing.sold ? "Item Sold" : atMax ? `Max ${maxStock} reached` : "Add to Cart"}
                    </button>
                    {maxStock > 1 && !listing.sold && (
                      <p className="text-center text-[10px]" style={{ color: atMax ? "rgb(185,28,28)" : "rgb(5,150,105)" }}>
                        {atMax ? `${maxStock} of ${maxStock} in cart` : `${cartQty} of ${maxStock} in cart · ${maxStock - cartQty} remaining`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onMessage}
                      disabled={listing.sold}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-40"
                      style={{ border: "none" }}
                    >
                      Message Seller
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                      style={{ border: "1px solid rgba(0,0,0,0.08)", background: "none" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

// ─── MessageThread ────────────────────────────────────────────
function MessageThread({ listingId, listingTitle, recipientId, recipientName, uid, onClose }: {
  listingId: string; listingTitle: string; recipientId: string; recipientName: string; uid: string; onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: asSender }, { data: asRecipient }] = await Promise.all([
      supabase.from("marketplace_messages").select("*").eq("listing_id", listingId).eq("sender_id", uid).order("created_at", { ascending: true }),
      supabase.from("marketplace_messages").select("*").eq("listing_id", listingId).eq("recipient_id", uid).order("created_at", { ascending: true }),
    ]);
    const merged = [...(asSender ?? []), ...(asRecipient ?? [])] as Message[];
    const deduped = Array.from(new Map(merged.map(m => [m.id, m])).values())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(deduped);
    if ((asRecipient ?? []).some((m: any) => !m.read)) {
      await supabase.from("marketplace_messages").update({ read: true }).eq("listing_id", listingId).eq("recipient_id", uid).eq("read", false);
    }
  }, [listingId, uid]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`thread-${listingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_messages", filter: `listing_id=eq.${listingId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, listingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("marketplace_messages").insert({ listing_id: listingId, sender_id: uid, recipient_id: recipientId, body: body.trim() });
    if (!error) { setBody(""); await load(); }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden" style={{ height: 520 }}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">Chat with {recipientName}</p>
            <p className="text-xs text-gray-400 truncate max-w-[220px]">{listingTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center mt-16">
              <p className="text-sm text-gray-400">No messages yet. Say hi!</p>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed" style={mine ? { background: GRAD, color: "#fff", borderBottomRightRadius: 4 } : { background: "#F3F4F6", color: "#1F2937", borderBottomLeftRadius: 4 }}>
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: "#F8FAFF", border: "1px solid rgba(0,0,0,0.08)" }} />
          <button onClick={send} disabled={!body.trim() || sending} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40" style={{ background: GRAD, border: "none" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inbox ────────────────────────────────────────────────────
function Inbox({ uid, onOpenThread, onClose }: { uid: string; onOpenThread: (t: Thread) => void; onClose: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase.from("marketplace_messages").select("id,listing_id,sender_id,recipient_id,body,read,created_at").eq("sender_id", uid).order("created_at", { ascending: false }),
        supabase.from("marketplace_messages").select("id,listing_id,sender_id,recipient_id,body,read,created_at").eq("recipient_id", uid).order("created_at", { ascending: false }),
      ]);
      const allMsgs = [...(sent ?? []), ...(received ?? [])];
      const msgs = Array.from(new Map(allMsgs.map((m: any) => [m.id, m])).values())
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (!msgs || msgs.length === 0) { setLoading(false); return; }
      const listingIds = [...new Set(msgs.map((m: any) => m.listing_id))];
      const otherUserIds = [...new Set(msgs.map((m: any) => m.sender_id === uid ? m.recipient_id : m.sender_id))];
      const { data: listings } = await supabase.from("marketplace_listings").select("id,title").in("id", listingIds);
      const listingMap: Record<string, string> = {};
      (listings ?? []).forEach((l: any) => { listingMap[l.id] = l.title; });
      let userMap: Record<string, string> = {};
      try {
        const { data: profiles } = await supabase.from("profiles").select("id,username").in("id", otherUserIds);
        (profiles ?? []).forEach((p: any) => { userMap[p.id] = p.username ?? p.id.slice(0, 8); });
      } catch {
        otherUserIds.forEach((id: string) => { userMap[id] = id.slice(0, 8); });
      }
      const map = new Map<string, Thread>();
      for (const m of msgs as any[]) {
        const otherId = m.sender_id === uid ? m.recipient_id : m.sender_id;
        const tKey = `${m.listing_id}__${otherId}`;
        if (!map.has(tKey)) {
          map.set(tKey, { listing_id: m.listing_id, other_user_id: otherId, other_username: userMap[otherId] ?? otherId.slice(0, 8), listing_title: listingMap[m.listing_id] ?? "Listing", last_message: m.body, last_at: m.created_at, unread: (!m.read && m.recipient_id === uid) ? 1 : 0 });
        } else if (!m.read && m.recipient_id === uid) {
          map.get(tKey)!.unread++;
        }
      }
      setThreads(Array.from(map.values()));
      setLoading(false);
    })();
  }, [uid]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ maxHeight: "80vh" }}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <p className="font-bold text-gray-900">Messages</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 64px)" }}>
          {loading && <p className="text-center text-sm text-gray-400 py-10">Loading...</p>}
          {!loading && threads.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <p className="text-gray-500 text-sm">No messages yet</p>
            </div>
          )}
          {threads.map((th) => (
            <button key={`${th.listing_id}__${th.other_user_id}`} onClick={() => onOpenThread(th)} className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition text-left" style={{ background: "none", border: "none", borderBottom: "1px solid #f9fafb", cursor: "pointer" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: GRAD }}>{th.other_username[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-semibold text-gray-800">{th.other_username}</p>
                  <p className="text-[10px] text-gray-400">{new Date(th.last_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-gray-500 truncate">{th.listing_title}</p>
                <p className="text-xs text-gray-400 truncate">{th.last_message}</p>
              </div>
              {th.unread > 0 && <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: GRAD }}>{th.unread}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SellForm ─────────────────────────────────────────────────
function SellForm({ uid, username, onDone }: { uid: string; username: string; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "electronics", condition: "Used" as Condition, stock: 1, promo: "none" as "none" | "basic" | "featured" | "premium" });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []).slice(0, 4);
    setFiles(chosen);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.price) { setError("Title and price are required."); return; }
    setSubmitting(true); setError("");
    const urls: string[] = [];
    for (const file of files) {
      const path = `${uid}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("marketplace-images").upload(path, file);
      if (!upErr) { const { data: pub } = supabase.storage.from("marketplace-images").getPublicUrl(path); urls.push(pub.publicUrl); }
    }
    const { error: insErr } = await supabase.from("marketplace_listings").insert({ user_id: uid, title: form.title.trim(), description: form.description.trim() || null, price: parseFloat(form.price), category: form.category, condition: form.condition, images: urls, seller_name: username });
    if (insErr) { setError(insErr.message); setSubmitting(false); return; }
    setSubmitting(false); onDone();
  };

  const fCls = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none";
  const fSt: React.CSSProperties = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.09)" };

  const handlePriceChange = (raw: string) => {
    let v = raw.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    if (parts[1] !== undefined && parts[1].length > 2) v = parts[0] + "." + parts[1].slice(0, 2);
    setForm(f => ({ ...f, price: v }));
  };

  const handlePriceBlur = () => {
    if (!form.price) return;
    const num = parseFloat(form.price);
    if (!isNaN(num)) setForm(f => ({ ...f, price: num.toFixed(2) }));
  };

  return (
    <div id="sell-form" className="relative z-10 max-w-lg mx-auto px-4 py-6">
      <div className="rounded-3xl p-6 md:p-8" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">List an Item</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Title *</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Apple MacBook Pro 16 inch M3" className={fCls} style={fSt} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Condition details, what is included, reason for selling..." className={`${fCls} resize-none`} style={fSt} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
                <input inputMode="decimal" value={form.price} onChange={(e) => handlePriceChange(e.target.value)} onBlur={handlePriceBlur} placeholder="0.00" className={fCls} style={{ ...fSt, paddingLeft: "1.75rem" }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Condition</label>
              <select value={form.condition} onChange={(e) => setForm(f => ({ ...f, condition: e.target.value as Condition }))} className={fCls} style={fSt}>
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Category</label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={fCls} style={fSt}>
                {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Quantity in stock</label>
              <div className="flex items-center gap-0" style={{ height: "38px" }}>
                <button type="button" onClick={() => setForm(f => ({ ...f, stock: Math.max(1, f.stock - 1) }))} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-white transition rounded-l-xl font-bold text-lg" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.09)", borderRight: "none" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </button>
                <div className="flex-1 h-full flex flex-col items-center justify-center" style={{ background: "rgba(255,255,255,0.75)", borderTop: "1px solid rgba(0,0,0,0.09)", borderBottom: "1px solid rgba(0,0,0,0.09)" }}>
                  <span className="text-sm font-bold text-gray-800 leading-none">{form.stock}</span>
                  <span className="text-[9px] text-gray-400 leading-none mt-0.5">{form.stock === 1 ? "unit" : "units"}</span>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, stock: Math.min(10, f.stock + 1) }))} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-white transition rounded-r-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.09)", borderLeft: "none" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">How many are available (max 10)</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Photos (up to 4)</label>
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-gray-500 cursor-pointer transition hover:bg-white/80" style={{ border: "2px dashed rgba(0,170,255,0.3)", background: "rgba(255,255,255,0.4)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Upload photos
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
            </label>
            {previews.length > 0 && <div className="flex gap-2 mt-2 flex-wrap">{previews.map((p, i) => <img key={i} src={p} className="w-16 h-16 rounded-lg" style={{ objectFit: "cover" }} alt="preview" />)}</div>}
          </div>

          {/* Promote your listing */}
          {(() => {
            const PROMO_OPTIONS = [
              { key: "none",     label: "No promotion",   price: 0,     desc: "Standard listing" },
              { key: "basic",    label: "Basic",          price: 2.99,  desc: "Top of category" },
              { key: "featured", label: "Featured",       price: 7.99,  desc: "Homepage spotlight", popular: true },
              { key: "premium",  label: "Premium",        price: 14.99, desc: "Search + category + email" },
            ] as const;
            const basePrice  = parseFloat(form.price) || 0;
            const promoPrice = PROMO_OPTIONS.find(o => o.key === form.promo)?.price ?? 0;
            const totalPrice = basePrice * form.stock + promoPrice;
            return (
              <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" style={{ color: "rgb(245,158,11)" }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <p className="text-xs font-bold text-gray-700">Feature your listing (optional)</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PROMO_OPTIONS.map(opt => (
                    <button key={opt.key} type="button" onClick={() => setForm(f => ({ ...f, promo: opt.key }))} className="relative flex flex-col px-3 py-2.5 rounded-xl text-left transition-all" style={{ background: form.promo === opt.key ? (opt.key === "none" ? "rgba(107,48,255,0.06)" : "rgba(245,158,11,0.08)") : "rgba(255,255,255,0.6)", border: form.promo === opt.key ? `1.5px solid ${opt.key === "none" ? "rgba(107,48,255,0.3)" : "rgba(245,158,11,0.4)"}` : "1.5px solid rgba(0,0,0,0.07)" }}>
                      {"popular" in opt && opt.popular && <span className="absolute -top-2 left-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white" style={{ background: "rgb(245,158,11)" }}>Popular</span>}
                      <span className="text-[11px] font-bold text-gray-800">{opt.label}</span>
                      <span className="text-[9px] text-gray-400">{opt.desc}</span>
                      <span className="text-[11px] font-extrabold mt-1" style={{ color: opt.key === "none" ? "#6B30FF" : "rgb(180,83,9)" }}>{opt.price === 0 ? "Free" : `+$${opt.price.toFixed(2)}/wk`}</span>
                    </button>
                  ))}
                </div>
                <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Listing summary</p>
                  <div className="flex justify-between text-xs text-gray-500"><span>Quantity</span><span className="font-semibold text-gray-700">{form.stock} {form.stock === 1 ? "unit" : "units"}</span></div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Price per unit</span><span className="font-semibold text-gray-700">${basePrice > 0 ? basePrice.toFixed(2) : "—"}</span></div>
                  {form.promo !== "none" && <div className="flex justify-between text-xs text-gray-500"><span>Promotion ({PROMO_OPTIONS.find(o => o.key === form.promo)?.label})</span><span className="font-semibold" style={{ color: "rgb(180,83,9)" }}>+${promoPrice.toFixed(2)}/wk</span></div>}
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 mt-0.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <span>Total listing value</span>
                    <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>${totalPrice > 0 ? totalPrice.toFixed(2) : "—"}{form.promo !== "none" ? " + promo" : ""}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onDone} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition" style={{ border: "none" }}>Cancel</button>
            <button onClick={submit} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50" style={{ background: GRAD, border: "none" }}>{submitting ? "Listing..." : "List Item"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [uid, setUid]             = useState<string | null>(null);
  const [username, setUsername]   = useState("");
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError]     = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState(searchParams.get("category") ?? "all");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState<SortKey>("newest");
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSell, setShowSell]   = useState(searchParams.get("sell") === "1");
  const [showAll, setShowAll]     = useState(false);
  const PREVIEW_COUNT = 8;

  const [detailItem, setDetailItem]       = useState<Listing | null>(null);
  const [messageTarget, setMessageTarget] = useState<Listing | null>(null);
  const [activeThread, setActiveThread]   = useState<Thread | null>(null);
  const [showInbox, setShowInbox]         = useState(false);

  useEffect(() => {
    const cat  = searchParams.get("category");
    const sell = searchParams.get("sell");
    if (cat)          { setActiveCat(cat); setShowSell(false); setShowAll(false); }
    if (sell === "1") { setShowSell(true); }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setUid(u.id);
        setUsername(u.user_metadata?.username ?? u.email ?? "User");
        loadSaves(u.id);
        loadUnread(u.id);
      }
    });
    loadDbListings();
  }, []);

  useEffect(() => { loadDbListings(); }, [activeCat]);

  const loadDbListings = async () => {
    setDbLoading(true); setDbError(null);
    try {
      let q = supabase.from("marketplace_listings").select("id,user_id,title,description,price,category,condition,images,seller_name,verified,sold,created_at").eq("sold", false).order("created_at", { ascending: false });
      if (activeCat !== "all") q = q.eq("category", activeCat);
      const { data, error } = await q;
      if (error) throw error;
      const normalised = (data as Listing[]).map(l => ({ ...l, condition: (["New", "Used"].includes(l.condition) ? l.condition : "Used") as Condition, stock: (l as any).stock ?? 1 }));
      setDbListings(normalised ?? []);
    } catch (e: unknown) {
      setDbError(e instanceof Error ? e.message : "Failed to load");
    }
    setDbLoading(false);
  };

  const loadSaves = async (userId: string) => {
    const { data } = await supabase.from("marketplace_saves").select("listing_id").eq("user_id", userId);
    const dbIds: string[] = data ? data.map((r: { listing_id: string }) => r.listing_id) : [];
    const raw = localStorage.getItem("verifind_saved_mock");
    const localIds: string[] = raw ? JSON.parse(raw) : [];
    setSavedIds(new Set([...dbIds, ...localIds]));
  };

  const loadUnread = async (userId: string) => {
    const { count } = await supabase.from("marketplace_messages").select("id", { count: "exact", head: true }).eq("recipient_id", userId).eq("read", false);
    setUnreadCount(count ?? 0);
  };

  useEffect(() => {
    if (!uid) return;
    const ch = supabase.channel(`inbox-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_messages", filter: `recipient_id=eq.${uid}` }, () => loadUnread(uid))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  useEffect(() => {
    const ch = supabase.channel("marketplace-new")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_listings" }, (payload) => setDbListings(prev => [payload.new as Listing, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleSave = useCallback(async (id: string) => {
    if (!uid) { navigate("/login"); return; }
    const wasSaved = savedIds.has(id);
    const willSave = !wasSaved;
    setSavedIds(prev => { const n = new Set(prev); willSave ? n.add(id) : n.delete(id); return n; });
    if (isMock(id)) {
      const raw = localStorage.getItem("verifind_saved_mock");
      const stored: string[] = raw ? JSON.parse(raw) : [];
      const updated = willSave ? [...new Set([...stored, id])] : stored.filter((x: string) => x !== id);
      localStorage.setItem("verifind_saved_mock", JSON.stringify(updated));
    } else {
      if (wasSaved) { await supabase.from("marketplace_saves").delete().eq("user_id", uid).eq("listing_id", id); }
      else { await supabase.from("marketplace_saves").insert({ user_id: uid, listing_id: id }); }
    }
  }, [uid, savedIds, navigate]);

  const allListings: Listing[] = [...MOCK_LISTINGS, ...dbListings];

  const filtered = allListings
    .filter(l => activeCat === "all" || l.category === activeCat)
    .filter(l => (l.title ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-asc")  return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "saves")      return (b.save_count ?? 0) - (a.save_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const displayed = showAll || search ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const hasMore   = !showAll && !search && filtered.length > PREVIEW_COUNT;

  return (
    <>
      {detailItem && (
        <DetailModal listing={detailItem} uid={uid} onClose={() => setDetailItem(null)} onMessage={() => { setMessageTarget(detailItem); setDetailItem(null); }} onAddToCart={() => { navigate("/cart", { state: { item: detailItem } }); setDetailItem(null); }} saved={savedIds.has(detailItem.id)} onToggleSave={() => toggleSave(detailItem.id)} />
      )}
      {messageTarget && uid && !isMock(messageTarget.id) && (
        <MessageThread listingId={messageTarget.id} listingTitle={messageTarget.title} recipientId={messageTarget.user_id} recipientName={messageTarget.seller_name ?? "Seller"} uid={uid} onClose={() => setMessageTarget(null)} />
      )}
      {showInbox && uid && (
        <Inbox uid={uid} onOpenThread={(th) => { setShowInbox(false); setActiveThread(th); }} onClose={() => setShowInbox(false)} />
      )}
      {activeThread && uid && (
        <MessageThread listingId={activeThread.listing_id} listingTitle={activeThread.listing_title} recipientId={activeThread.other_user_id} recipientName={activeThread.other_username} uid={uid} onClose={() => setActiveThread(null)} />
      )}

      <div className="min-h-screen flex flex-col" style={{ background: "#f0f4ff" }}>
        {/* BG orbs */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position:"absolute", top:"-10%", left:"-5%", width:"55vw", height:"55vw", maxWidth:700, maxHeight:700, background:"radial-gradient(circle,rgba(0,170,255,0.16) 0%,transparent 70%)", borderRadius:"50%", filter:"blur(50px)" }} />
          <div style={{ position:"absolute", top:"25%", right:"-10%", width:"50vw", height:"50vw", maxWidth:600, maxHeight:600, background:"radial-gradient(circle,rgba(107,48,255,0.13) 0%,transparent 70%)", borderRadius:"50%", filter:"blur(50px)" }} />
        </div>

        <div className="h-20" />

        {/* Hero */}
        <div className="relative z-10 mx-4 md:mx-8 rounded-3xl mb-6" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.13),rgba(107,48,255,0.16))", border: "1px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div className="px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-1" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Marketplace</h1>
              <p className="text-sm text-gray-500">Buy and sell verified products with other Verifind users.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {uid && (
                <button onClick={() => setShowInbox(true)} className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/70 text-gray-700 hover:bg-white transition" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Messages
                  {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: GRAD }}>{unreadCount}</span>}
                </button>
              )}
              <button onClick={() => { if (!uid) { navigate("/login"); return; } setShowSell(v => !v); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 shadow-lg transition" style={{ background: GRAD, border: "none" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                {showSell ? "Back to Browse" : "List an Item"}
              </button>
            </div>
          </div>
        </div>

        {showSell && uid && <SellForm uid={uid} username={username} onDone={() => { setShowSell(false); loadDbListings(); }} />}

        {!showSell && (
          <>
            {/* Controls */}
            <div className="relative z-10 px-4 md:px-8 mb-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px] max-w-sm relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 focus:outline-none" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.95)" }}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="saves">Most saved</option>
              </select>
              <span className="text-xs text-gray-400">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Category pills */}
            <div className="relative z-10 px-4 md:px-8 mb-6 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => { setActiveCat(cat.id); setShowAll(false); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200" style={activeCat === cat.id ? { background: GRAD, color: "#fff", border: "none", boxShadow: "0 2px 10px rgba(0,170,255,0.3)" } : { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.95)", color: "#4B5563" }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="relative z-10 flex-1 px-4 md:px-8 pb-8">
              {dbLoading && <div className="flex flex-wrap gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</div>}
              {dbError && (
                <div className="mb-6 px-4 py-3 rounded-xl text-sm text-amber-700 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span>Could not load live listings. ({dbError})</span>
                  <button onClick={loadDbListings} className="ml-auto text-xs font-semibold underline" style={{ background: "none", border: "none", cursor: "pointer" }}>Retry</button>
                </div>
              )}
              {filtered.length === 0 && !dbLoading && (
                <div className="flex flex-col items-center py-20 text-center">
                  <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <p className="text-gray-700 font-semibold text-lg mb-1">No listings found</p>
                  <p className="text-gray-400 text-sm">Try a different category or search term.</p>
                </div>
              )}

              {/* Promoted listings */}
              <div className="flex flex-wrap gap-5 mb-5">
                {PROMOTED_LISTINGS.map(item => (
                  <PromotedCard key={item.id} item={item} saved={savedIds.has(item.id)} onView={() => setDetailItem(item)} onToggleSave={(e) => { e.stopPropagation(); toggleSave(item.id); }} onAddToCart={(e) => { e.stopPropagation(); navigate("/cart", { state: { item } }); }} />
                ))}
              </div>

              <div className="flex flex-wrap gap-5">
                {displayed.map((item) => {
                  const c     = COND[item.condition] ?? COND["Used"];
                  const saved = savedIds.has(item.id);
                  const imgs  = Array.isArray(item.images) ? item.images : [];
                  const deals = SELLER_DEALS[item.seller_name ?? ""] ?? 0;

                  return (
                    <TiltCard key={item.id} className="rounded-2xl overflow-hidden flex flex-col w-56 cursor-pointer" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                      <div className="relative overflow-hidden" style={{ height: 156 }} onClick={() => setDetailItem(item)}>
                        {imgs.length > 0 ? (
                          <img src={imgs[0]} alt={item.title} className="w-full h-full transition-transform duration-300 hover:scale-105" style={{ objectFit: "cover", objectPosition: "center", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.07),rgba(107,48,255,0.07))" }}>
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        {item.verified && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: GRAD }}>
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Verified
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition hover:scale-110" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer" }}>
                          <svg className="w-3.5 h-3.5" fill={saved ? "#EF4444" : "none"} viewBox="0 0 24 24" stroke={saved ? "#EF4444" : "#9CA3AF"} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-3.5 flex flex-col flex-1" onClick={() => setDetailItem(item)}>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 self-start" style={{ background: c.bg, color: c.color }}>{item.condition}</span>
                        <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 flex-1">{item.title}</h2>
                        <p className="text-base font-extrabold mb-0.5" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(item.price)}</p>
                        {(item.stock ?? 1) > 1 && <span className="text-[10px] font-semibold mb-0.5" style={{ color: "rgb(5,150,105)" }}>{item.stock} available</span>}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: GRAD }}>{(item.seller_name ?? "?")[0].toUpperCase()}</div>
                          <span className="text-[10px] text-gray-500 truncate">{item.seller_name}</span>
                          <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{deals} deals</span>
                        </div>
                      </div>

                      <div className="px-3.5 pb-3.5 flex gap-2">
                        <button onClick={() => setDetailItem(item)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>View</button>
                        {item.user_id === uid ? (
                          <button onClick={() => setDetailItem(item)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition" style={{ background: "rgba(107,48,255,0.07)", color: "#6B30FF", border: "none" }}>Your listing</button>
                        ) : (() => {
                          const inCart = JSON.parse(sessionStorage.getItem("verifind_cart") ?? "[]") as {id:string;qty:number}[];
                          const cartQty = inCart.find(x => x.id === item.id)?.qty ?? 0;
                          const atMax   = cartQty >= (item.stock ?? 1);
                          return (
                            <button onClick={(e) => { e.stopPropagation(); if (!atMax) navigate("/cart", { state: { item } }); }} disabled={atMax} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition" style={atMax ? { background: "rgba(239,68,68,0.08)", color: "rgb(185,28,28)", border: "none", cursor: "not-allowed" } : { background: "rgba(0,0,0,0.06)", color: "#374151", border: "none" }}>
                              {atMax ? `Max ${item.stock ?? 1}` : "Add to Cart"}
                            </button>
                          );
                        })()}
                      </div>
                    </TiltCard>
                  );
                })}
              </div>

              {hasMore && (
                <div className="w-full flex justify-center mt-6">
                  <button onClick={() => setShowAll(true)} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 shadow-lg transition" style={{ background: GRAD, border: "none" }}>
                    See All {filtered.length} Listings
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              )}
              {showAll && !search && (
                <div className="w-full flex justify-center mt-6">
                  <button onClick={() => { setShowAll(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-white transition" style={{ background: "rgba(255,255,255,0.75)" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    Show Less
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="relative z-10 mx-4 md:mx-8 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <a href="" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-5 py-4 rounded-2xl group transition-all duration-200 hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(14px)", border: "1px solid rgba(88,101,242,0.18)", boxShadow: "0 4px 20px rgba(88,101,242,0.07)", textDecoration: "none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(88,101,242,0.10)" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" fill="#5865F2"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Join our Discord</p>
                <p className="text-xs text-gray-400">Chat with the community</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>

            <a href="" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-5 py-4 rounded-2xl group transition-all duration-200 hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(14px)", border: "1px solid rgba(225,48,108,0.15)", boxShadow: "0 4px 20px rgba(225,48,108,0.06)", textDecoration: "none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(225,48,108,0.08)" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-grad)" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="#E1306C"/>
                  <defs><linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse"><stop stopColor="#F58529"/><stop offset="0.5" stopColor="#E1306C"/><stop offset="1" stopColor="#833AB4"/></linearGradient></defs>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 group-hover:text-pink-600 transition-colors">Follow on Instagram</p>
                <p className="text-xs text-gray-400">Updates and new drops</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-pink-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>

            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(14px)", border: "1px solid rgba(0,170,255,0.15)", boxShadow: "0 4px 20px rgba(0,170,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.12),rgba(107,48,255,0.12))" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="url(#sell-grad)" strokeWidth={2}>
                  <defs><linearGradient id="sell-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00AAFF"/><stop offset="100%" stopColor="#6B30FF"/></linearGradient></defs>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">Start selling</p>
                <p className="text-xs text-gray-400">List for free, get verified</p>
              </div>
              <button onClick={() => { if (!uid) { navigate("/login"); return; } setShowSell(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-3.5 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition flex-shrink-0" style={{ background: GRAD, border: "none" }}>
                List Item
              </button>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-gray-400 text-center pb-6">&copy; {new Date().getFullYear()} Verifind</p>
      </div>
    </>
  );
}

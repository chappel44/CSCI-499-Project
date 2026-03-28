import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

const GRAD = "linear-gradient(135deg,#00AAFF,#6B30FF)";

const SELLER_DEALS: Record<string, number> = {
  Bob: 47, Jack: 83, Axel: 31, Chris: 12, Ryan: 64,
  Luca: 29, Finn: 8, Omar: 55, Noah: 102, Eli: 19,
};

const COND_STYLE: Record<string, { bg: string; color: string }> = {
  "New":  { bg: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)" },
  "Used": { bg: "rgba(245,158,11,0.12)", color: "rgb(180,110,0)" },
};

interface FavItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  seller_name: string | null;
  verified: boolean;
  source: "marketplace" | "wishlist";
}

const fmt = (p: number) => "$" + Number(p).toLocaleString("en-US", { minimumFractionDigits: 2 });

const MOCK_MAP: Record<string, FavItem> = Object.fromEntries([
  { id:"e1",  title:"Apple MacBook Pro 16-inch M3 Pro – Space Black",     price:2199.99, category:"electronics", condition:"Used", seller_name:"Bob",   verified:true,  images:["/img1.jpeg"]  },
  { id:"e2",  title:"Apple iPhone 16 Pro Max 256 GB – Natural Titanium",  price:1099.00, category:"electronics", condition:"New",  seller_name:"Jack",  verified:true,  images:["/img2.jpeg"]  },
  { id:"e3",  title:"Apple MacBook Air 15-inch M3 – Midnight",            price:1149.00, category:"electronics", condition:"Used", seller_name:"Axel",  verified:true,  images:["/img3.jpeg"]  },
  { id:"e4",  title:"Apple iPhone 15 128 GB – Pink – Unlocked",           price:649.00,  category:"electronics", condition:"Used", seller_name:"Chris", verified:false, images:["/img4.jpeg"]  },
  { id:"e5",  title:"Apple MacBook Pro 14-inch M3 – Silver",              price:1699.00, category:"electronics", condition:"Used", seller_name:"Ryan",  verified:true,  images:["/img5.jpeg"]  },
  { id:"e6",  title:"Apple iPhone 16 256 GB – Ultramarine",               price:799.00,  category:"electronics", condition:"New",  seller_name:"Luca",  verified:true,  images:["/img6.jpeg"]  },
  { id:"e7",  title:"Apple MacBook Air 13-inch M2 – Starlight",           price:849.00,  category:"electronics", condition:"Used", seller_name:"Finn",  verified:false, images:["/img7.jpeg"]  },
  { id:"e8",  title:"Apple iPhone 16 Pro 512 GB – Desert Titanium",       price:1249.00, category:"electronics", condition:"Used", seller_name:"Omar",  verified:true,  images:["/img8.jpeg"]  },
  { id:"e9",  title:"Apple MacBook Pro 16-inch M4 Pro – Space Black",     price:2699.00, category:"electronics", condition:"New",  seller_name:"Noah",  verified:true,  images:["/img9.jpeg"]  },
  { id:"e10", title:"Apple iPhone 15 Pro Max 256 GB – Natural Titanium",  price:899.00,  category:"electronics", condition:"Used", seller_name:"Eli",   verified:false, images:["/img10.jpeg"] },
  { id:"f1",  title:"Nike Tech Fleece Full-Zip Hoodie – Dark Grey – L",   price:89.99,  category:"fashion", condition:"Used", seller_name:"Jack",  verified:true,  images:["/img11.jpeg"] },
  { id:"f2",  title:"Uniqlo Ultra Light Down Jacket – Navy – M",          price:49.90,  category:"fashion", condition:"Used", seller_name:"Chris", verified:true,  images:["/img12.jpeg"] },
  { id:"f3",  title:"Nike Club Fleece Joggers – Black – M",               price:44.99,  category:"fashion", condition:"Used", seller_name:"Axel",  verified:false, images:["/img13.jpeg"] },
  { id:"f4",  title:"Uniqlo Merino Crew Neck Sweater – Camel – S",        price:39.90,  category:"fashion", condition:"Used", seller_name:"Bob",   verified:false, images:["/img14.jpeg"] },
  { id:"f5",  title:"Nike Windrunner Jacket – White Black – M",           price:74.99,  category:"fashion", condition:"Used", seller_name:"Ryan",  verified:true,  images:["/img15.jpeg"] },
  { id:"f6",  title:"Uniqlo Crew Neck T-Shirt 3-Pack – White – XL",      price:19.90,  category:"fashion", condition:"New",  seller_name:"Luca",  verified:false, images:["/img16.jpeg"] },
  { id:"f7",  title:"Nike Essential Running Jacket – Blue – S",           price:59.99,  category:"fashion", condition:"Used", seller_name:"Finn",  verified:false, images:["/img17.jpeg"] },
  { id:"f8",  title:"Uniqlo Kando Pants – Beige – 30x32",                price:34.90,  category:"fashion", condition:"Used", seller_name:"Omar",  verified:true,  images:["/img18.jpeg"] },
  { id:"f9",  title:"Nike Swoosh Graphic Tee – Black – XL",              price:29.99,  category:"fashion", condition:"Used", seller_name:"Noah",  verified:false, images:["/img19.jpeg"] },
  { id:"f10", title:"Uniqlo Fleece Full-Zip Jacket – Olive – L",         price:44.90,  category:"fashion", condition:"Used", seller_name:"Eli",   verified:false, images:["/img20.jpeg"] },
  { id:"j1",  title:"10K Gold 0.25ct Diamond Solitaire Ring – Size 7",   price:349.00, category:"jewellery", condition:"Used", seller_name:"Bob",   verified:true,  images:["/img21.jpeg"] },
  { id:"j2",  title:"14K Rose Gold Cuban Link Chain – 18in 4mm",         price:629.00, category:"jewellery", condition:"New",  seller_name:"Axel",  verified:true,  images:["/img22.jpeg"] },
  { id:"j3",  title:"Sterling Silver Hoop Earrings 40mm – Pair",         price:28.00,  category:"jewellery", condition:"New",  seller_name:"Chris", verified:false, images:["/img23.jpeg"] },
  { id:"j4",  title:"14K White Gold Diamond Tennis Bracelet 1ct",        price:895.00, category:"jewellery", condition:"Used", seller_name:"Ryan",  verified:true,  images:["/img24.png"]  },
  { id:"j5",  title:"Gold Plated Chunky Chain Necklace – 20in",          price:42.00,  category:"jewellery", condition:"Used", seller_name:"Luca",  verified:false, images:["/img25.jpeg"] },
  { id:"j6",  title:"925 Silver Vintage Signet Ring – Size 9",           price:65.00,  category:"jewellery", condition:"Used", seller_name:"Finn",  verified:false, images:["/img26.jpeg"] },
  { id:"j7",  title:"14K Gold Stud Earrings 0.5ct Total Diamonds",      price:425.00, category:"jewellery", condition:"Used", seller_name:"Omar",  verified:true,  images:["/img27.jpeg"] },
  { id:"j8",  title:"Rose Gold Minimalist Watch – Stainless Steel",      price:89.00,  category:"jewellery", condition:"Used", seller_name:"Noah",  verified:false, images:["/img28.jpeg"] },
  { id:"j9",  title:"10K Gold Rope Chain Necklace – 22in 2mm",          price:185.00, category:"jewellery", condition:"New",  seller_name:"Eli",   verified:true,  images:["/img29.jpeg"] },
  { id:"j10", title:"Aquamarine Silver Pendant Necklace – 18in",         price:55.00,  category:"jewellery", condition:"Used", seller_name:"Jack",  verified:false, images:["/img30.jpeg"] },
  { id:"s1",  title:"Nike Air Max 95 Triple Black – Men Size 10",        price:149.99, category:"sports", condition:"Used", seller_name:"Axel",  verified:true,  images:["/img31.jpeg"] },
  { id:"s2",  title:"Nike Tech Pack Woven Trousers – Black – M",         price:119.95, category:"sports", condition:"New",  seller_name:"Bob",   verified:true,  images:["/img32.jpeg"] },
  { id:"s3",  title:"Nike Air Force 1 White – Men Size 11",              price:89.99,  category:"sports", condition:"Used", seller_name:"Chris", verified:false, images:["/img33.jpeg"] },
  { id:"s4",  title:"Nike Dri-FIT Running Shorts – Grey – L",            price:34.99,  category:"sports", condition:"Used", seller_name:"Ryan",  verified:false, images:["/img34.jpeg"] },
  { id:"s5",  title:"Nike Air Max 270 React – White Volt – Size 9.5",    price:109.99, category:"sports", condition:"Used", seller_name:"Luca",  verified:true,  images:["/img35.jpeg"] },
  { id:"s6",  title:"Nike Pro Compression Tights – Black – M",           price:49.99,  category:"sports", condition:"New",  seller_name:"Finn",  verified:false, images:["/img36.jpeg"] },
  { id:"s7",  title:"Nike Metcon 9 Training Shoes – White Black – 10",   price:119.99, category:"sports", condition:"Used", seller_name:"Omar",  verified:true,  images:["/img37.jpeg"] },
  { id:"s8",  title:"Nike Pegasus 41 Running Shoes – Blue – 10.5",       price:129.99, category:"sports", condition:"Used", seller_name:"Noah",  verified:false, images:["/img38.jpeg"] },
  { id:"s9",  title:"Nike Tech Fleece Joggers – Navy – L",               price:79.99,  category:"sports", condition:"Used", seller_name:"Eli",   verified:true,  images:["/img39.jpeg"] },
  { id:"s10", title:"Nike Air Max 1 – Wheat Gum – Men Size 9",           price:139.99, category:"sports", condition:"Used", seller_name:"Jack",  verified:false, images:["/img40.jpeg"] },
].map(i => [i.id, { ...i, source: "marketplace" as const }]));

export default function FavouritesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) { setLoading(false); return; }
      setUid(u.id);

      // Load saved marketplace IDs from Supabase
      const { data: saves } = await supabase
        .from("marketplace_saves")
        .select("listing_id")
        .eq("user_id", u.id);

      const savedFromDb = new Set<string>((saves ?? []).map((r: { listing_id: string }) => r.listing_id));

      // Also merge localStorage (mock saves)
      const localRaw = localStorage.getItem("verifind_saved_mock");
      const localIds: string[] = localRaw ? JSON.parse(localRaw) : [];
      const allIds = new Set<string>([...savedFromDb, ...localIds]);

      // Build item list from mock map + fetch real DB listings
      const mockItems: FavItem[] = [...allIds]
        .filter(id => MOCK_MAP[id])
        .map(id => MOCK_MAP[id]);

      const dbIds = [...allIds].filter(id => !MOCK_MAP[id]);
      let dbItems: FavItem[] = [];
      if (dbIds.length > 0) {
        const { data: rows } = await supabase
          .from("marketplace_listings")
          .select("id,title,price,images,category,condition,seller_name,verified")
          .in("id", dbIds);
        dbItems = (rows ?? []).map((r: any) => ({ ...r, source: "marketplace" as const, condition: ["New","Used"].includes(r.condition) ? r.condition : "Used" }));
      }

      // Load wishlist items (those with hearts from WishList page)
      const wlRaw = localStorage.getItem("verifind_wishlist_favs");
      const wlItems: FavItem[] = wlRaw ? JSON.parse(wlRaw) : [];

      setItems([...mockItems, ...dbItems, ...wlItems]);
      setLoading(false);
    });
  }, []);

  const unsave = async (id: string, source: string) => {
    setItems(prev => prev.filter(x => x.id !== id));

    if (source === "wishlist") {
      const wlRaw = localStorage.getItem("verifind_wishlist_favs");
      const wl: FavItem[] = wlRaw ? JSON.parse(wlRaw) : [];
      localStorage.setItem("verifind_wishlist_favs", JSON.stringify(wl.filter(x => x.id !== id)));
      return;
    }

    if (MOCK_MAP[id]) {
      const localRaw = localStorage.getItem("verifind_saved_mock");
      const local: string[] = localRaw ? JSON.parse(localRaw) : [];
      localStorage.setItem("verifind_saved_mock", JSON.stringify(local.filter(x => x !== id)));
    } else if (uid) {
      await supabase.from("marketplace_saves").delete().eq("user_id", uid).eq("listing_id", id);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#f0f4ff" }}>
      {/* BG orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "55vw", height: "55vw", maxWidth: 700, maxHeight: 700, background: "radial-gradient(circle,rgba(0,170,255,0.14) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: "45vw", height: "45vw", maxWidth: 600, maxHeight: 600, background: "radial-gradient(circle,rgba(107,48,255,0.10) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 transition" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
          {items.length > 0 && <span className="px-2.5 py-1 rounded-lg text-sm font-semibold text-white" style={{ background: GRAD }}>{items.length}</span>}
        </div>
        <p className="text-sm text-gray-500 mb-8 ml-12">Everything you've hearted from the Marketplace and Wish List.</p>

        {loading && (
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden w-56" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.8)" }}>
                <div className="animate-pulse" style={{ height: 160, background: "linear-gradient(135deg,rgba(0,170,255,0.08),rgba(107,48,255,0.08))" }} />
                <div className="p-3.5 flex flex-col gap-2">
                  {[3/4, 1/2, 1/3].map((w, j) => <div key={j} className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${w*100}%` }} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <svg className="w-9 h-9 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-2">Nothing saved yet</p>
            <p className="text-gray-400 text-sm mb-6">Heart items in the Marketplace or Wish List to save them here.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/marketplace")} className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>Browse Marketplace</button>
              <button onClick={() => navigate("/wish-list")} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-white transition" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.1)" }}>Wish List</button>
            </div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex flex-wrap gap-5">
            {items.map((item) => {
              const c = COND_STYLE[item.condition] ?? COND_STYLE["Used"];
              const deals = SELLER_DEALS[item.seller_name ?? ""] ?? 0;
              const imgs = Array.isArray(item.images) ? item.images : [];

              return (
                <div key={item.id} className="rounded-2xl overflow-hidden flex flex-col w-56 transition-all duration-200 hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ height: 156 }}>
                    {imgs.length > 0 ? (
                      <img src={imgs[0]} alt={item.title} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "center", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.07),rgba(107,48,255,0.07))" }}>
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {item.source === "wishlist" && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-indigo-700" style={{ background: "rgba(107,48,255,0.12)" }}>Wish List</div>
                    )}
                    {item.verified && item.source === "marketplace" && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: GRAD }}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Verified
                      </div>
                    )}
                    <button onClick={() => unsave(item.id, item.source)} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition hover:scale-110" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer" }}>
                      <svg className="w-3.5 h-3.5" fill="#EF4444" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 self-start" style={{ background: c.bg, color: c.color }}>{item.condition}</span>
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 flex-1">{item.title}</h3>
                    <p className="text-base font-extrabold mb-1" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(item.price)}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: GRAD }}>
                        {(item.seller_name ?? "?")[0].toUpperCase()}
                      </div>
                      <span className="text-[10px] text-gray-500 truncate">{item.seller_name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{deals} deals</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="px-3.5 pb-3.5 flex gap-2">
                    <button onClick={() => navigate("/cart", { state: { item: { ...item, qty: 1 } } })} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>
                      Add to Cart
                    </button>
                    <button onClick={() => navigate(item.source === "wishlist" ? "/wish-list" : "/marketplace")} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition" style={{ border: "none" }}>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

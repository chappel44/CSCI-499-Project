import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const GRAD = "linear-gradient(135deg,#00AAFF,#6B30FF)";

//promo extras
const PROMO_TIERS = [
  { name: "Basic",    price: 2.99,  period: "wk", desc: "Top of category",          highlight: false },
  { name: "Featured", price: 7.99,  period: "wk", desc: "Homepage spotlight",        highlight: true  },
  { name: "Premium",  price: 14.99, period: "wk", desc: "Search + category + email", highlight: false },
];

//promotion
function PromoteModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>("Featured");
  const [success, setSuccess]   = useState(false);

  if (success) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4" style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Listing promoted!</h3>
          <p className="text-sm text-gray-500 mb-6">Your listing is now featured. Buyers will see it first.</p>
          <button onClick={() => { onClose(); navigate("/marketplace"); }} className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>Back to Marketplace</button>
        </div>
      </div>
    );
  }

  const tier = PROMO_TIERS.find(t => t.name === selected);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4" style={{ color: "rgb(245,158,11)" }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Promote your listing</h3>
            </div>
            <p className="text-xs text-gray-400">Get seen by thousands of buyers every week.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Tier selector */}
          <div className="flex flex-col gap-2.5 mb-5">
            {PROMO_TIERS.map(t => (
              <button
                key={t.name}
                onClick={() => setSelected(t.name)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left"
                style={{
                  background: selected === t.name ? (t.highlight ? "rgba(245,158,11,0.08)" : "rgba(107,48,255,0.06)") : "rgba(0,0,0,0.025)",
                  border: selected === t.name ? `1.5px solid ${t.highlight ? "rgba(245,158,11,0.4)" : "rgba(107,48,255,0.35)"}` : "1.5px solid rgba(0,0,0,0.07)",
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: selected === t.name ? (t.highlight ? "rgb(245,158,11)" : "#6B30FF") : "rgba(0,0,0,0.2)" }}>
                    {selected === t.name && <div className="w-2 h-2 rounded-full" style={{ background: t.highlight ? "rgb(245,158,11)" : "#6B30FF" }} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${t.highlight ? "text-amber-700" : "text-gray-800"}`}>
                      {t.name}
                      {t.highlight && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "rgb(180,83,9)" }}>Popular</span>}
                    </p>
                    <p className="text-xs text-gray-400">{t.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold flex-shrink-0" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>${t.price}/wk</span>
              </button>
            ))}
          </div>

          {/* Summary */}
          {tier && (
            <div className="px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Plan</span><span className="font-semibold text-gray-800">{tier.name}</span></div>
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Billed</span><span>Weekly</span></div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 mt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <span>Total / week</span>
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>${tier.price.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setSuccess(true)}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
            style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)", border: "none" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Start promoting — ${tier?.price.toFixed(2) ?? "7.99"}/wk
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-2">Cancel anytime · No long-term contract</p>
        </div>
      </div>
    </div>
  );
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  seller_name: string | null;
  qty: number;
  stock: number; //max purchasable quantity
}

const fmt = (p: number) =>
  "$" + Number(p).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CAT_ICON: Record<string, React.ReactNode> = {
  electronics: (
    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  fashion: (
    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  jewellery: (
    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  sports: (
    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const d = raw.replace(/\D/g, "").substring(0, 4);
  return d.length >= 3 ? d.substring(0, 2) + " / " + d.substring(2) : d;
}

function luhn(num: string): boolean {
  const digits = num.replace(/\s/g, "").split("").reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    return acc + d;
  }, 0);
  return sum % 10 === 0;
}

function detectBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "";
}

//checkout
function CheckoutForm({ cart, onSuccess }: { cart: CartItem[]; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", address: "", city: "", zip: "", country: "US",
    card: "", expiry: "", cvc: "",
  });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const sub   = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const ship  = sub > 500 ? 0 : 9.99;
  const tax   = sub * 0.0875;
  const total = sub + ship + tax;
  const brand = detectBrand(form.card);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.zip.trim()) e.zip = "Required";

    const rawCard = form.card.replace(/\s/g, "");
    if (rawCard.length < 13 || !luhn(rawCard)) e.card = "Invalid card number";

    const parts = form.expiry.replace(/\s/g, "").split("/");
    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
      e.expiry = "MM / YY required";
    } else {
      const m = parseInt(parts[0], 10);
      const y = parseInt("20" + parts[1], 10);
      const now = new Date();
      if (m < 1 || m > 12) e.expiry = "Invalid month";
      else if (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth() + 1)) e.expiry = "Card expired";
    }

    if (form.cvc.replace(/\D/g, "").length < 3) e.cvc = "3–4 digits required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onSuccess(); }, 1400);
  };

  const iSt = (f: string): React.CSSProperties => ({
    background: errors[f] ? "rgba(239,68,68,0.04)" : "#f8faff",
    border: `1px solid ${errors[f] ? "#fca5a5" : "rgba(0,0,0,0.1)"}`,
    fontFamily: "inherit",
  });
  const iCls = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors";
  const lbl  = "text-xs text-gray-500 mb-1 block font-medium";
  const err  = (f: string) => errors[f] ? <p className="text-[10px] text-red-400 mt-1">{errors[f]}</p> : null;

  return (
    <form onSubmit={handlePay} noValidate>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Contact</p>
      <div className="flex flex-col gap-2.5 mb-5">
        <div><label className={lbl}>Full name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className={iCls} style={iSt("name")} />{err("name")}</div>
        <div><label className={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" className={iCls} style={iSt("email")} />{err("email")}</div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Shipping address</p>
      <div className="flex flex-col gap-2.5 mb-5">
        <div><label className={lbl}>Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" className={iCls} style={iSt("address")} />{err("address")}</div>
        <div className="flex gap-2">
          <div className="flex-1"><label className={lbl}>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New York" className={iCls} style={iSt("city")} />{err("city")}</div>
          <div style={{ flex: "0 0 90px" }}><label className={lbl}>ZIP</label><input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="10001" className={iCls} style={iSt("zip")} />{err("zip")}</div>
        </div>
        <div>
          <label className={lbl}>Country</label>
          <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className={iCls} style={{ ...iSt("country"), cursor: "pointer" }}>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment</p>
      <div className="flex gap-1.5 mb-3">
        {["Visa", "Mastercard", "Amex", "Discover"].map(b => (
          <span key={b} className="px-2 py-0.5 rounded text-[10px] font-bold transition-all" style={{ border: "1px solid rgba(0,0,0,0.1)", color: brand === b ? "#6B30FF" : "#9ca3af", borderColor: brand === b ? "rgba(107,48,255,0.4)" : "rgba(0,0,0,0.1)", background: brand === b ? "rgba(107,48,255,0.06)" : "transparent" }}>
            {b}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 mb-5">
        <div>
          <label className={lbl}>Card number</label>
          <input value={form.card} onChange={e => setForm(f => ({ ...f, card: formatCardNumber(e.target.value) }))} placeholder="4242 4242 4242 4242" maxLength={19} className={iCls} style={{ ...iSt("card"), letterSpacing: "0.06em" }} />
          {err("card")}
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><label className={lbl}>Expiry</label><input value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))} placeholder="MM / YY" maxLength={7} className={iCls} style={iSt("expiry")} />{err("expiry")}</div>
          <div className="flex-1"><label className={lbl}>CVC</label><input type="password" value={form.cvc} onChange={e => setForm(f => ({ ...f, cvc: e.target.value.replace(/\D/g, "").substring(0, 4) }))} placeholder="..." maxLength={4} className={iCls} style={iSt("cvc")} />{err("cvc")}</div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.07)", margin: "16px 0" }} />
      <div className="flex flex-col gap-1.5 mb-5">
        {[["Subtotal", fmt(sub)], ["Shipping", sub > 500 ? "Free" : fmt(ship)], ["Tax (8.75%)", fmt(tax)]].map(([l, v]) => (
          <div key={l} className="flex justify-between text-sm text-gray-500"><span>{l}</span><span>{v}</span></div>
        ))}
        <div className="flex justify-between text-base font-bold text-gray-900 mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <span>Total</span>
          <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(total)}</span>
        </div>
      </div>

      <button type="submit" disabled={processing} className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60" style={{ background: GRAD, border: "none" }}>
        {processing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Pay {fmt(total)}
          </>
        )}
      </button>
      <p className="text-center text-[11px] text-gray-400 mt-2">Secured · 256-bit TLS encryption</p>
    </form>
  );
}

//cartpage
export default function CartPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart]         = useState<CartItem[]>([]);
  const [success, setSuccess]   = useState(false);
  const [showPromote, setShowPromote] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("verifind_cart");
    let existing: CartItem[] = stored ? JSON.parse(stored) : [];
    const incoming = (location.state as any)?.item as CartItem | undefined;
    if (incoming) {
      const maxStock = incoming.stock ?? 1;
      const found = existing.find(x => x.id === incoming.id);
      if (found) {
        found.qty = Math.min(maxStock, (found.qty ?? 1) + 1);
      } else {
        existing = [...existing, { ...incoming, qty: 1, stock: maxStock }];
      }
      sessionStorage.setItem("verifind_cart", JSON.stringify(existing));
      window.history.replaceState({}, "");
    }
    setCart(existing);
  }, []);

  const persist = (updated: CartItem[]) => {
    setCart(updated);
    sessionStorage.setItem("verifind_cart", JSON.stringify(updated));
  };
  const remove    = (id: string) => persist(cart.filter(x => x.id !== id));
  const changeQty = (id: string, d: number) => persist(
    cart.map(x => x.id === id
      ? { ...x, qty: Math.min(x.stock ?? 1, Math.max(1, x.qty + d)) }
      : x
    )
  );

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20" style={{ background: "#f0f4ff" }}>
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position: "absolute", top: "20%", left: "10%", width: "50vw", height: "50vw", maxWidth: 600, maxHeight: 600, background: "radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(60px)" }} />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white mx-auto mb-6" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 8px 32px rgba(16,185,129,0.35)" }}>
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Order confirmed!</h2>
          <p className="text-gray-500 text-base mb-2">Your order has been received and is being processed.</p>
          <p className="text-gray-400 text-sm mb-8">A confirmation will be sent to your email address.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { persist([]); navigate("/marketplace"); }} className="px-6 py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>Continue Shopping</button>
            <button onClick={() => navigate("/favourites")} className="px-6 py-3 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-white transition" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.1)" }}>View Saved Items</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    {showPromote && <PromoteModal onClose={() => setShowPromote(false)} />}
    <div className="min-h-screen" style={{ background: "#f0f4ff" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "55vw", height: "55vw", maxWidth: 700, maxHeight: 700, background: "radial-gradient(circle,rgba(0,170,255,0.14) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: "45vw", height: "45vw", maxWidth: 600, maxHeight: 600, background: "radial-gradient(circle,rgba(107,48,255,0.11) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 transition" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          {cart.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-sm font-semibold text-white" style={{ background: GRAD }}>
              {cart.reduce((a, c) => a + c.qty, 0)} item{cart.reduce((a, c) => a + c.qty, 0) !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {cart.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <svg className="w-9 h-9 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-2">Your cart is empty</p>
            <p className="text-gray-400 text-sm mb-6">Browse the marketplace to find something great.</p>
            <button onClick={() => navigate("/marketplace")} className="px-6 py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>Browse Marketplace</button>
          </div>
        )}

        {cart.length > 0 && (
          <div className="flex flex-wrap gap-6 items-start">
            {/* Items */}
            <div style={{ flex: "1.4", minWidth: 280 }}>
              <div className="flex flex-col gap-3">
                {cart.map((item) => {
                  const imgs = Array.isArray(item.images) ? item.images : [];
                  return (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl items-start" style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                      {imgs.length > 0 ? (
                        <img src={imgs[0]} alt={item.title} className="rounded-xl flex-shrink-0" style={{ width: 84, height: 84, objectFit: "cover", objectPosition: "center" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="rounded-xl flex-shrink-0 flex items-center justify-center" style={{ width: 84, height: 84, background: "linear-gradient(135deg,rgba(0,170,255,0.07),rgba(107,48,255,0.07))" }}>
                          {CAT_ICON[item.category] ?? <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug mb-0.5 line-clamp-2">{item.title}</p>
                        <p className="text-xs text-gray-400 mb-2 capitalize">{item.condition} · {item.category}{item.seller_name ? ` · ${item.seller_name}` : ""}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(item.price)}</p>
                          <div className="flex items-center gap-1 ml-auto">
                            <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-200 transition" style={{ background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer" }}>
                              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                            </button>
                            <span className="text-sm font-semibold text-gray-800 w-5 text-center">{item.qty}</span>
                            <button
                              onClick={() => changeQty(item.id, 1)}
                              disabled={item.qty >= (item.stock ?? 1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center transition"
                              style={{ background: item.qty >= (item.stock ?? 1) ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.05)", border: "none", cursor: item.qty >= (item.stock ?? 1) ? "not-allowed" : "pointer", opacity: item.qty >= (item.stock ?? 1) ? 0.35 : 1 }}
                            >
                              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => remove(item.id)} className="text-xs font-semibold text-red-400 hover:text-red-600 transition ml-2" style={{ background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.qty > 1 && <p className="text-[10px] text-gray-400">Subtotal: {fmt(item.price * item.qty)}</p>}
                          {(item.stock ?? 1) > 1 && (
                            <p className="text-[10px]" style={{ color: item.qty >= (item.stock ?? 1) ? "rgb(185,28,28)" : "rgb(107,114,128)" }}>
                              {item.qty >= (item.stock ?? 1) ? `Max ${item.stock} reached` : `${item.stock} available`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => navigate("/favourites")} className="mt-4 w-full p-3.5 rounded-2xl flex items-center gap-3 text-left hover:bg-white/70 transition" style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(107,48,255,0.12)", cursor: "pointer" }}>
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                <span className="text-sm text-gray-600">View your saved and hearted items</span>
                <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>

              {/* Promote nudge */}
              <button
                onClick={() => setShowPromote(true)}
                className="mt-3 w-full p-3.5 rounded-2xl flex items-center gap-3 text-left hover:bg-white/70 transition"
                style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(245,158,11,0.25)", cursor: "pointer" }}
              >
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: "rgb(245,158,11)" }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Promote your listing</p>
                  <p className="text-[10px] text-gray-400">Featured spots from $2.99/wk · Cancel anytime</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Checkout panel */}
            <div className="rounded-2xl p-6" style={{ flex: 1, minWidth: 300, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Checkout</h3>
              <CheckoutForm cart={cart} onSuccess={() => { persist([]); setSuccess(true); }} />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

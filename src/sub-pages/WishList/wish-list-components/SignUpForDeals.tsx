import { useState } from "react";
import handleDealSignup from "../wishlist-custom-hooks/useHandleDealSignup";

export default function SignUpForDeals() {
  const [dealEmail, setDealEmail] = useState(""); // Sign Up for More Deals
  const [dealSent, setDealSent] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);

  return (
    <div
      className="wishlist-deals-card w-full max-w-md rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.75)",
        boxShadow: "0 12px 40px rgba(31,38,135,0.14)",
      }}
    >
      <h3 className="text-base font-bold text-gray-900 mb-3">
        Sign Up for More Deals
      </h3>
      <div className="flex w-full gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          value={dealEmail}
          onChange={(e) => {
            setDealEmail(e.target.value);
            setDealSent(false);
          }}
          className="wishlist-deals-input flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none transition"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        />
        <button
          onClick={() =>
            handleDealSignup(
              dealEmail,
              setDealLoading,
              setDealSent,
              setDealEmail
            )
          }
          disabled={dealLoading || !dealEmail.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md disabled:opacity-60"
          style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
        >
          {dealLoading ? "Sending..." : dealSent ? "Sent! ✓" : "Sign Up"}
        </button>
      </div>
      {dealSent && (
        <p className="text-xs text-green-500 mt-2">
          Check your inbox — a test deal email is on its way!
        </p>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase-client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setSent(false);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-10 flex flex-col items-center">
            <div className="flex items-center gap-2.5 mb-6">
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <defs>
                  <linearGradient
                    id="forgot-lg"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#00AAFF" />
                    <stop offset="100%" stopColor="#6B30FF" />
                  </linearGradient>
                </defs>
                <circle
                  cx="22"
                  cy="22"
                  r="14"
                  fill="rgba(0,170,255,0.1)"
                  stroke="url(#forgot-lg)"
                  strokeWidth="2.4"
                />
                <polyline
                  points="14,22 20,28 31,15"
                  fill="none"
                  stroke="url(#forgot-lg)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="31"
                  y1="31"
                  x2="42"
                  y2="42"
                  stroke="url(#forgot-lg)"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Verifind
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1 self-start">
              Reset your password
            </h2>
            <p className="text-sm text-gray-400 mb-6 self-start">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSendReset} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500">{errorMessage}</p>
              )}

              {sent && (
                <p className="text-xs text-green-600">
                  Reset link sent. Check your email for the next step.
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="flex items-center gap-3 w-full my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-sm text-gray-500">
              Remembered it?{" "}
              <Link
                to="/login"
                className="font-semibold hover:underline"
                style={{
                  background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

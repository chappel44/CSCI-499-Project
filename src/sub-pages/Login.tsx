import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [welcomeUsername, setWelcomeUsername] = useState<string | null>(null); // for welcome message
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Enter your email first");
      return;
    }
    const {error} = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      alert(error.message);
    } else {
      alert("Password reset email sent!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Logging in with:", { email, password });
    console.log("Form submitted!");

  

    // connected with supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    const username = data.user?.user_metadata?.username ?? "there";
    setWelcomeUsername(username); // show welcome message before redirecting
    setTimeout(() => {
      navigate("/"); // bring user to homepage on successful login can do navigate(-1) to go to last page
    }, 1800);
  };

  // welcome screen shown briefly after login
  if (welcomeUsername) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
            style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
          >
            <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
              <polyline
                points="10,26 20,36 42,14"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Welcome, {welcomeUsername}!
          </h2>
          <p className="text-sm text-gray-400">Taking you to Verifind...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Top accent bar */}
          <div
            className="h-1 w-full"
            style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
          />

          <div className="px-8 py-10 flex flex-col items-center">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-2">
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <defs>
                  <linearGradient
                    id="login-lg"
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
                  stroke="url(#login-lg)"
                  strokeWidth="2.4"
                />
                <polyline
                  points="14,22 20,28 31,15"
                  fill="none"
                  stroke="url(#login-lg)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="31"
                  y1="31"
                  x2="42"
                  y2="42"
                  stroke="url(#login-lg)"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  background:
                    "linear-gradient(90deg,#1A1A2E 43%,#0088DD 44%,#6B30FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Verifind
              </span>
            </div>

            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-8">
              Smart Shopping Platform
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-1 self-start">
              Welcome To Verifind
            </h2>
            <p className="text-sm text-gray-400 mb-6 self-start">
              Sign in to your account
            </p>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              {/* Email */}
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

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Sign up link */}
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold hover:underline"
                style={{
                  background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} VeriFind. All rights reserved.
        </p>
      </div>
    </div>
  );
}

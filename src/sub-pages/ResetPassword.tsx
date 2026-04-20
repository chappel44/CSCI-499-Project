import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const ensureRecoverySession = async () => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const recoveryType = hash.get("type");
    const code = new URLSearchParams(window.location.search).get("code");

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && data.session) return true;
    }

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session) return true;
    }

    if (recoveryType === "recovery" && accessToken) {
      return true;
    }

    const { data } = await supabase.auth.getSession();
    return !!data.session;
  };

  useEffect(() => {
    void (async () => {
      const canReset = await ensureRecoverySession();
      setReady(canReset);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || !!session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode = search.get("error_code") || hash.get("error_code");
    const error = search.get("error") || hash.get("error");

    if (errorCode === "otp_expired" || error === "access_denied") {
      setErrorMessage("This reset link is invalid or expired. Please request a new one.");
    }
  }, []);

  const passwordInvalid =
    newPassword.length < 8 ||
    !/\d/.test(newPassword) ||
    !/[@$!%*?&]/.test(newPassword) ||
    newPassword !== confirmPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInvalid || loading) return;

    setLoading(true);
    setSaved(false);
    setErrorMessage(null);

    const canReset = await ensureRecoverySession();

    if (!canReset) {
      setErrorMessage("This reset link is invalid or expired. Please request a new one.");
      setLoading(false);
      setReady(false);
      return;
    }

    setReady(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSaved(true);
      setTimeout(() => navigate("/login"), 1500);
    }

    setLoading(false);
  };

  const requirements = [
    { label: "8+ characters", test: newPassword.length >= 8 },
    { label: "Contains a number", test: /\d/.test(newPassword) },
    { label: "Contains a special character", test: /[@$!%*?&]/.test(newPassword) },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-10 flex flex-col items-center">
            <div className="flex items-center gap-2.5 mb-6">
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <defs>
                  <linearGradient id="reset-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00AAFF" />
                    <stop offset="100%" stopColor="#6B30FF" />
                  </linearGradient>
                </defs>
                <circle
                  cx="22"
                  cy="22"
                  r="14"
                  fill="rgba(0,170,255,0.1)"
                  stroke="url(#reset-lg)"
                  strokeWidth="2.4"
                />
                <polyline
                  points="14,22 20,28 31,15"
                  fill="none"
                  stroke="url(#reset-lg)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="31"
                  y1="31"
                  x2="42"
                  y2="42"
                  stroke="url(#reset-lg)"
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
              Create a new password
            </h2>
            <p className="text-sm text-gray-400 mb-6 self-start">
              Choose a new password for your account.
            </p>

            {!ready && !saved && (
              <p className="w-full text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                Open the reset link from your email to continue.
              </p>
            )}

            <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {requirements.map((req) => (
                      <div
                        key={req.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          req.test ? "text-green-500" : "text-gray-400"
                        }`}
                      >
                        <span>{req.test ? "OK" : "..."}</span>
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10 ${
                      confirmPassword.length > 0 && confirmPassword !== newPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}

              {saved && (
                <p className="text-xs text-green-600">
                  Password updated. Taking you back to login...
                </p>
              )}

              <button
                type="submit"
                disabled={loading || passwordInvalid}
                className="w-full mt-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {loading ? "Saving..." : "Save New Password"}
              </button>
            </form>

            <div className="flex items-center gap-3 w-full my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-sm text-gray-500">
              Back to{" "}
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
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

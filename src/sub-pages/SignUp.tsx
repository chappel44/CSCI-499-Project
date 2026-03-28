import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // so that we can send to Login Page :)
import { supabase } from "../supabase-client";

const SIGNUP_COOLDOWN_SECONDS = 45;
const SIGNUP_FAIL_LIMIT = 4;
const SIGNUP_FAIL_KEY = "signup-failed-attempts";
const SIGNUP_LOCK_KEY = "signup-locked-until";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false); // Tracks whether signup succeeded so we can show the confirmation modal.
  const [okClicked, setOkClicked] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const lockedUntil = Number(window.sessionStorage.getItem(SIGNUP_LOCK_KEY));
    if (!lockedUntil) return;

    const nextRemaining = Math.max(
      Math.ceil((lockedUntil - Date.now()) / 1000),
      0
    );
    setCooldownRemaining(nextRemaining);
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          window.sessionStorage.removeItem(SIGNUP_LOCK_KEY);
          window.sessionStorage.removeItem(SIGNUP_FAIL_KEY);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldownRemaining > 0) return; // Prevents duplicate requests if the user clicks submit more than once.

    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim() }, // stores username in raw_user_meta_data so the trigger can pick it up
        },
      });

      if (error) {
        const failedAttempts =
          Number(window.sessionStorage.getItem(SIGNUP_FAIL_KEY) ?? "0") + 1;
        window.sessionStorage.setItem(
          SIGNUP_FAIL_KEY,
          failedAttempts.toString()
        );

        if (failedAttempts >= SIGNUP_FAIL_LIMIT) {
          const lockedUntil = Date.now() + SIGNUP_COOLDOWN_SECONDS * 1000;
          window.sessionStorage.setItem(
            SIGNUP_LOCK_KEY,
            lockedUntil.toString()
          );
          setCooldownRemaining(SIGNUP_COOLDOWN_SECONDS);
          setErrorMessage(
            `Too many sign up attempts. Please wait ${SIGNUP_COOLDOWN_SECONDS}s and try again.`
          );
        } else {
          setErrorMessage(
            "We could not create the account with those details."
          );
        }

        return; // Exit early on Supabase errors and let finally reset the loading state.
      }

      window.sessionStorage.removeItem(SIGNUP_FAIL_KEY);
      window.sessionStorage.removeItem(SIGNUP_LOCK_KEY);
      setSignUpSuccess(true); // Opens the success modal after a successful signup request.
    } finally {
      setLoading(false); // Always re-enable the submit button, even if signup fails or succeeds.
    }
  };

  const displaySignUpAlert = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-10">
        <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
          <p className="text-center mb-4 text-black">
            <strong className="text-3xl">Sign up successful!</strong> <br />
            Check your email to confirm your account. <br />
            Look for a message from <strong>Supabase</strong> and click the
            verification link.
          </p>
          <button
            onClick={() => {
              setOkClicked(true);
              setSignUpSuccess(false); // Closes the success modal after the user confirms it.
            }}
            className="w-full rounded bg-black text-white py-2 cursor-pointer hover:opacity-80"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  //password requirments
  const requirements = [
    { label: "8+ characters", test: password.length >= 8 },
    { label: "Contains a number", test: /\d/.test(password) },
    { label: "Contains a special character", test: /[@$!%*?&]/.test(password) },
  ];

  //password submit button logic
  const isInvalid =
    !username.trim() ||
    password.length < 8 ||
    !/\d/.test(password) ||
    !/[@$!%*?&]/.test(password) ||
    confirmPassword !== password ||
    cooldownRemaining > 0;

  useEffect(() => {
    if (okClicked) {
      navigate("/login");
    }
  }, [okClicked, navigate]); // Includes navigate to satisfy the effect dependency requirements.

  return (
    <>
      {signUpSuccess && displaySignUpAlert()}{" "}
      {/* Only render the modal after a successful signup. */}
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-10 flex flex-col items-center">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-2">
                <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                  <defs>
                    <linearGradient
                      id="signup-lg"
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
                    stroke="url(#signup-lg)"
                    strokeWidth="2.4"
                  />
                  <polyline
                    points="14,22 20,28 31,15"
                    fill="none"
                    stroke="url(#signup-lg)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="31"
                    y1="31"
                    x2="42"
                    y2="42"
                    stroke="url(#signup-lg)"
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

              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-8">
                Smart Shopping Platform
              </p>

              <h2 className="text-xl font-bold text-gray-900 mb-1 self-start">
                Create an account
              </h2>
              <p className="text-sm text-gray-400 mb-6 self-start">
                Start finding better deals today
              </p>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-4"
              >
                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                </div>

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
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Password
                  </label>
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

                  {/* Password requirements */}
                  {password.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {requirements.map((req, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                            req.test ? "text-green-500" : "text-gray-400"
                          }`}
                        >
                          <span className="text-xs">
                            {req.test ? "✔" : "○"}
                          </span>
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
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10 ${
                        confirmPassword.length > 0 &&
                        confirmPassword !== password
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
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
                  {confirmPassword.length > 0 &&
                    confirmPassword !== password && (
                      <p className="text-xs text-red-400 mt-1">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-500">{errorMessage}</p>
                )}

                {cooldownRemaining > 0 && (
                  <p className="text-xs text-amber-600">
                    Please wait {cooldownRemaining}s before trying to create
                    another account.
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isInvalid || loading}
                  className="w-full mt-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      isInvalid || loading
                        ? "#E5E7EB"
                        : "linear-gradient(90deg,#00AAFF,#6B30FF)",
                    color: isInvalid || loading ? "#6B7280" : "#FFFFFF",
                  }}
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
                      Creating account...
                    </>
                  ) : cooldownRemaining > 0 ? (
                    `Wait ${cooldownRemaining}s`
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Login link */}
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
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

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            &copy; {new Date().getFullYear()} VeriFind. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}

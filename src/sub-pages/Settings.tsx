import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

export default function Settings() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [username, setUsername] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // connected with supabase — redirect to login if not authenticated
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login");
      } else {
        const name = data.session.user.user_metadata?.username ?? "";
        setUsername(name);
        setCurrentUsername(name);
      }
    });
  }, []);

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    setUsernameLoading(true);
    setUsernameSaved(false);

    // connected with supabase — get current user id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not logged in.");
      setUsernameLoading(false);
      return;
    }

    // connected with supabase — update username in user_metadata
    const { error: metaError } = await supabase.auth.updateUser({
      data: { username: username.trim() },
    });

    if (metaError) {
      alert("Failed to update username: " + metaError.message);
      setUsernameLoading(false);
      return;
    }

    // connected with supabase — update username in profiles table so the database stays in sync
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id);

    if (profileError) {
      alert("Failed to update profile table: " + profileError.message);
      setUsernameLoading(false);
      return;
    }

    setCurrentUsername(username.trim());
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 3000);
    setUsernameLoading(false);
  };

  //password requirments
  const requirements = [
    { label: "8+ characters", test: newPassword.length >= 8 },
    { label: "Contains a number", test: /\d/.test(newPassword) },
    { label: "Contains a special character", test: /[@$!%*?&]/.test(newPassword) },
  ];

  //password submit button logic
  const passwordInvalid =
    newPassword.length < 8 ||
    !/\d/.test(newPassword) ||
    !/[@$!%*?&]/.test(newPassword) ||
    newPassword !== confirmPassword;

  const handleSavePassword = async () => {
    if (passwordInvalid) return;
    setPasswordLoading(true);
    setPasswordSaved(false);

    // connected with supabase — update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert("Failed to update password: " + error.message);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    }

    setPasswordLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Username Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }} />

          <div className="px-8 py-8 flex flex-col items-center">

            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-2">
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <defs>
                  <linearGradient id="settings-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00AAFF" />
                    <stop offset="100%" stopColor="#6B30FF" />
                  </linearGradient>
                </defs>
                <circle cx="22" cy="22" r="14" fill="rgba(0,170,255,0.1)" stroke="url(#settings-lg)" strokeWidth="2.4" />
                <polyline points="14,22 20,28 31,15" fill="none" stroke="url(#settings-lg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="31" y1="31" x2="42" y2="42" stroke="url(#settings-lg)" strokeWidth="3.4" strokeLinecap="round" />
              </svg>
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg,#1A1A2E 43%,#0088DD 44%,#6B30FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Verifind
              </span>
            </div>

            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-6">
              Account Settings
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-1 self-start">Change Username</h2>
            <p className="text-sm text-gray-400 mb-6 self-start">
              Current: <span className="font-semibold text-gray-700">{currentUsername || "—"}</span>
            </p>

            <div className="w-full flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                New Username
              </label>
              <input
                type="text"
                placeholder="Enter new username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameSaved(false); }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>

            <button
              onClick={handleSaveUsername}
              disabled={usernameLoading || !username.trim() || username.trim() === currentUsername}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              {usernameLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving...
                </>
              ) : usernameSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                "Save Username"
              )}
            </button>
          </div>
        </div>

        {/* Password Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }} />

          <div className="px-8 py-8 flex flex-col">

            <h2 className="text-xl font-bold text-gray-900 mb-1">Change Password</h2>
            <p className="text-sm text-gray-400 mb-6">Update your account password</p>

            <div className="flex flex-col gap-4">

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordSaved(false); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password requirements */}
                {newPassword.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {requirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${req.test ? "text-green-500" : "text-gray-400"}`}
                      >
                        <span className="text-xs">{req.test ? "✔" : "○"}</span>
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSaved(false); }}
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
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={handleSavePassword}
                disabled={passwordLoading || passwordInvalid}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {passwordLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Saving...
                  </>
                ) : passwordSaved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  "Save Password"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Go back */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold hover:underline"
            style={{
              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ← Go Back
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} VeriFind. All rights reserved.
        </p>
      </div>
    </div>
  );
}

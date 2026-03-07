import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

export default function Settings() {
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const handleSave = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setSaved(false);

    // connected with supabase — update username in user_metadata
    const { error } = await supabase.auth.updateUser({
      data: { username: username.trim() },
    });

    if (error) {
      alert("Failed to update username: " + error.message);
    } else {
      setCurrentUsername(username.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }} />

          <div className="px-8 py-10 flex flex-col items-center">

            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-2">
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <defs>
                  <linearGradient id="settings-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00AAFF" />
                    <stop offset="100%" stopColor="#6B30FF" />
                  </linearGradient>
                </defs>
                <circle
                  cx="22" cy="22" r="14"
                  fill="rgba(0,170,255,0.1)"
                  stroke="url(#settings-lg)"
                  strokeWidth="2.4"
                />
                <polyline
                  points="14,22 20,28 31,15"
                  fill="none"
                  stroke="url(#settings-lg)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="31" y1="31" x2="42" y2="42"
                  stroke="url(#settings-lg)"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
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

            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-8">
              Account Settings
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-1 self-start">Edit Profile</h2>
            <p className="text-sm text-gray-400 mb-6 self-start">
              Current username: <span className="font-semibold text-gray-700">{currentUsername || "—"}</span>
            </p>

            {/* Username field */}
            <div className="w-full flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                New Username
              </label>
              <input
                type="text"
                placeholder="Enter new username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setSaved(false); }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={loading || !username.trim() || username.trim() === currentUsername}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving...
                </>
              ) : saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Back link */}
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
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} VeriFind. All rights reserved.
        </p>
      </div>
    </div>
  );
}

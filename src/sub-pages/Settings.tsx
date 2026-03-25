import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, type ThemePreference } from "../Contexts/ThemeContext";
import { supabase } from "../supabase-client";

function formatMemberSince(dateString?: string) {
  if (!dateString) return "Unknown";

  return new Date(dateString).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function resizeAvatar(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load selected image."));
      img.src = imageUrl;
    });

    const size = 220;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not process selected image.");
    }

    const scale = Math.max(size / image.width, size / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (size - width) / 2;
    const y = (size - height) / 2;

    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, x, y, width, height);

    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function Settings() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [username, setUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const themeOptions: ThemePreference[] = ["light", "dark", "system"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login");
        return;
      }

      const user = data.session.user;
      const name = user.user_metadata?.username ?? "";
      setUsername(name);
      setCurrentUsername(name);
      setProfileEmail(user.email ?? "");
      setMemberSince(formatMemberSince(user.created_at));
      setAvatarUrl(user.user_metadata?.avatar_url ?? "");
    });
  }, [navigate]);

  const handleCopyWishlistLink = async () => {
    if (!currentUsername.trim()) return;

    const url = `${window.location.origin}/wish-list?user=${encodeURIComponent(currentUsername.trim())}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setAvatarMessage("Could not copy link. Please try again.");
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    setAvatarMessage(null);

    try {
      const resizedAvatar = await resizeAvatar(file);
      const usernameValue = username.trim() || currentUsername.trim();
      const { error } = await supabase.auth.updateUser({
        data: {
          username: usernameValue,
          avatar_url: resizedAvatar,
        },
      });

      if (error) {
        setAvatarMessage("Could not update profile photo: " + error.message);
        return;
      }

      setAvatarUrl(resizedAvatar);
      setAvatarMessage("Profile photo updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update profile photo.";
      setAvatarMessage(message);
    } finally {
      event.target.value = "";
      setAvatarLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) return;

    setUsernameLoading(true);
    setUsernameSaved(false);
    setUsernameError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUsernameError("Not logged in.");
      setUsernameLoading(false);
      return;
    }

    const nextUsername = username.trim();

    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        username: nextUsername,
        avatar_url: avatarUrl || undefined,
      },
    });

    if (metaError) {
      setUsernameError("Failed to update username: " + metaError.message);
      setUsernameLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: nextUsername }, { onConflict: "id" });

    if (profileError) {
      setUsernameError(
        "Saved to session but failed to sync to database: " + profileError.message
      );
      setUsernameLoading(false);
      return;
    }

    setCurrentUsername(nextUsername);
    setUsername(nextUsername);
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 3000);
    setUsernameLoading(false);
  };

  const requirements = [
    { label: "8+ characters", test: newPassword.length >= 8 },
    { label: "Contains a number", test: /\d/.test(newPassword) },
    { label: "Contains a special character", test: /[@$!%*?&]/.test(newPassword) },
  ];

  const passwordInvalid =
    newPassword.length < 8 ||
    !/\d/.test(newPassword) ||
    !/[@$!%*?&]/.test(newPassword) ||
    newPassword !== confirmPassword;

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSavePassword = async () => {
    if (passwordInvalid) return;

    setPasswordLoading(true);
    setPasswordSaved(false);

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

  const profileInitial = (currentUsername || profileEmail || "V").charAt(0).toUpperCase();

  return (
    <div className="profile-page min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl flex flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="profile-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPreview(true)}
                    className="profile-avatar-shell relative h-24 w-24 overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-inner transition hover:scale-[1.02]"
                    title="Open profile photo"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-3xl font-black text-white"
                        style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                      >
                        {profileInitial}
                      </div>
                    )}
                  </button>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                      Your Profile
                    </p>
                    <h1 className="mt-2 text-3xl font-black text-gray-900">
                      {currentUsername || "Welcome to VeriFind"}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Keep your profile updated so your wishlist is easier to share.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                  >
                    {avatarLoading ? "Saving Photo..." : "Add Profile Photo"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyWishlistLink}
                    disabled={!currentUsername.trim()}
                    className="profile-secondary-button rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedLink ? "Link Copied!" : "Copy Wishlist Link"}
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {avatarMessage && (
                <p className="text-sm text-gray-500">{avatarMessage}</p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="profile-stat-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800 break-all">
                    {profileEmail || "No email found"}
                  </p>
                </div>
                <div className="profile-stat-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Member Since
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {memberSince}
                  </p>
                </div>
                <div className="profile-stat-card rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Public Wishlist
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {currentUsername.trim() ? `@${currentUsername}` : "Set a username"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-8 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Appearance</h2>
                <p className="text-sm text-gray-400">
                  Choose light, dark, or follow your device's Display & Brightness settings.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => {
                  const isActive = theme === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setTheme(option)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "text-white border-transparent shadow-md"
                          : "hover:opacity-90 shadow-md"
                      }`}
                      style={
                        isActive
                          ? {
                              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                            }
                          : option === "light"
                            ? {
                                background: "#F8FAFC",
                                color: "#0F172A",
                                borderColor: "#CBD5E1",
                              }
                            : option === "system"
                              ? {
                                  background: "#EDE9FE",
                                  color: "#312E81",
                                  borderColor: "#C4B5FD",
                                }
                              : {
                                  background: "#E0F2FE",
                                  color: "#0C4A6E",
                                  borderColor: "#7DD3FC",
                                }
                      }
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Active theme:{" "}
                <span className="font-semibold text-gray-700">
                  {resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)}
                </span>
              </p>

              <div className="profile-tip-card rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                <p className="text-sm font-semibold text-gray-800">
                  Profile tip
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Add a photo and keep your username current so other people can
                  recognize your shared wishlist faster.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="profile-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-8 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Change Username</h2>
              <p className="text-sm text-gray-400 mb-6">
                Current username:{" "}
                <span className="font-semibold text-gray-700">
                  {currentUsername || "-"}
                </span>
              </p>

              <div className="w-full flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  New Username
                </label>
                <input
                  type="text"
                  placeholder="Enter new username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameSaved(false);
                    setUsernameError(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>

              {usernameError && (
                <p className="text-xs text-red-500 mb-3">{usernameError}</p>
              )}

              <button
                onClick={handleSaveUsername}
                disabled={
                  usernameLoading ||
                  !username.trim() ||
                  username.trim() === currentUsername
                }
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {usernameLoading ? (
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
                    Saving...
                  </>
                ) : usernameSaved ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Saved!
                  </>
                ) : (
                  "Save Username"
                )}
              </button>
            </div>
          </div>

          <div className="profile-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-8 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Security</h2>
              <p className="text-sm text-gray-400 mb-6">
                Update your password whenever you need a fresh start.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="********"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordSaved(false);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
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

                  {newPassword.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {requirements.map((req, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                            req.test ? "text-green-500" : "text-gray-400"
                          }`}
                        >
                          <span className="text-xs">{req.test ? "OK" : "-"}</span>
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
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordSaved(false);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-10 ${
                        confirmPassword.length > 0 && confirmPassword !== newPassword
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
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

                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}

                  {passwordsMatch && (
                    <p className="text-xs text-green-500 mt-1">Passwords match</p>
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
                      Saving...
                    </>
                  ) : passwordSaved ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
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
        </div>

        <div className="flex justify-center pt-1">
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

      {showAvatarPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowAvatarPreview(false)}
        >
          <div
            className="relative flex w-full max-w-5xl flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAvatarPreview(false)}
              className="absolute right-0 top-[-2.25rem] text-sm font-semibold text-white transition hover:opacity-80"
            >
              Close
            </button>

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Expanded profile avatar"
                className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <div
                className="flex h-72 w-72 items-center justify-center rounded-2xl text-8xl font-black text-white shadow-2xl"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {profileInitial}
              </div>
            )}

            <p className="text-center text-sm text-white/85">
              {currentUsername || "Your profile photo"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

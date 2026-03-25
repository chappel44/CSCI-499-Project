import { useState } from "react";
import { useUser } from "../../../Contexts/UserContext";

export default function ShareWishListButton() {
  const { username } = useUser();
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareWishlist = async () => {
    if (!username?.trim()) return;

    const url = `${window.location.origin}/wish-list?user=${encodeURIComponent(
      username
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s VeriFind wishlist`,
          text: "Check out my VeriFind wishlist.",
          url,
        });
        return;
      } catch {
        // fall back to copy below if native share is cancelled or unavailable
      }
    }

    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  return (
    <button
      onClick={handleShareWishlist}
      disabled={!username?.trim()}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
      style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
      title="Share your wishlist link"
    >
      {shareCopied ? (
        <>
          <svg
            className="w-3.5 h-3.5"
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
          Link Copied!
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share Wishlist
        </>
      )}
    </button>
  );
}

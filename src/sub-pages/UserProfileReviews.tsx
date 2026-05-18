import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Star, UserRound } from "lucide-react";
import { supabase } from "../../supabase-client";

type Profile = {
  id: string;
  username: string | null;
};

type ProfileReview = {
  id: string;
  reviewed_id: string;
  reviewer_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

type PublicWishlistItem = {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string | null;
  target_price: number;
  note: string | null;
  priority: "low" | "medium" | "high" | null;
  status: "watching" | "ready-to-buy" | "bought" | null;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getProfilePriorityClasses(priority: PublicWishlistItem["priority"]) {
  if (priority === "high") {
    return "border-red-400/35 bg-red-500/15 text-red-300";
  }
  if (priority === "low") {
    return "border-slate-400/35 bg-slate-500/15 text-slate-300";
  }
  return "border-sky-400/35 bg-sky-500/15 text-sky-300";
}

function getProfileStatusClasses(status: PublicWishlistItem["status"]) {
  if (status === "ready-to-buy") {
    return "border-emerald-400/35 bg-emerald-500/15 text-emerald-300";
  }
  if (status === "bought") {
    return "border-purple-400/35 bg-purple-500/15 text-purple-300";
  }
  return "border-blue-400/35 bg-blue-500/15 text-blue-300";
}

function Stars({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;
        const classes = filled
          ? "fill-amber-400 text-amber-400"
          : "text-gray-300";

        if (interactive) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              className="rounded-md p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
            >
              <Star size={24} className={classes} />
            </button>
          );
        }

        return <Star key={value} size={18} className={classes} />;
      })}
    </div>
  );
}

export default function UserProfileReviews() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<ProfileReview[]>([]);
  const [wishlistItems, setWishlistItems] = useState<PublicWishlistItem[]>([]);
  const [localPublicNotesTick, setLocalPublicNotesTick] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfileReviews = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setMessage(null);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();

    setProfile((profileData as Profile | null) ?? { id: userId, username: null });

    const { data: reviewData, error: reviewError } = await supabase
      .from("profile_reviews")
      .select("*")
      .eq("reviewed_id", userId)
      .order("updated_at", { ascending: false });

    if (reviewError) {
      setMessage("Could not load reviews: " + reviewError.message);
    } else {
      const nextReviews = (reviewData ?? []) as ProfileReview[];
      setReviews(nextReviews);
      const myReview = nextReviews.find((review) => review.reviewer_id === currentUserId);
      if (myReview) {
        setRating(myReview.rating);
        setComment(myReview.comment);
      }
    }

    const { data: wishlistData, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id, product_id, product_title, product_image, target_price, note, priority, status")
      .eq("user_id", userId)
      .order("product_title", { ascending: true });

    if (!wishlistError) {
      const localPublicNotesRaw = window.localStorage.getItem(
        `wishlist-public-notes:${userId}`
      );
      const localPublicNotes = localPublicNotesRaw
        ? JSON.parse(localPublicNotesRaw)
        : {};
      const mergedWishlistItems = ((wishlistData ?? []) as PublicWishlistItem[]).map(
        (item) => {
          const localNote =
            localPublicNotes[item.id] ||
            (item.product_id ? localPublicNotes[item.product_id] : null);

          return localNote
            ? {
                ...item,
                note:
                  typeof localNote.note === "string"
                    ? localNote.note
                    : item.note,
                priority: localNote.priority || item.priority,
                status: localNote.status || item.status,
              }
            : item;
        }
      );

      setWishlistItems(mergedWishlistItems);
    }

    setLoading(false);
  }, [currentUserId, localPublicNotesTick, userId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setCurrentUserId(user?.id ?? null);
      setCurrentUsername(
        user?.user_metadata?.username || user?.email?.split("@")[0] || "User"
      );
    });
  }, []);

  useEffect(() => {
    fetchProfileReviews();
  }, [fetchProfileReviews]);

  useEffect(() => {
    const onFocus = () => setLocalPublicNotesTick((tick) => tick + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const displayName = profile?.username || "Marketplace user";
  const isOwnProfile = currentUserId === userId;
  const canSubmit = Boolean(currentUserId && userId && !isOwnProfile);

  const handleSubmitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUserId || !userId || isOwnProfile) return;

    const cleanComment = comment.trim();
    if (cleanComment.length < 3) {
      setMessage("Please write at least 3 characters for your review.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase.from("profile_reviews").upsert(
      {
        reviewed_id: userId,
        reviewer_id: currentUserId,
        reviewer_name: currentUsername,
        rating,
        comment: cleanComment,
      },
      { onConflict: "reviewed_id,reviewer_id" }
    );

    if (error) {
      setMessage("Could not save review: " + error.message);
      setSubmitting(false);
      return;
    }

    setMessage("Review saved.");
    setSubmitting(false);
    fetchProfileReviews();
  };

  return (
    <div className="profile-page min-h-screen bg-gray-100 px-4 pb-10 pt-28">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="profile-secondary-button inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/wish-list")}
          className="profile-secondary-button inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Edit Wishlist
        </button>
        </div>

        <section className="profile-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl text-3xl font-black text-white shadow-md"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
                Public Profile
              </p>
              <h1 className="mt-2 text-3xl font-black text-gray-900">
                {displayName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Stars rating={Math.round(averageRating)} />
                <span className="text-sm font-bold text-gray-700">
                  {reviews.length === 0
                    ? "No reviews yet"
                    : `${averageRating.toFixed(1)} average from ${reviews.length} review${
                        reviews.length === 1 ? "" : "s"
                      }`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="profile-status-panel rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-sm font-semibold text-gray-600 shadow-sm">
            {message}
          </div>
        )}

        {canSubmit && (
          <form
            onSubmit={handleSubmitReview}
            className="profile-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                <MessageSquare size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Leave a Review
                </h2>
                <p className="text-sm text-gray-500">
                  Rate your experience with this user.
                </p>
              </div>
            </div>

            <Stars rating={rating} interactive onChange={setRating} />

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share what other users should know..."
              className="mt-4 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-400"
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              {submitting ? "Saving..." : "Save Review"}
            </button>
          </form>
        )}

        {!currentUserId && (
          <div className="profile-card rounded-2xl border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-600 shadow-sm">
            Log in to leave a profile review.
          </div>
        )}

        {isOwnProfile && (
          <div className="profile-card rounded-2xl border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-600 shadow-sm">
            This is your public profile. Other users can leave reviews here.
          </div>
        )}

        <section className="profile-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Public Wishlist</h2>
              <p className="text-sm text-gray-500">
                Posted wishlist notes and buying status for this user.
              </p>
            </div>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => navigate("/wish-list")}
                className="profile-secondary-button mt-3 w-fit cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:mt-0"
              >
                Manage Wishlist
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm font-semibold text-gray-500">
              Loading wishlist...
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              No public wishlist items yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {wishlistItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex gap-3">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_title}
                        className="h-16 w-16 flex-shrink-0 rounded-xl bg-white object-contain dark:bg-gray-900"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xs font-semibold text-gray-400 dark:bg-gray-900">
                        No image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-black text-gray-900 dark:text-white">
                        {item.product_title}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-blue-500">
                        ${item.target_price}
                      </p>
                      {(item.priority || item.status) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.priority && (
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getProfilePriorityClasses(item.priority)}`}>
                              {item.priority} priority
                            </span>
                          )}
                          {item.status && (
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getProfileStatusClasses(item.status)}`}>
                              {item.status.replaceAll("-", " ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.note?.trim() && (
                    <p className="mt-3 rounded-xl border border-blue-200/50 bg-white px-3 py-2 text-sm leading-6 text-gray-600 dark:border-blue-300/20 dark:bg-blue-500/10 dark:text-blue-100">
                      {item.note}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="profile-card rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-gray-900">Reviews</h2>
          {loading ? (
            <div className="py-10 text-center text-sm font-semibold text-gray-500">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              No reviews have been posted yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm dark:bg-gray-700 dark:text-gray-200">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {review.reviewer_name || "VeriFind user"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">
                          {formatDate(review.updated_at || review.created_at)}
                        </p>
                      </div>
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-200">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, Camera, Trash2, MessageCircle, Inbox, Scale, Save, ShieldAlert, UserX } from "lucide-react";
import { supabase } from "../supabase-client";

type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  images: string[] | null;
  sold: boolean;
  seller_name?: string | null;
};

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

type ListingDraft = {
  id: string;
  title: string;
  price: string;
  category: string;
  description: string;
  condition: string;
  imageInput: string;
  savedAt: string;
};

const REPORT_REASONS = [
  { id: "counterfeit", label: "Counterfeit or fake item" },
  { id: "scam", label: "Likely scam or misleading listing" },
  { id: "prohibited", label: "Prohibited or unsafe item" },
  { id: "harassment", label: "Harassment or abusive behavior" },
  { id: "spam", label: "Spam or duplicate listing" },
  { id: "other", label: "Other", requiresDetails: true },
];

function looksLikeMissingMessagingTables(message?: string) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("marketplace_conversations") ||
    lower.includes("marketplace_messages") ||
    lower.includes("does not exist")
  );
}

function looksLikeMissingSafetyTables(message?: string) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("marketplace_user_blocks") ||
    lower.includes("marketplace_listing_reports") ||
    lower.includes("does not exist")
  );
}

export default function Marketplace() {
  const DRAFTS_KEY = "verifind_marketplace_drafts";
  const navigate = useNavigate();
  const [items, setItems] = useState<Listing[]>([]);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockedSellerIds, setBlockedSellerIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetListing, setReportTargetListing] = useState<Listing | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [reportOtherDetails, setReportOtherDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockTargetListing, setBlockTargetListing] = useState<Listing | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "electronics",
    description: "",
    condition: "Good",
    imageInput: "",
  });

  const loadBlockedSellers = async (userId: string) => {
    const { data, error } = await supabase
      .from("marketplace_user_blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);

    if (error) {
      if (!looksLikeMissingSafetyTables(error.message)) {
        console.error("Unable to load blocked users:", error.message);
      }
      return;
    }

    const ids = (data || []).map((row: { blocked_id: string }) => row.blocked_id);
    setBlockedSellerIds(ids);
  };

  const userIsBlockedBySeller = async (sellerId: string) => {
    if (!currentUserId) return false;
    const lookup = await supabase
      .from("marketplace_user_blocks")
      .select("id")
      .eq("blocker_id", sellerId)
      .eq("blocked_id", currentUserId)
      .maybeSingle();

    if (lookup.error) {
      if (looksLikeMissingSafetyTables(lookup.error.message)) {
        return false;
      }
      console.error("Unable to verify seller block status:", lookup.error.message);
      return false;
    }

    return !!lookup.data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id || null;
      setLoggedIn(!!data.session);
      setCurrentUserId(userId);
      if (userId) {
        await loadBlockedSellers(userId);
      }
    });
    const storedDrafts = localStorage.getItem(DRAFTS_KEY);
    if (storedDrafts) {
      try {
        const parsed = JSON.parse(storedDrafts) as ListingDraft[];
        setDrafts(parsed);
      } catch {
        localStorage.removeItem(DRAFTS_KEY);
      }
    }
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("sold", false)
      .order("created_at", { ascending: false });

    if (!error && data) setItems(data as Listing[]);
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const sellerIsBlocked = blockedSellerIds.includes(item.user_id);
      return matchesSearch && matchesCategory && !sellerIsBlocked;
    });
  }, [items, searchTerm, categoryFilter, blockedSellerIds]);

  const comparedItems = useMemo(() => {
    return items.filter((item) => compareIds.includes(item.id));
  }, [items, compareIds]);

  const persistDrafts = (nextDrafts: ListingDraft[]) => {
    setDrafts(nextDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
  };

  const saveCurrentFormAsDraft = () => {
    if (!formData.title.trim()) {
      alert("Add a title before saving a draft.");
      return;
    }

    const draft: ListingDraft = {
      id: crypto.randomUUID(),
      ...formData,
      savedAt: new Date().toISOString(),
    };
    persistDrafts([draft, ...drafts].slice(0, 10));
    alert("Draft saved locally.");
  };

  const loadDraftIntoForm = (draft: ListingDraft) => {
    setFormData({
      title: draft.title,
      price: draft.price,
      category: draft.category,
      description: draft.description,
      condition: draft.condition,
      imageInput: draft.imageInput,
    });
    setIsDraftsModalOpen(false);
    setIsPostModalOpen(true);
  };

  const deleteDraft = (draftId: string) => {
    persistDrafts(drafts.filter((draft) => draft.id !== draftId));
  };

  const toggleCompare = (itemId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 listings.");
        return prev;
      }
      return [...prev, itemId];
    });
  };

  const handlePostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return alert("You must be logged in to post.");

    const numericPrice =
      formData.price === "" ? 0 : parseFloat(formData.price.replace(/[^0-9.]/g, ""));

    const { error } = await supabase.from("marketplace_listings").insert([
      {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: numericPrice,
        category: formData.category,
        condition: formData.condition,
        images: formData.imageInput ? [formData.imageInput] : [],
        sold: false,
      },
    ]);

    if (error) {
      alert("Error posting: " + error.message);
    } else {
      setIsPostModalOpen(false);
      setFormData({
        title: "",
        price: "",
        category: "electronics",
        description: "",
        condition: "Good",
        imageInput: "",
      });
      fetchListings();
    }
  };

  const handleDeleteListing = async (itemId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this listing? This cannot be undone."
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("marketplace_listings").delete().eq("id", itemId);

    if (error) {
      alert("Error deleting listing: " + error.message);
    } else {
      setSelectedItem(null);
      fetchListings();
    }
  };

  const startConversationForListing = async (listing: Listing) => {
    if (!loggedIn || !currentUserId) {
      alert("Please log in to message a seller.");
      return;
    }

    if (listing.user_id === currentUserId) {
      navigate("/marketplace/inbox");
      return;
    }

    if (blockedSellerIds.includes(listing.user_id)) {
      alert("You blocked this seller. Unblock them before sending a message.");
      return;
    }

    const blockedBySeller = await userIsBlockedBySeller(listing.user_id);
    if (blockedBySeller) {
      alert("This seller has blocked you. You cannot start a conversation.");
      return;
    }

    const lookup = await supabase
      .from("marketplace_conversations")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("buyer_id", currentUserId)
      .eq("seller_id", listing.user_id)
      .maybeSingle();

    if (lookup.error && !looksLikeMissingMessagingTables(lookup.error.message)) {
      alert("Unable to open chat: " + lookup.error.message);
      return;
    }

    if (lookup.error && looksLikeMissingMessagingTables(lookup.error.message)) {
      alert(
        "Messaging tables are not set up yet. Run src/sql/marketplace_messaging.sql in Supabase SQL Editor first."
      );
      return;
    }

    let conversation = lookup.data as Conversation | null;

    if (!conversation) {
      const created = await supabase
        .from("marketplace_conversations")
        .insert([
          {
            listing_id: listing.id,
            buyer_id: currentUserId,
            seller_id: listing.user_id,
            last_message_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (created.error || !created.data) {
        alert("Unable to create chat: " + (created.error?.message || "unknown error"));
        return;
      }
      conversation = created.data as Conversation;
    }

    setSelectedItem(null);
    navigate(`/marketplace/inbox/${conversation.id}`);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTargetListing(null);
    setSelectedReportReason("");
    setReportOtherDetails("");
    setReportError(null);
    setReportSuccess(null);
    setReportSubmitting(false);
  };

  const openReportModal = (listing: Listing) => {
    if (!loggedIn || !currentUserId) {
      alert("Please log in to report a listing.");
      return;
    }

    if (listing.user_id === currentUserId) {
      alert("You cannot report your own listing.");
      return;
    }

    setReportTargetListing(listing);
    setSelectedReportReason("");
    setReportOtherDetails("");
    setReportError(null);
    setReportSuccess(null);
    setIsReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!reportTargetListing || !currentUserId) return;

    if (!selectedReportReason) {
      setReportError("Please select a reason.");
      return;
    }

    const selected = REPORT_REASONS.find((reason) => reason.id === selectedReportReason);
    if (!selected) {
      setReportError("Please select a valid reason.");
      return;
    }

    const details = reportOtherDetails.trim();
    if (selected.requiresDetails && (details.length < 3 || details.length > 500)) {
      setReportError("For 'Other', provide details between 3 and 500 characters.");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);

    const { error } = await supabase.from("marketplace_listing_reports").insert([
      {
        listing_id: reportTargetListing.id,
        reporter_id: currentUserId,
        seller_id: reportTargetListing.user_id,
        reason: selected.label,
        details: details || null,
      },
    ]);

    if (error) {
      if (looksLikeMissingSafetyTables(error.message)) {
        setReportError(
          "Report/block tables are not set up yet. Run src/sql/marketplace_messaging.sql in Supabase SQL Editor first."
        );
        setReportSubmitting(false);
        return;
      }
      setReportError("Unable to submit report: " + error.message);
      setReportSubmitting(false);
      return;
    }

    setReportSuccess("Report submitted. Thank you for helping keep the marketplace safe.");
    setReportSubmitting(false);
  };

  const closeBlockModal = () => {
    setIsBlockModalOpen(false);
    setBlockTargetListing(null);
    setBlockError(null);
    setBlockSuccess(null);
    setBlockSubmitting(false);
  };

  const openBlockModal = (listing: Listing) => {
    if (!loggedIn || !currentUserId) {
      alert("Please log in to block a seller.");
      return;
    }

    if (listing.user_id === currentUserId) {
      alert("You cannot block yourself.");
      return;
    }

    setBlockTargetListing(listing);
    setBlockError(null);
    setBlockSuccess(null);
    setIsBlockModalOpen(true);
  };

  const submitBlockSeller = async () => {
    if (!blockTargetListing || !currentUserId) return;

    setBlockSubmitting(true);
    setBlockError(null);

    const { error } = await supabase.from("marketplace_user_blocks").insert([
      {
        blocker_id: currentUserId,
        blocked_id: blockTargetListing.user_id,
        reason: "Blocked seller messages",
      },
    ]);

    if (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === "23505") {
        setBlockSuccess("This seller is already blocked.");
      } else if (looksLikeMissingSafetyTables(error.message)) {
        setBlockError(
          "Report/block tables are not set up yet. Run src/sql/marketplace_messaging.sql in Supabase SQL Editor first."
        );
        setBlockSubmitting(false);
        return;
      } else {
        setBlockError("Unable to block seller: " + error.message);
        setBlockSubmitting(false);
        return;
      }
    } else {
      setBlockSuccess("Seller blocked successfully.");
    }

    await loadBlockedSellers(currentUserId);
    setBlockSubmitting(false);
    setSelectedItem(null);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price}`;
  };

  return (
    <div
      className="marketplace-page min-h-screen flex flex-col pt-24 pb-12 px-4 relative overflow-hidden"
      style={{ background: "#f0f4ff" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: "55vw",
            height: "55vw",
            background: "radial-gradient(circle, rgba(0,170,255,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "-10%",
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle, rgba(107,48,255,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <h1 className="marketplace-title text-4xl font-black mb-8 text-center text-gray-900 tracking-tight">
          Marketplace
        </h1>

        <div className="mb-12 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          <div className="relative flex-1 group">
            <Search className="marketplace-search-icon absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="marketplace-search-input w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all"
            />
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="marketplace-secondary-button px-4 py-3.5 rounded-2xl font-bold text-gray-700 bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm hover:bg-white active:scale-95 transition-all"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="home">Home</option>
              <option value="fashion">Fashion</option>
              <option value="toys">Toys</option>
              <option value="books">Books</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>

            {loggedIn && (
              <button
                onClick={() => navigate("/marketplace/inbox")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-700 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-sm hover:bg-white active:scale-95 transition-all whitespace-nowrap"
              >
                <Inbox size={20} /> Inbox
              </button>
            )}

            <button
              onClick={() => setIsCompareModalOpen(true)}
              disabled={compareIds.length < 2}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-700 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-sm hover:bg-white active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Scale size={20} /> Compare ({compareIds.length})
            </button>

            {loggedIn && (
              <button
                onClick={() => setIsDraftsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-700 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-sm hover:bg-white active:scale-95 transition-all whitespace-nowrap"
              >
                <Save size={20} /> Drafts ({drafts.length})
              </button>
            )}

            {loggedIn && (
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                <Plus size={20} /> Post Item
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium text-lg w-full">
            No matching items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="marketplace-card bg-white/60 backdrop-blur-md rounded-[2rem] p-4 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                <div className="marketplace-card-image aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                  <img
                    src={item.images?.[0] || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x400/e2e8f0/64748b?text=Image+Unavailable";
                    }}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="px-2 flex-grow flex flex-col">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                    {item.category}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{item.title}</h3>
                  <p className="text-2xl font-medium mb-4 text-gray-900">{formatPrice(item.price)}</p>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="marketplace-view-button w-full mt-auto py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => toggleCompare(item.id)}
                    className={`w-full mt-2 py-2.5 font-bold rounded-xl transition-colors border ${
                      compareIds.includes(item.id)
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {compareIds.includes(item.id) ? "Selected for Compare" : "Add to Compare"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isPostModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="marketplace-modal bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }} />
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">List an Item</h2>
                <button
                  onClick={() => setIsPostModalOpen(false)}
                  className="marketplace-icon-button p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handlePostItem} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Title</label>
                  <input
                    required
                    placeholder="What are you selling?"
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Price</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="$0.00"
                      className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Category</label>
                    <select
                      className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="electronics">Electronics</option>
                      <option value="home">Home</option>
                      <option value="fashion">Fashion</option>
                      <option value="toys">Toys</option>
                      <option value="books">Books</option>
                      <option value="sports">Sports</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Condition</label>
                  <select
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Image URL</label>
                  <div className="relative">
                    <Camera className="marketplace-camera-icon absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="https://..."
                      className="marketplace-form-input w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                      value={formData.imageInput}
                      onChange={(e) => setFormData({ ...formData, imageInput: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about the item..."
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={saveCurrentFormAsDraft}
                    className="w-full py-4 rounded-2xl text-gray-700 font-bold border border-gray-200 bg-gray-50 hover:bg-white transition-all"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDraftsModalOpen(true)}
                    className="w-full py-4 rounded-2xl text-gray-700 font-bold border border-gray-200 bg-gray-50 hover:bg-white transition-all"
                  >
                    Load Draft
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl text-white font-bold shadow-xl transition-all hover:opacity-90 active:scale-[0.98] mt-3"
                  style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                >
                  Publish Listing
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-gray-900">Listing Drafts</h2>
                <button
                  onClick={() => setIsDraftsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-400" />
                </button>
              </div>

              {drafts.length === 0 ? (
                <p className="text-gray-500 text-sm">No drafts yet. Save one from the listing form.</p>
              ) : (
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                      <p className="text-sm font-bold text-gray-900 truncate">{draft.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {draft.category} · {draft.condition} · saved {new Date(draft.savedAt).toLocaleString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => loadDraftIntoForm(draft)}
                          className="flex-1 py-2.5 rounded-xl text-white font-bold"
                          style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                        >
                          Load Draft
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="px-4 py-2.5 rounded-xl text-red-600 border border-red-200 bg-red-50 font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="marketplace-compare-shell bg-white rounded-[2rem] w-full max-w-6xl max-h-[88vh] overflow-hidden shadow-2xl border border-gray-100">
            <div className="marketplace-compare-header p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">Compare Listings</h2>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="marketplace-compare-close p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="text-gray-400" />
              </button>
            </div>

            {comparedItems.length < 2 ? (
              <div className="p-10 text-center text-gray-500">
                Pick at least 2 listings using "Add to Compare".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid gap-4 p-5" style={{ gridTemplateColumns: `repeat(${comparedItems.length}, minmax(260px, 1fr))` }}>
                  {comparedItems.map((item) => (
                    <div key={item.id} className="marketplace-compare-card rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <img
                        src={item.images?.[0] || "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image"}
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400x300/e2e8f0/64748b?text=Image+Unavailable";
                        }}
                        alt={item.title}
                        className="marketplace-compare-image w-full h-40 object-cover rounded-xl mb-3"
                      />
                      <p className="marketplace-compare-label text-[10px] font-bold text-indigo-500 uppercase tracking-[0.18em]">
                        {item.category}
                      </p>
                      <h3 className="marketplace-compare-title font-black text-gray-900 text-lg leading-tight mt-1">
                        {item.title}
                      </h3>
                      <p className="marketplace-compare-price text-2xl font-bold text-gray-900 mt-2">
                        {formatPrice(item.price)}
                      </p>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="marketplace-compare-row flex items-start justify-between gap-3">
                          <span className="marketplace-compare-key font-semibold text-gray-700">Condition</span>
                          <span className="marketplace-compare-value text-gray-800">{item.condition}</span>
                        </div>
                        <div className="marketplace-compare-row flex items-start justify-between gap-3">
                          <span className="marketplace-compare-key font-semibold text-gray-700">Category</span>
                          <span className="marketplace-compare-value text-gray-800">{item.category}</span>
                        </div>
                        <div className="marketplace-compare-description rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                          <p className="marketplace-compare-key font-semibold text-gray-700 mb-1">Description</p>
                          <p className="marketplace-compare-value text-gray-700 leading-relaxed line-clamp-5">
                            {item.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCompare(item.id)}
                        className="marketplace-compare-remove w-full mt-4 py-2.5 rounded-xl text-red-600 border border-red-200 bg-red-50 font-bold"
                      >
                        Remove from Compare
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="marketplace-detail-modal bg-white rounded-[32px] max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl cursor-default flex flex-col md:flex-row border border-white/20"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="marketplace-detail-close absolute top-6 right-6 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white z-10 w-10 h-10 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <X size={20} className="text-gray-900" />
            </button>

            <div className="marketplace-detail-image-shell w-full md:w-[55%] bg-gray-50 min-h-[300px] flex items-center justify-center">
              <img
                src={selectedItem.images?.[0] || "https://placehold.co/600x600/e2e8f0/64748b?text=No+Image"}
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/600x600/e2e8f0/64748b?text=Image+Unavailable";
                }}
                className="w-full h-full object-cover"
                alt={selectedItem.title}
              />
            </div>

            <div className="marketplace-detail-copy w-full md:w-[45%] p-10 md:p-12 flex flex-col bg-white">
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="marketplace-chip px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedItem.category}
                </span>
                <span className="marketplace-chip px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedItem.condition}
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{selectedItem.title}</h2>
              <p className="text-4xl font-medium mb-8 text-gray-900">{formatPrice(selectedItem.price)}</p>

              <div className="space-y-6 mb-10 flex-grow">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedItem.description || "No description provided by the seller."}
                  </p>
                </div>
              </div>

              {currentUserId === selectedItem.user_id ? (
                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => navigate("/marketplace/inbox")}
                    className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} /> View Buyer Messages
                  </button>
                  <button
                    onClick={() => handleDeleteListing(selectedItem.id)}
                    className="w-full py-5 bg-red-50 text-red-600 border border-red-200 text-lg font-bold rounded-2xl hover:bg-red-100 shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    Delete Listing
                  </button>
                </div>
              ) : (
                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => startConversationForListing(selectedItem)}
                    disabled={blockedSellerIds.includes(selectedItem.user_id)}
                    className="w-full py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 shadow-xl transition-all transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {blockedSellerIds.includes(selectedItem.user_id) ? "Seller Blocked" : "Message Seller"}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openReportModal(selectedItem)}
                      className="w-full py-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <ShieldAlert size={16} />
                      Report
                    </button>
                    <button
                      onClick={() => openBlockModal(selectedItem)}
                      className="w-full py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <UserX size={16} />
                      Block Seller
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && reportTargetListing && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="report-modal-shell bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-2xl font-black text-gray-900">Report Listing</h2>
                <button
                  onClick={closeReportModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-500" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm p-4">
                    {reportSuccess}
                  </div>
                  <button
                    onClick={closeReportModal}
                    className="w-full py-3 rounded-xl text-white font-bold"
                    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Why are you reporting <span className="font-semibold text-gray-800">{reportTargetListing.title}</span>?
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Choose one reason. Add details if needed.
                  </p>

                  <div className="space-y-2.5 mb-4">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => {
                          setSelectedReportReason(reason.id);
                          setReportError(null);
                        }}
                        className={`report-reason-button w-full text-left px-4 py-3 rounded-xl border transition font-semibold ${
                          selectedReportReason === reason.id
                            ? "report-reason-selected border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>

                  {selectedReportReason === "other" && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                        Other Details
                      </label>
                      <textarea
                        rows={4}
                        value={reportOtherDetails}
                        onChange={(e) => {
                          setReportOtherDetails(e.target.value);
                          setReportError(null);
                        }}
                        placeholder="Tell us what happened..."
                        className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none"
                        maxLength={500}
                      />
                      <p className="text-[11px] text-gray-500 mt-1 text-right">
                        {reportOtherDetails.trim().length}/500
                      </p>
                    </div>
                  )}

                  {reportError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 mb-4">
                      {reportError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={closeReportModal}
                      className="report-cancel-button w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={reportSubmitting}
                      className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                    >
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isBlockModalOpen && blockTargetListing && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="report-modal-shell bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-black text-gray-900">Block Seller</h2>
                <button
                  onClick={closeBlockModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-700">
                Block <span className="font-semibold">{blockTargetListing.title}</span> seller? You
                won&apos;t be able to message each other, and their listings will be hidden for you.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                You can always unblock them later in Settings under <span className="font-semibold">Blocked Users</span>.
              </p>

              {blockError && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 mt-4">
                  {blockError}
                </div>
              )}

              {blockSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm p-3 mt-4">
                  {blockSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={closeBlockModal}
                  className="report-cancel-button w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitBlockSeller}
                  disabled={blockSubmitting}
                  className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                >
                  {blockSubmitting ? "Blocking..." : "Block Seller"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="relative z-10 w-full py-10 mt-auto flex justify-center"
        style={{ borderTop: "1px solid rgba(0,170,255,0.1)" }}
      >
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Verifind. All rights reserved.</p>
      </div>
    </div>
  );
}


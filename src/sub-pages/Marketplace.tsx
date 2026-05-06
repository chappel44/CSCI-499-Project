import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";
import {
  MapPin,
  Search,
  Plus,
  X,
  Camera,
  Filter,
  Trash2,
  MessageCircle,
  ShieldAlert,
  UserX,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MarketplaceListing = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  images: string[] | null;
  sold: boolean;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  seller_name: string | null;
};

const REPORT_REASONS = [
  { id: "counterfeit", label: "Counterfeit or fake item" },
  { id: "scam", label: "Likely scam or misleading listing" },
  { id: "prohibited", label: "Prohibited or unsafe item" },
  { id: "harassment", label: "Harassment or abusive behavior" },
  { id: "spam", label: "Spam or duplicate listing" },
  { id: "other", label: "Other", requiresDetails: true },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedItem, setSelectedItem] = useState<MarketplaceListing | null>(
    null
  );
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempAddress, setTempAddress] = useState("");
  const [blockedSellerIds, setBlockedSellerIds] = useState<string[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "electronics",
    description: "",
    condition: "Good",
    imageInput: "",

    location_name: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("marketplace_listings")
      .select("*")
      .eq("sold", false);

    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      setItems(
        (data as MarketplaceListing[]).filter(
          (item) => !blockedSellerIds.includes(item.user_id)
        )
      );
    }
    if (error) console.error("Error fetching listings:", error.message);
    setLoading(false);
  }, [blockedSellerIds, searchQuery, selectedCategory]);

  // map use effect
  useEffect(() => {
    if (selectedItem && selectedItem.latitude && selectedItem.longitude) {
      const latitude = selectedItem.latitude;
      const longitude = selectedItem.longitude;
      const timer = setTimeout(() => {
        const map = new maplibregl.Map({
          container: "item-map",
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [longitude, latitude],
          zoom: 14,
        });

        new maplibregl.Marker({ color: "#6B30FF" })
          .setLngLat([longitude, latitude])
          .addTo(map);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedItem]);

  // user auth use effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setCurrentUserId(data.session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      const timer = window.setTimeout(() => setBlockedSellerIds([]), 0);
      return () => window.clearTimeout(timer);
    }

    const fetchBlockedSellers = async () => {
      const { data, error } = await supabase
        .from("marketplace_user_blocks")
        .select("blocked_id")
        .eq("blocker_id", currentUserId);

      if (error) {
        console.error("Error fetching blocked users:", error.message);
        return;
      }

      setBlockedSellerIds(
        (data ?? [])
          .map((row) => row.blocked_id)
          .filter((id): id is string => Boolean(id))
      );
    };

    fetchBlockedSellers();
  }, [currentUserId]);

  // search use effect
  useEffect(() => {
    const delayDebounceFN = setTimeout(() => {
      fetchListings();
    }, 300);
    return () => clearTimeout(delayDebounceFN);
  }, [fetchListings]);

  const handlePostItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in to post.");

    const numericPrice =
      formData.price === ""
        ? 0
        : parseFloat(formData.price.replace(/[^0-9.]/g, ""));

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
        location_name: formData.location_name,
        latitude: formData.latitude,
        longitude: formData.longitude,
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
        location_name: "",
        latitude: null,
        longitude: null,
      });
      setTempAddress("");
      fetchListings();
    }
  };

  const handleAddressLookup = async (address: string) => {
    if (address.length < 5) return;
    const API_KEY = import.meta.env.VITE_GEOCODIO_KEY;
    const res = await fetch(
      `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(
        address
      )}&api_key=${API_KEY}`
    );
    const data = await res.json();

    if (data.results?.length > 0) {
      const result = data.results[0];
      setFormData({
        ...formData,
        location_name: result.formatted_address,
        latitude: result.location.lat,
        longitude: result.location.lng,
      });
    }
  };

  const handleDeleteListing = async (itemId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this listing?"
    );
    if (!confirmDelete) return;
    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", itemId);
    if (error) alert("Error deleting listing: " + error.message);
    else {
      setSelectedItem(null);
      fetchListings();
    }
  };

  const requireSignedIn = () => {
    if (loggedIn && currentUserId) return true;
    alert("Please log in first.");
    return false;
  };

  const handleOpenMessage = async () => {
    if (!selectedItem || !requireSignedIn()) return;
    if (currentUserId === selectedItem.user_id) {
      navigate("/marketplace/inbox");
      return;
    }
    if (blockedSellerIds.includes(selectedItem.user_id)) {
      setActionMessage(
        "You blocked this seller. Unblock them before messaging."
      );
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActionMessage("Please log in first.");
      setActionLoading(false);
      return;
    }

    const { data: existingConversation, error: findError } = await supabase
      .from("marketplace_conversations")
      .select("id")
      .eq("listing_id", selectedItem.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", selectedItem.user_id)
      .maybeSingle();

    if (findError) {
      setActionMessage("Could not start conversation: " + findError.message);
      setActionLoading(false);
      return;
    }

    let conversationId = existingConversation?.id as string | undefined;

    if (!conversationId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from("marketplace_conversations")
        .insert({
          listing_id: selectedItem.id,
          buyer_id: user.id,
          seller_id: selectedItem.user_id,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (conversationError) {
        setActionMessage(
          "Could not create conversation: " + conversationError.message
        );
        setActionLoading(false);
        return;
      }

      conversationId = newConversation.id;
    }

    setActionLoading(false);
    setSelectedItem(null);
    navigate(`/marketplace/inbox/${conversationId}`);
  };

  const handleBlockSeller = async () => {
    if (!selectedItem || !requireSignedIn()) return;
    if (currentUserId === selectedItem.user_id) {
      setActionMessage("You cannot block yourself.");
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    setBlockMessage(null);

    const { error } = await supabase.from("marketplace_user_blocks").upsert(
      {
        blocker_id: currentUserId,
        blocked_id: selectedItem.user_id,
        reason: "Blocked seller messages",
      },
      { onConflict: "blocker_id,blocked_id" }
    );

    if (error) {
      setBlockMessage("Could not block seller: " + error.message);
      setActionLoading(false);
      return;
    }

    setBlockedSellerIds((ids) => [...new Set([...ids, selectedItem.user_id])]);
    setItems((existing) =>
      existing.filter((item) => item.user_id !== selectedItem.user_id)
    );
    setSelectedItem(null);
    setIsBlockModalOpen(false);
    setActionMessage("Seller blocked.");
    setActionLoading(false);
  };

  const handleReportListing = async () => {
    if (!selectedItem || !requireSignedIn()) return;

    const selectedReason = REPORT_REASONS.find(
      (reason) => reason.id === reportReason
    );
    if (!selectedReason) {
      setReportMessage("Please select a reason.");
      return;
    }

    const details = reportDetails.trim();
    if (
      selectedReason.requiresDetails &&
      (details.length < 3 || details.length > 500)
    ) {
      setReportMessage(
        "For 'Other', add details between 3 and 500 characters."
      );
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    setReportMessage(null);

    const { error } = await supabase
      .from("marketplace_listing_reports")
      .insert({
        reporter_id: currentUserId,
        seller_id: selectedItem.user_id,
        listing_id: selectedItem.id,
        reason: selectedReason.label,
        details: details || null,
      });

    if (error) {
      setReportMessage("Could not submit report: " + error.message);
      setActionLoading(false);
      return;
    }

    setReportDetails("");
    setReportReason("");
    setIsReportModalOpen(false);
    setActionMessage(
      "Report submitted. Thanks for helping keep VeriFind safe."
    );
    setActionLoading(false);
  };

  const formatPrice = (price: number) => (price === 0 ? "Free" : `$${price}`);

  return (
    <div
      className="marketplace-page min-h-screen flex flex-col pt-24 pb-12 px-4 relative overflow-hidden"
      style={{ background: "#f0f4ff" }}
    >
      {/* Mesh Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: "55vw",
            height: "55vw",
            background:
              "radial-gradient(circle, rgba(0,170,255,0.18) 0%, transparent 70%)",
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
            background:
              "radial-gradient(circle, rgba(107,48,255,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <h1 className="marketplace-title text-4xl font-black mb-8 text-center text-gray-900 tracking-tight">
          Marketplace
        </h1>

        {actionMessage && (
          <div className="mx-auto mb-5 max-w-3xl rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur-md">
            {actionMessage}
          </div>
        )}

        {/* Search, Filter & Post Bar */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          <div className="relative flex-1 group">
            <Search className="marketplace-search-icon absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="marketplace-search-input w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all"
            />
          </div>

          <div className="flex gap-4 justify-center">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="marketplace-secondary-button flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl font-bold text-gray-700 bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm appearance-none cursor-pointer outline-none"
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
              <Filter
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>

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

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium text-lg w-full">
            No items listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {items.map((item) => (
              <div
                key={item.id}
                className="marketplace-card bg-white/60 backdrop-blur-md rounded-[2rem] p-4 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                <div className="marketplace-card-image aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                  <img
                    src={
                      item.images?.[0] ||
                      "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="px-2 flex-grow flex flex-col">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                    {item.category}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                    {item.title}
                  </h3>
                  <p className="text-2xl font-medium mb-4 text-gray-900">
                    {formatPrice(item.price)}
                  </p>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="marketplace-view-button w-full mt-auto py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: POST LISTING */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="marketplace-modal bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div
              className="h-1.5 w-full"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            />
            <div className="p-8 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  List an Item
                </h2>
                <button
                  onClick={() => setIsPostModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handlePostItem} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                    Title
                  </label>
                  <input
                    required
                    placeholder="What are you selling?"
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                      Price
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                      Category
                    </label>
                    <select
                      className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
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
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                    Condition
                  </label>
                  <select
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                {/* Location Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                    Location
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        placeholder="Enter address..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                        value={tempAddress}
                        onChange={(e) => setTempAddress(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddressLookup(tempAddress)}
                      className="px-4 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs hover:bg-black"
                    >
                      Find
                    </button>
                  </div>
                  {formData.location_name && (
                    <p className="text-[10px] text-green-600 font-bold px-1 italic">
                      ✓ Found: {formData.location_name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                    Image URL
                  </label>
                  <div className="relative">
                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="https://..."
                      className="marketplace-form-input w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                      value={formData.imageInput}
                      onChange={(e) =>
                        setFormData({ ...formData, imageInput: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details..."
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl text-white font-bold shadow-xl hover:opacity-90 active:scale-[0.98] mt-4"
                  style={{
                    background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                  }}
                >
                  Publish Listing
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ITEM DETAILS */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="marketplace-detail-modal bg-white rounded-[32px] max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:flex-row border border-white/20"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white z-10 w-10 h-10 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <X size={20} className="text-gray-900" />
            </button>

            <div className="w-full md:w-[55%] bg-gray-50 min-h-[300px] flex items-center justify-center">
              <img
                src={
                  selectedItem.images?.[0] ||
                  "https://placehold.co/600x600/e2e8f0/64748b?text=No+Image"
                }
                className="w-full h-full object-cover"
                alt={selectedItem.title}
              />
            </div>

            <div className="w-full md:w-[45%] p-10 md:p-12 flex flex-col bg-white">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedItem.category}
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedItem.condition}
                </span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                {selectedItem.title}
              </h2>
              <p className="text-4xl font-medium mb-8 text-gray-900">
                {formatPrice(selectedItem.price)}
              </p>

              <div className="space-y-6 mb-10 flex-grow">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600">
                    {selectedItem.description || "No description provided."}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    Location
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 mb-2">
                    <MapPin size={14} className="text-blue-500" />
                    <span className="text-sm font-medium">
                      {selectedItem.location_name || "Location not provided"}
                    </span>
                  </div>
                  {selectedItem.latitude && (
                    <div
                      id="item-map"
                      className="w-full h-48 rounded-2xl border border-gray-100 shadow-inner bg-gray-50"
                    />
                  )}
                </div>
                <div className="pt-6 border-t border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedItem.seller_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                      Listed By
                    </p>
                    <p className="text-sm font-bold">
                      {selectedItem.seller_name || "Anonymous"}
                    </p>
                  </div>
                </div>
              </div>

              {currentUserId === selectedItem.user_id ? (
                <button
                  onClick={() => handleDeleteListing(selectedItem.id)}
                  className="w-full py-5 bg-red-50 text-red-600 border border-red-200 text-lg font-bold rounded-2xl hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} /> Delete Listing
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleOpenMessage}
                    disabled={actionLoading}
                    className="w-full py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <MessageCircle size={20} /> Message Seller
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setActionMessage(null);
                        setIsReportModalOpen(true);
                      }}
                      className="w-full py-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <ShieldAlert size={16} /> Report
                    </button>
                    <button
                      onClick={() => {
                        setBlockMessage(null);
                        setIsBlockModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="w-full py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <UserX size={16} /> Block Seller
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="report-modal-shell w-full max-w-2xl rounded-[2rem] border border-cyan-500/20 bg-[#0b1733]/95 p-7 shadow-2xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black text-slate-100">
                Report Listing
              </h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-5 text-base text-slate-300">
              Choose a reason to report this listing.
            </p>

            <div className="space-y-3 mb-5">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => {
                    setReportReason(reason.id);
                    setReportMessage(null);
                  }}
                  className={`report-reason-button w-full rounded-xl border px-5 py-4 text-left text-lg font-semibold transition ${
                    reportReason === reason.id
                      ? "report-reason-selected border-cyan-300/60 bg-blue-600 text-white shadow-sm"
                      : "border-cyan-500/30 bg-[#13284d] text-slate-100 hover:bg-[#17325f]"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            {reportReason === "other" && (
              <div className="mb-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">
                  Details
                </label>
                <textarea
                  rows={4}
                  value={reportDetails}
                  onChange={(e) => {
                    setReportDetails(e.target.value);
                    setReportMessage(null);
                  }}
                  className="w-full resize-none rounded-2xl border border-cyan-500/25 bg-[#0c1b37] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
                  placeholder="Tell us what happened..."
                  maxLength={500}
                />
              </div>
            )}

            {reportMessage && (
              <div className="mb-5 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                {reportMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="report-cancel-button w-full rounded-xl border border-cyan-500/30 bg-[#13284d] py-4 text-lg font-bold text-slate-100 transition hover:bg-[#17325f]"
              >
                Cancel
              </button>
              <button
                onClick={handleReportListing}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                }}
              >
                {actionLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBlockModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="report-modal-shell bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-black text-gray-900">
                  Block Seller
                </h2>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-700">
                Block{" "}
                <span className="font-semibold">
                  {selectedItem.seller_name || "this seller"}
                </span>
                ? You will not be able to message each other, and their listings
                will be hidden for you.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                You can unblock them later from Profile under{" "}
                <span className="font-semibold">Blocked Users</span>.
              </p>

              {blockMessage && (
                <div className="report-status-message rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 p-3 mt-4">
                  {blockMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="report-cancel-button w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBlockSeller}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                  }}
                >
                  {actionLoading ? "Blocking..." : "Block Seller"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="relative z-10 w-full py-10 mt-auto flex justify-center items-center gap-4"
        style={{ borderTop: "1px solid rgba(0,170,255,0.1)" }}
      >
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Verifind. All rights reserved.
        </p>
        <p className="text-gray-400">•</p>
        <Link to="/privacy-policy" className="text-xs text-gray-400">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

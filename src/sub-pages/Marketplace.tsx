import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  BadgeCheck,
  MapPinned,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Navigation,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Haversine distance calculation for filtering based on location
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

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
  seller_verified?: boolean | null;
  identity_verified?: boolean | null;
  verified_user?: boolean | null;
};

type TrustBadge = {
  label: string;
  tone: "good" | "info" | "warning";
  icon: "verified" | "active" | "location" | "reported";
  detail: string;
};

type SellerProgress = {
  level: string;
  score: number;
  signals: SellerSignal[];
  completed: string[];
  improvements: string[];
  identityVerified: boolean;
};

type SellerSignal = {
  label: string;
  description: string;
  done: boolean;
  action: string;
};

type SellerProgressInput = {
  sellerName: string | null;
  listings: MarketplaceListing[];
  sellerVerified?: boolean;
};

const REPORT_REASONS = [
  { id: "counterfeit", label: "Counterfeit or fake item" },
  { id: "scam", label: "Likely scam or misleading listing" },
  { id: "prohibited", label: "Prohibited or unsafe item" },
  { id: "harassment", label: "Harassment or abusive behavior" },
  { id: "spam", label: "Spam or duplicate listing" },
  { id: "other", label: "Other", requiresDetails: true },
];

const MARKETPLACE_SAVE_CACHE_KEY = "verifind_marketplace_saved_items";

export default function Marketplace() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceListing[]>([]);

  // URL SEARCH PARAMS
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const selectedListingId = searchParams.get("listing") || "";

  // Helper function to update URL without destroying other params
  const updateURLParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value && value !== "all") {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    }, { replace: true });
  };

  const [selectedItem, setSelectedItem] = useState<MarketplaceListing | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempAddress, setTempAddress] = useState("");
  const [blockedSellerIds, setBlockedSellerIds] = useState<string[]>([]);

  // UI States for Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Action states
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportedListingIds, setReportedListingIds] = useState<string[]>([]);
  const [isSellerProgressOpen, setIsSellerProgressOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [currentUserVerified, setCurrentUserVerified] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

  // State for location request and distance calc
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [filterLocationText, setFilterLocationText] = useState("");
  const [isLocating, setIsLocating] = useState(false);

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

  const openListingDetails = (item: MarketplaceListing) => {
    setSelectedItem(item);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("listing", item.id);
      return next;
    }, { replace: true });
  };

  const closeListingDetails = () => {
    setSelectedItem(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("listing");
      return next;
    }, { replace: true });
  };

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
      const user = data.session?.user;
      setLoggedIn(!!data.session);
      setCurrentUserId(user?.id || null);
      setCurrentUserVerified(Boolean(user?.user_metadata?.identity_verified));
    });
  }, []);

  // Auto-fetch location if permission
  useEffect(() => {
    try {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => console.log("Location auto-fetch failed:", err)
            );
          }
        });
      }
    } catch (e) {
      console.log("Permissions API not fully supported.");
    }
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

  useEffect(() => {
    if (!currentUserId) {
      const timer = window.setTimeout(() => setReportedListingIds([]), 0);
      setSavedListingIds([]);
      return () => window.clearTimeout(timer);
    }

    const fetchReportedListings = async () => {
      const { data, error } = await supabase
        .from("marketplace_listing_reports")
        .select("listing_id")
        .eq("reporter_id", currentUserId);

      if (error) {
        console.error("Error fetching listing reports:", error.message);
        return;
      }

      setReportedListingIds(
        (data ?? [])
          .map((row) => row.listing_id)
          .filter((id): id is string => Boolean(id))
      );
    };

    const fetchSavedListings = async () => {
      const { data, error } = await supabase
        .from("marketplace_saves")
        .select("listing_id")
        .eq("user_id", currentUserId);

      if (error) {
        console.error("Error fetching saved marketplace listings:", error.message);
        return;
      }

      setSavedListingIds(
        (data ?? [])
          .map((row) => row.listing_id)
          .filter((id): id is string => Boolean(id))
      );
    };

    fetchReportedListings();
    fetchSavedListings();
  }, [currentUserId]);

  // search use effect
  useEffect(() => {
    const delayDebounceFN = setTimeout(() => {
      fetchListings();
    }, 300);
    return () => clearTimeout(delayDebounceFN);
  }, [fetchListings]);

  useEffect(() => {
    if (!selectedListingId || selectedItem?.id === selectedListingId) return;

    const matchingItem = items.find((item) => item.id === selectedListingId);
    if (matchingItem) {
      setSelectedItem(matchingItem);
      return;
    }

    let cancelled = false;
    const fetchSelectedListing = async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", selectedListingId)
        .eq("sold", false)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Error fetching selected listing:", error.message);
        return;
      }
      if (data && !blockedSellerIds.includes(data.user_id)) {
        setSelectedItem(data as MarketplaceListing);
      }
    };

    fetchSelectedListing();
    return () => {
      cancelled = true;
    };
  }, [blockedSellerIds, items, selectedItem?.id, selectedListingId]);


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFilterLocationText("Current GPS Location");
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.error("Location error:", err);
        if (err.code === 1) {
          alert("Permission denied. Please allow location access or type a zip code.");
        } else if (err.code === 2) {
          alert("Browser couldn't determine physical location. Please type a zip code/city manually.");
        } else {
          alert("An unknown error occurred while fetching location.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFilterAddressLookup = async () => {
    if (filterLocationText.length < 3) return;
    setIsLocating(true);
    try {
      const API_KEY = import.meta.env.VITE_GEOCODIO_KEY;
      const res = await fetch(`https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(filterLocationText)}&api_key=${API_KEY}`);
      const data = await res.json();

      if (data.results?.length > 0) {
        const result = data.results[0];
        setUserCoords({ lat: result.location.lat, lng: result.location.lng });
        setFilterLocationText(result.formatted_address);
      } else {
        alert("Could not find that location. Try a valid Zip Code or City.");
      }
    } catch (err) {
      console.error(err);
      alert("Error looking up location.");
    }
    setIsLocating(false);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setUserCoords(null);
    setFilterLocationText("");
    setMaxDistance(50);
    setIsFilterMenuOpen(false);
  };


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
      closeListingDetails();
      fetchListings();
    }
  };

  const requireSignedIn = () => {
    if (loggedIn && currentUserId) return true;
    alert("Please log in first.");
    return false;
  };

  const handleToggleSaveListing = async (item: MarketplaceListing) => {
    if (!requireSignedIn() || !currentUserId) return;

    const alreadySaved = savedListingIds.includes(item.id);
    setSavedListingIds((ids) =>
      alreadySaved ? ids.filter((id) => id !== item.id) : [...ids, item.id]
    );

    const savedRaw = localStorage.getItem(MARKETPLACE_SAVE_CACHE_KEY);
    const savedItems = savedRaw ? JSON.parse(savedRaw) : [];
    if (alreadySaved) {
      localStorage.setItem(
        MARKETPLACE_SAVE_CACHE_KEY,
        JSON.stringify(
          savedItems.filter((saved: { id: string }) => saved.id !== item.id)
        )
      );
    } else {
      const nextSavedItem = {
        id: item.id,
        title: item.title,
        price: item.price,
        images: item.images ?? [],
        category: item.category,
        condition: item.condition,
        seller_name: item.seller_name,
        verified: false,
        source: "marketplace",
      };
      localStorage.setItem(
        MARKETPLACE_SAVE_CACHE_KEY,
        JSON.stringify([
          nextSavedItem,
          ...savedItems.filter((saved: { id: string }) => saved.id !== item.id),
        ])
      );
    }

    const { error } = alreadySaved
      ? await supabase
          .from("marketplace_saves")
          .delete()
          .eq("user_id", currentUserId)
          .eq("listing_id", item.id)
      : await supabase.from("marketplace_saves").upsert(
          {
            user_id: currentUserId,
            listing_id: item.id,
          },
          { onConflict: "user_id,listing_id" }
        );

    if (error) {
      console.error("Could not sync saved item to Supabase:", error.message);
    }

    setActionMessage(alreadySaved ? "Removed from saved items." : "Saved item.");
  };

  const handleAddToCart = (item: MarketplaceListing) => {
    const cartItem = {
      id: item.id,
      title: item.title,
      price: item.price,
      images: item.images ?? [],
      category: item.category,
      condition: item.condition,
      seller_name: item.seller_name,
      qty: 1,
      stock: 1,
    };
    const stored =
      sessionStorage.getItem("verifind_cart") ||
      localStorage.getItem("verifind_cart");
    const existing = stored ? JSON.parse(stored) : [];
    const found = existing.find((cartItem: { id: string }) => cartItem.id === item.id);
    const nextCart = found
      ? existing.map((cartItem: { id: string; qty?: number; stock?: number }) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                qty: Math.min(cartItem.stock ?? 1, (cartItem.qty ?? 1) + 1),
              }
            : cartItem
        )
      : [...existing, cartItem];

    sessionStorage.setItem("verifind_cart", JSON.stringify(nextCart));
    localStorage.setItem("verifind_cart", JSON.stringify(nextCart));
    navigate("/cart", {
      state: {
        item: cartItem,
      },
    });
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
    closeListingDetails();
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
    closeListingDetails();
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
    setReportedListingIds((ids) => [...new Set([...ids, selectedItem.id])]);
    setIsReportModalOpen(false);
    setActionMessage(
      "Report submitted. Thanks for helping keep VeriFind safe."
    );
    setActionLoading(false);
  };

  const formatPrice = (price: number) => (price === 0 ? "Free" : `$${price}`);

  const isDemoVerifiedListing = (item: MarketplaceListing) =>
    items.length > 0 && item.id === items[0].id;

  const isListingIdentityVerified = (item: MarketplaceListing) =>
    Boolean(
      item.seller_verified ||
        item.identity_verified ||
        item.verified_user ||
        (item.user_id === currentUserId && currentUserVerified) ||
        isDemoVerifiedListing(item)
    );

  const getSellerProgressFromListings = ({
    sellerName,
    listings,
    sellerVerified = false,
  }: SellerProgressInput): SellerProgress => {
    const hasSellerName = Boolean(sellerName);
    const hasLocation = listings.some(
      (listing) => listing.location_name || (listing.latitude && listing.longitude)
    );
    const hasClearPhotos = listings.some(
      (listing) => (listing.images?.length ?? 0) > 0
    );
    const hasDetailedDescription = listings.some(
      (listing) => (listing.description?.trim().length ?? 0) >= 30
    );
    const hasMultipleListings = listings.length >= 2;
    const hasVerifiedIdentity = listings.some(
      (listing) => isListingIdentityVerified(listing)
    ) || sellerVerified;

    const checks = [
      {
        label: "Public seller name",
        description: "A name helps buyers understand who they are contacting.",
        done: hasSellerName,
        complete: "Public seller name added",
        improve: "Add a public seller name in your profile",
        action: "Go to Profile > Account Details and save a username.",
      },
      {
        label: "Listing location",
        description: "A pickup area helps buyers plan safer local purchases.",
        done: hasLocation,
        complete: "Listing location added",
        improve: "Add a pickup/location area to your listings",
        action: "Add a location when creating or updating a marketplace listing.",
      },
      {
        label: "Clear listing photo",
        description: "Photos make the listing easier to inspect before messaging.",
        done: hasClearPhotos,
        complete: "Listing photo added",
        improve: "Add clear photos instead of leaving listings image-free",
        action: "Paste a clear image URL when listing an item.",
      },
      {
        label: "Detailed description",
        description: "Good descriptions reduce confusion about condition and included items.",
        done: hasDetailedDescription,
        complete: "Detailed description added",
        improve: "Write a more detailed description with condition and included items",
        action: "Write at least a few sentences about condition, flaws, and what is included.",
      },
      {
        label: "Active listing history",
        description: "More active listings show you are building marketplace history.",
        done: hasMultipleListings,
        complete: "Multiple active listings",
        improve: "Build history by keeping more accurate active listings",
        action: "Keep accurate listings active and remove or update items when needed.",
      },
    ];

    const completed = checks
      .filter((check) => check.done)
      .map((check) => check.complete);
    const improvements = checks
      .filter((check) => !check.done)
      .map((check) => check.improve);
    const score = checks.filter((check) => check.done).length;
    const level =
      score >= 4
        ? "Strong Seller Profile"
        : score >= 2
          ? "Building Trust"
          : "New Seller";
    const signals = checks.map((check) => ({
      label: check.label,
      description: check.description,
      done: check.done,
      action: check.action,
    }));

    return {
      level,
      score,
      signals,
      completed,
      improvements,
      identityVerified: hasVerifiedIdentity,
    };
  };

  const getSellerProgress = (item: MarketplaceListing): SellerProgress =>
    getSellerProgressFromListings({
      sellerName: item.seller_name,
      listings: items.filter((listing) => listing.user_id === item.user_id),
      sellerVerified:
        item.user_id === currentUserId
          ? currentUserVerified
          : isListingIdentityVerified(item),
    });

  const getCurrentSellerProgress = (): SellerProgress | null => {
    if (!currentUserId) return null;

    const myListings = items.filter((listing) => listing.user_id === currentUserId);
    const sellerName = myListings.find((listing) => listing.seller_name)?.seller_name ?? null;

    return getSellerProgressFromListings({
      sellerName,
      listings: myListings,
      sellerVerified: currentUserVerified,
    });
  };

  const getTrustBadges = (item: MarketplaceListing): TrustBadge[] => {
    const sellerProgress = getSellerProgress(item);
    const sellerActiveListings = items.filter(
      (listing) => listing.user_id === item.user_id
    ).length;
    const badges: TrustBadge[] = [];

    badges.push({
      label: sellerProgress.level,
      tone: sellerProgress.score >= 4 ? "good" : sellerProgress.score >= 2 ? "info" : "warning",
      icon: sellerProgress.score >= 4 ? "verified" : sellerProgress.score >= 2 ? "active" : "reported",
      detail: `Seller profile strength: ${sellerProgress.score}/5 trust signals completed. This is not identity verification.`,
    });

    if (
      isListingIdentityVerified(item)
    ) {
      badges.push({
        label: "Verified Seller",
        tone: "good",
        icon: "verified",
        detail: "This seller has completed optional identity verification.",
      });
    }

    if (item.seller_name) {
      badges.push({
        label: "Named seller",
        tone: "good",
        icon: "verified",
        detail: "This listing includes a public seller name.",
      });
    }

    if (sellerActiveListings > 1) {
      badges.push({
        label: "Active seller",
        tone: "info",
        icon: "active",
        detail: `${sellerActiveListings} active listings are visible from this seller.`,
      });
    }

    if (item.location_name || (item.latitude && item.longitude)) {
      badges.push({
        label: "Location shared",
        tone: "info",
        icon: "location",
        detail: "The seller added a location to help plan safer pickups.",
      });
    }

    if (reportedListingIds.includes(item.id)) {
      badges.unshift({
        label: "Reported by you",
        tone: "warning",
        icon: "reported",
        detail: "You already submitted a report for this listing.",
      });
    }

    return badges;
  };

  const getTrustBadgeClasses = (tone: TrustBadge["tone"]) => {
    if (tone === "good") {
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    }
    if (tone === "warning") {
      return "border-violet-200 bg-violet-50 text-violet-700";
    }
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  };

  const renderTrustBadgeIcon = (icon: TrustBadge["icon"], size = 13) => {
    if (icon === "verified") return <BadgeCheck size={size} />;
    if (icon === "active") return <ShieldCheck size={size} />;
    if (icon === "location") return <MapPinned size={size} />;
    return <AlertTriangle size={size} />;
  };

  const completeDemoVerification = async () => {
    setVerificationSubmitting(true);
    setVerificationMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { identity_verified: true },
    });

    if (error) {
      setVerificationMessage("Could not verify seller: " + error.message);
      setVerificationSubmitting(false);
      return;
    }

    setCurrentUserVerified(true);
    setVerificationMessage("Verified Seller badge added to your seller profile.");
    setVerificationSubmitting(false);
  };

  // MULTI-LAYER FILTERING: Location & Price
  const filteredItems = items.filter(item => {
    // 1. Price Checks
    if (minPrice !== "" && item.price < Number(minPrice)) return false;
    if (maxPrice !== "" && item.price > Number(maxPrice)) return false;

    // 2. Location Checks
    if (!userCoords) return true;
    if (!item.latitude || !item.longitude) return false;

    const distance = calculateDistance(userCoords.lat, userCoords.lng, item.latitude, item.longitude);
    return distance <= maxDistance;
  });

  return (
    <div
      className="marketplace-page min-h-screen flex flex-col pt-24 pb-12 px-4 relative overflow-hidden bg-[#f0f4ff] dark:bg-gray-950 transition-colors duration-300"
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
        <h1 className="marketplace-title text-4xl font-black mb-8 text-center text-gray-900 dark:text-white tracking-tight">
          Marketplace
        </h1>

        {actionMessage && (
          <div className="mx-auto mb-5 max-w-3xl rounded-2xl border border-blue-100 bg-white/70 dark:bg-blue-900/40 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-200 shadow-sm backdrop-blur-md">
            {actionMessage}
          </div>
        )}

        {loggedIn && (() => {
          const sellerProgress = getCurrentSellerProgress();
          if (!sellerProgress) return null;
          const nextStepCount = sellerProgress.improvements.length;

          return (
            <div className="mx-auto mb-8 max-w-3xl rounded-3xl border border-cyan-500/20 bg-[#0b1733]/85 p-5 shadow-xl backdrop-blur-md">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 flex-shrink-0 rounded-full bg-slate-100 p-2 shadow-inner">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#00AAFF ${
                        (sellerProgress.score / 5) * 360
                      }deg, rgba(107,48,255,0.2) 0deg)`,
                    }}
                  />
                  <div className="absolute inset-2 flex items-center justify-center rounded-full bg-[#111f3d]">
                    <span className="text-lg font-black text-cyan-100">
                      {sellerProgress.score}/5
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-200/80">
                      Seller Profile Strength
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${getTrustBadgeClasses(
                        sellerProgress.score >= 4
                          ? "good"
                          : sellerProgress.score >= 2
                            ? "info"
                            : "warning"
                      )}`}
                    >
                      {renderTrustBadgeIcon(
                        sellerProgress.score >= 4
                          ? "verified"
                          : sellerProgress.score >= 2
                            ? "active"
                            : "reported",
                        14
                      )}
                      {sellerProgress.level}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-100">
                    {sellerProgress.level === "Strong Seller Profile"
                      ? "Your marketplace profile has strong trust signals."
                      : `Complete ${nextStepCount} more trust ${
                          nextStepCount === 1 ? "signal" : "signals"
                        } to level up.`}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {sellerProgress.completed.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100"
                      >
                        {item}
                      </span>
                    ))}
                    {sellerProgress.improvements.slice(0, 2).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSellerProgressOpen(true)}
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
                  style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                >
                  View All Signals
                </button>
              </div>
            </div>
          );
        })()}

        {/* Search + Post Bar + Filters Dropdown */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto relative">
          <div className="relative flex-1 group">
            <Search className="marketplace-search-icon absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => updateURLParam("q", e.target.value)}
              className="marketplace-search-input w-full pl-12 pr-4 py-3.5 bg-white/70 dark:bg-gray-800/80 dark:text-white backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-4 justify-center">
            {/* Filters Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-all outline-none"
              >
                <Filter size={18} /> Filters
                {/* Active Filter */}
                {(selectedCategory !== "all" || userCoords || minPrice || maxPrice) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </button>

              {/* Filter Menu */}
              {isFilterMenuOpen && (
                <div className="absolute top-[115%] right-0 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl rounded-3xl p-6 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Filters</h3>
                    <button onClick={() => setIsFilterMenuOpen(false)}>
                      <X size={20} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" />
                    </button>
                  </div>

                  {/* Category section */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => updateURLParam("category", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
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
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800 mb-6" />

                  {/* Price section */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                      Price Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => updateURLParam("minPrice", e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-gray-400 font-bold">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => updateURLParam("maxPrice", e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800 mb-6" />

                  {/* Location Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                        Location
                      </label>
                    </div>

                    <div className="flex flex-col gap-3">

                      {/* Manual Location Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Zip or City..."
                          value={filterLocationText}
                          onChange={(e) => setFilterLocationText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleFilterAddressLookup()}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <button
                          onClick={handleFilterAddressLookup}
                          disabled={isLocating || filterLocationText.length < 3}
                          className="px-3 py-2 bg-gray-900 dark:bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isLocating ? "..." : "Go"}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <hr className="flex-1 border-gray-200 dark:border-gray-700"/>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">OR</span>
                        <hr className="flex-1 border-gray-200 dark:border-gray-700"/>
                      </div>

                      {/* GPS Button */}
                      {userCoords ? (
                         <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                           <Navigation size={14} /> Location Active ✓
                         </div>
                      ) : (
                        <button
                          onClick={handleGetLocation}
                          disabled={isLocating}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        >
                          <Navigation size={14} /> {isLocating ? "Locating..." : "Use GPS"}
                        </button>
                      )}

                      {/* Distance Slider */}
                      <div className={`transition-all duration-300 mt-2 ${userCoords ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Radius</span>
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">{maxDistance} mi</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="200"
                          step="5"
                          value={maxDistance}
                          onChange={(e) => setMaxDistance(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <button
                    onClick={handleClearFilters}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all"
                  >
                    <RotateCcw size={16} /> Clear All Filters
                  </button>
                </div>
              )}
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
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-medium text-lg w-full">
            No items found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {filteredItems.map((item) => {
              const trustBadges = getTrustBadges(item);

              return (
                <div
                  key={item.id}
                  className="marketplace-card bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-[2rem] p-4 border border-white/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  <div className="marketplace-card-image aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-900">
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
                    <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">
                      {item.category}
                    </p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-2xl font-medium mb-3 text-gray-900 dark:text-gray-200">
                      {formatPrice(item.price)}
                    </p>

                    {userCoords && item.latitude && item.longitude && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold flex items-center gap-1">
                        <MapPin size={12} className="text-blue-500" />
                        {Math.round(calculateDistance(userCoords.lat, userCoords.lng, item.latitude, item.longitude))} miles away
                      </p>
                    )}

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {trustBadges.slice(0, 2).map((badge) => (
                        <span
                          key={badge.label}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getTrustBadgeClasses(
                            badge.tone
                          )}`}
                          title={badge.detail}
                        >
                          {renderTrustBadgeIcon(badge.icon)}
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => openListingDetails(item)}
                      className="marketplace-view-button w-full mt-auto cursor-pointer py-3 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-gray-600 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: POST LISTING */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="marketplace-modal bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-8 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  List an Item
                </h2>
                <button
                  onClick={() => setIsPostModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handlePostItem} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                    Title
                  </label>
                  <input
                    required
                    placeholder="What are you selling?"
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                      Price
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                      Category
                    </label>
                    <select
                      className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
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
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                    Condition
                  </label>
                  <select
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
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
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                    Location *Required
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        placeholder="Enter address..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
                        value={tempAddress}
                        onChange={(e) => setTempAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddressLookup(tempAddress)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddressLookup(tempAddress)}
                      className="px-4 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      Find
                    </button>
                  </div>
                  {formData.location_name && (
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-bold px-1 italic">
                      ✓ Found: {formData.location_name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                    Image URL
                  </label>
                  <div className="relative">
                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="https://..."
                      className="marketplace-form-input w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
                      value={formData.imageInput}
                      onChange={(e) =>
                        setFormData({ ...formData, imageInput: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details..."
                    className="marketplace-form-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={!formData.latitude || !formData.longitude}
                  className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all mt-4 ${
                    formData.latitude && formData.longitude
                      ? "text-white hover:opacity-90 active:scale-[0.98]"
                      : "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                  style={
                    formData.latitude && formData.longitude
                      ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }
                      : {}
                  }
                >
                  {formData.latitude && formData.longitude ? "Publish Listing" : "Set Location to Publish"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isSellerProgressOpen && (() => {
        const sellerProgress = getCurrentSellerProgress();
        if (!sellerProgress) return null;

        return (
          <div className="fixed inset-0 z-[72] flex items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm">
            <div className="my-6 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-[#0b1733] shadow-2xl">
              <div className="flex-1 overflow-y-auto p-6 md:p-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-200/80">
                      Seller Profile Strength
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-100">
                      {sellerProgress.level}
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {sellerProgress.score}/5 profile signals completed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSellerProgressOpen(false)}
                    className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  {sellerProgress.signals.map((signal) => (
                    <div
                      key={signal.label}
                      className={`rounded-2xl border p-4 ${
                        signal.done
                          ? "border-cyan-300/30 bg-cyan-400/10"
                          : "border-violet-300/30 bg-violet-400/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                            signal.done
                              ? "bg-cyan-300 text-[#0b1733]"
                              : "bg-violet-300 text-[#0b1733]"
                          }`}
                        >
                          {signal.done ? (
                            <BadgeCheck size={17} />
                          ) : (
                            <AlertTriangle size={17} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-slate-100">
                              {signal.label}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                signal.done
                                  ? "bg-cyan-300/20 text-cyan-100"
                                  : "bg-violet-300/20 text-violet-100"
                              }`}
                            >
                              {signal.done ? "Complete" : "Incomplete"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">
                            {signal.description}
                          </p>
                          {!signal.done && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-violet-100">
                                {signal.action}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-[#111f3d] p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        sellerProgress.identityVerified
                          ? "bg-cyan-300 text-[#0b1733]"
                          : "bg-slate-300/20 text-slate-200"
                      }`}
                    >
                      <BadgeCheck size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-slate-100">
                          Optional: Verified Seller
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            sellerProgress.identityVerified
                              ? "bg-cyan-300/20 text-cyan-100"
                              : "bg-slate-300/15 text-slate-200"
                          }`}
                        >
                          {sellerProgress.identityVerified
                            ? "Verified"
                            : "Optional"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        This is separate from the 5/5 profile score. It represents
                        optional identity verification, similar to verification
                        systems on other platforms.
                      </p>
                      {!sellerProgress.identityVerified && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSellerProgressOpen(false);
                            setVerificationMessage(null);
                            setIsVerifyModalOpen(true);
                          }}
                          className="mt-3 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-90"
                          style={{
                            background:
                              "linear-gradient(90deg,#00AAFF,#6B30FF)",
                          }}
                        >
                          Verify Seller
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSellerProgressOpen(false);
                      navigate("/profile/username");
                    }}
                    className="rounded-xl border border-cyan-500/30 bg-[#13284d] py-3 text-sm font-bold text-slate-100 transition hover:bg-[#17325f]"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSellerProgressOpen(false);
                      setIsPostModalOpen(true);
                    }}
                    className="rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
                    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                  >
                    Add Listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-[73] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-[#0b1733] p-6 shadow-2xl md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-cyan-200/80">
                  Optional Identity Badge
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-100">
                  Verified Seller
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-slate-200">
              This prototype adds a verified badge to your account without storing
              real ID images. A production version would use a trusted verification
              provider to scan an ID or verify school/work identity.
            </div>

            {verificationMessage && (
              <div className="mt-4 rounded-2xl border border-violet-300/30 bg-violet-400/10 p-3 text-sm font-semibold text-violet-100">
                {verificationMessage}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="rounded-xl border border-cyan-500/30 bg-[#13284d] py-3 text-sm font-bold text-slate-100 transition hover:bg-[#17325f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={completeDemoVerification}
                disabled={verificationSubmitting || currentUserVerified}
                className="rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {currentUserVerified
                  ? "Verified"
                  : verificationSubmitting
                    ? "Verifying..."
                    : "Complete Demo Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ITEM DETAILS */}
      {selectedItem && (
        <div
          onClick={closeListingDetails}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="marketplace-detail-modal bg-white dark:bg-gray-900 rounded-[32px] max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:flex-row border border-white/20 dark:border-gray-700"
          >
            <button
              onClick={closeListingDetails}
              className="absolute top-6 right-6 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full hover:bg-white dark:hover:bg-gray-700 z-10 w-10 h-10 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <X size={20} className="text-gray-900 dark:text-white" />
            </button>

            <div className="w-full md:w-[55%] bg-gray-50 dark:bg-gray-800 min-h-[300px] flex items-center justify-center">
              <img
                src={
                  selectedItem.images?.[0] ||
                  "https://placehold.co/600x600/e2e8f0/64748b?text=No+Image"
                }
                className="w-full h-full object-cover"
                alt={selectedItem.title}
              />
            </div>

            <div className="w-full md:w-[45%] p-10 md:p-12 flex flex-col bg-white dark:bg-gray-900">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedItem.category}
                </span>
                <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedItem.condition}
                </span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                {selectedItem.title}
              </h2>
              <p className="text-4xl font-medium mb-8 text-gray-900 dark:text-gray-200">
                {formatPrice(selectedItem.price)}
              </p>

              <div className="mb-8 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-cyan-600" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                    Seller Profile Signals
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getTrustBadges(selectedItem).map((badge) => (
                    <div
                      key={badge.label}
                      className={`rounded-xl border px-3 py-2 ${getTrustBadgeClasses(
                        badge.tone
                      )}`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        {renderTrustBadgeIcon(badge.icon, 14)}
                        {badge.label}
                      </div>
                      <p className="mt-1 max-w-[13rem] text-[11px] font-medium leading-snug opacity-80">
                        {badge.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-200 bg-white/70 p-3">
                  <div className="flex items-start gap-2">
                    <BadgeCheck
                      size={16}
                      className={
                        getSellerProgress(selectedItem).identityVerified
                          ? "mt-0.5 flex-shrink-0 text-cyan-600"
                          : "mt-0.5 flex-shrink-0 text-slate-400"
                      }
                    />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-gray-900">
                        Optional Identity Verification
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">
                        {getSellerProgress(selectedItem).identityVerified
                          ? "Verified Seller badge active."
                          : currentUserId === selectedItem.user_id
                            ? "You can add a Verified Seller badge from View All Signals."
                            : "This seller has not added optional identity verification."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {currentUserId === selectedItem.user_id && (() => {
                const progress = getSellerProgress(selectedItem);

                return (
                  <div className="mb-8 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-violet-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={18} className="text-cyan-600" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                          Your Seller Level
                        </h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700 shadow-sm">
                        {progress.score}/5
                      </span>
                    </div>

                    <p className="text-2xl font-black text-gray-900">
                      {progress.level}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(progress.score / 5) * 100}%`,
                          background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                        }}
                      />
                    </div>

                    {progress.completed.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wider text-cyan-700">
                          Helping your score
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {progress.completed.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {progress.improvements.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                          To improve
                        </p>
                        <ul className="mt-2 space-y-2">
                          {progress.improvements.slice(0, 3).map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-xs font-semibold text-gray-700"
                            >
                              <AlertTriangle
                                size={14}
                                className="mt-0.5 flex-shrink-0 text-violet-600"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-6 mb-10 flex-grow">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedItem.description || "No description provided."}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Location
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin size={14} className="text-blue-500" />
                    <span className="text-sm font-medium">
                      {selectedItem.location_name || "Location not provided"}
                    </span>
                  </div>
                  {selectedItem.latitude && (
                    <div
                      id="item-map"
                      className="w-full h-48 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner bg-gray-50 dark:bg-gray-800"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/users/${selectedItem.user_id}`)}
                  className="pt-6 border-t border-gray-100 dark:border-gray-800 flex w-full cursor-pointer items-center gap-3 text-left transition hover:opacity-80"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedItem.seller_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                      Listed By
                    </p>
                    <p className="text-sm font-bold dark:text-white">
                      {selectedItem.seller_name || "Anonymous"}
                    </p>
                    <p className="text-xs font-semibold text-blue-500">
                      View profile reviews
                    </p>
                  </div>
                </button>
              </div>

              {currentUserId === selectedItem.user_id ? (
                <button
                  onClick={() => handleDeleteListing(selectedItem.id)}
                  className="w-full py-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-lg font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} /> Delete Listing
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleSaveListing(selectedItem)}
                      className="w-full cursor-pointer py-3.5 rounded-xl border border-pink-200 dark:border-pink-900/30 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 font-bold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Heart
                        size={16}
                        fill={savedListingIds.includes(selectedItem.id) ? "currentColor" : "none"}
                      />
                      {savedListingIds.includes(selectedItem.id) ? "Saved" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(selectedItem)}
                      className="w-full cursor-pointer py-3.5 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  </div>
                  <button
                    onClick={handleOpenMessage}
                    disabled={actionLoading}
                    className="w-full cursor-pointer py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 shadow-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageCircle size={20} /> Message Seller
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setActionMessage(null);
                        setIsReportModalOpen(true);
                      }}
                      className="w-full cursor-pointer py-3.5 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <ShieldAlert size={16} /> Report
                    </button>
                    <button
                      onClick={() => {
                        setBlockMessage(null);
                        setIsBlockModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="w-full cursor-pointer py-3.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* REPORT MODAL */}
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

      {/* BLOCK MODAL */}
      {isBlockModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="report-modal-shell bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  Block Seller
                </h2>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300">
                Block{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedItem.seller_name || "this seller"}
                </span>
                ? You will not be able to message each other, and their listings
                will be hidden for you.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                You can unblock them later from Profile under{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">Blocked Users</span>.
              </p>

              {blockMessage && (
                <div className="report-status-message rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300 p-3 mt-4">
                  {blockMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="report-cancel-button w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
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
        <Link to="/privacy-policy" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

<<<<<<< HEAD
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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
    images: [""],
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
    setActiveImageIndex(0);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("listing", item.id);
      return next;
    }, { replace: true });
  };

  const closeListingDetails = () => {
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
    // fixes the double closes modal bug
    if (!selectedListingId) {
      setSelectedItem(null);
      return;
    }
    if (selectedItem?.id === selectedListingId) return;
    const matchingItem = items.find((item) => item.id === selectedListingId);
    if (matchingItem) {
      setSelectedItem(matchingItem);
      setActiveImageIndex(0);
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
        setActiveImageIndex(0);
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

    // Flatten comma-separated strings and filter out blanks
    const validImages = formData.images
      .flatMap((img) => img.split(","))
      .map((img) => img.trim())
      .filter((img) => img !== "");

    const { error } = await supabase.from("marketplace_listings").insert([
      {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: numericPrice,
        category: formData.category,
        condition: formData.condition,
        images: validImages,
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
        images: [""],
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
=======
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase-client";

// ─── Types ────────────────────────────────────────────────────
type Condition = "New" | "Used";
type SortKey   = "newest" | "price-asc" | "price-desc" | "saves";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: Condition;
  images: string[];
  seller_name: string | null;
  verified: boolean;
  sold: boolean;
  created_at: string;
  save_count?: number;
  stock: number; // available quantity; 1 = one unit only, 2 = two available
}

interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  listing_id: string;
  other_user_id: string;
  other_username: string;
  listing_title: string;
  last_message: string;
  last_at: string;
  unread: number;
}

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "All"         },
  { id: "electronics", label: "Electronics" },
  { id: "fashion",     label: "Fashion"     },
  { id: "jewellery",   label: "Jewellery"   },
  { id: "sports",      label: "Sports"      },
];

const GRAD = "linear-gradient(135deg,#00AAFF,#6B30FF)";

const COND: Record<Condition, { bg: string; color: string }> = {
  "New":  { bg: "rgba(16,185,129,0.12)",  color: "rgb(5,150,105)"  },
  "Used": { bg: "rgba(245,158,11,0.12)",  color: "rgb(180,110,0)"  },
};

// Fake deals-completed counts per seller
const SELLER_DEALS: Record<string, number> = {
  Bob: 47, Jack: 83, Axel: 31, Chris: 12, Ryan: 64,
  Luca: 29, Finn: 8, Omar: 55, Noah: 102, Eli: 19,
};

const t = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const MOCK_LISTINGS: Listing[] = [
  // Electronics
  { id:"e1",  user_id:"mock", title:"Apple MacBook Pro 16-inch M3 Pro – Space Black",     price:2199.99, category:"electronics", condition:"Used", seller_name:"Bob",   verified:true,  sold:false, save_count:24, created_at:t(0),  description:"M3 Pro chip 18 GB RAM 512 GB SSD. AppleCare+ until 2026. Original 140W charger and box.",         images:["/img1.jpeg"], stock:1 },
  { id:"e2",  user_id:"mock", title:"Apple iPhone 16 Pro Max 256 GB – Natural Titanium",  price:1099.00, category:"electronics", condition:"New",  seller_name:"Jack",  verified:true,  sold:false, save_count:41, created_at:t(2),  description:"Sealed box factory unlocked. Works with all carriers. Ships same day.",                             images:["/img2.jpeg"], stock:2 },
  { id:"e3",  user_id:"mock", title:"Apple MacBook Air 15-inch M3 – Midnight",            price:1149.00, category:"electronics", condition:"Used", seller_name:"Axel",  verified:true,  sold:false, save_count:19, created_at:t(5),  description:"MacBook Air 15 M3 8 GB 256 GB SSD. Used 2 months, perfect condition. Original packaging.",         images:["/img3.jpeg"], stock:1 },
  { id:"e4",  user_id:"mock", title:"Apple iPhone 15 128 GB – Pink – Unlocked",           price:649.00,  category:"electronics", condition:"Used", seller_name:"Chris", verified:false, sold:false, save_count:11, created_at:t(8),  description:"Small scuff on back corner, screen pristine. Battery health 91%.",                                  images:["/img4.jpeg"], stock:1 },
  { id:"e5",  user_id:"mock", title:"Apple MacBook Pro 14-inch M3 – Silver",              price:1699.00, category:"electronics", condition:"Used", seller_name:"Ryan",  verified:true,  sold:false, save_count:30, created_at:t(12), description:"M3 8 GB 512 GB SSD. Purchased 3 months ago, kept in sleeve daily.",                                 images:["/img5.jpeg"], stock:1 },
  { id:"e6",  user_id:"mock", title:"Apple iPhone 16 256 GB – Ultramarine",               price:799.00,  category:"electronics", condition:"New",  seller_name:"Luca",  verified:true,  sold:false, save_count:22, created_at:t(15), description:"Sealed, never opened. Bought as a gift, wrong model. Factory unlocked.",                             images:["/img6.jpeg"], stock:2 },
  { id:"e7",  user_id:"mock", title:"Apple MacBook Air 13-inch M2 – Starlight",           price:849.00,  category:"electronics", condition:"Used", seller_name:"Finn",  verified:false, sold:false, save_count:8,  created_at:t(20), description:"M2 8 GB 256 GB SSD. Minor wear on palm rest. Battery 88%.",                                          images:["/img7.jpeg"], stock:1 },
  { id:"e8",  user_id:"mock", title:"Apple iPhone 16 Pro 512 GB – Desert Titanium",       price:1249.00, category:"electronics", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:35, created_at:t(25), description:"2 weeks old. Screen protector from day one. Immaculate.",                                             images:["/img8.jpeg"], stock:1 },
  { id:"e9",  user_id:"mock", title:"Apple MacBook Pro 16-inch M4 Pro – Space Black",     price:2699.00, category:"electronics", condition:"New",  seller_name:"Noah",  verified:true,  sold:false, save_count:47, created_at:t(30), description:"Latest M4 Pro 24 GB 512 GB SSD. Sealed retail box full Apple warranty.",                              images:["/img9.jpeg"], stock:2 },
  { id:"e10", user_id:"mock", title:"Apple iPhone 15 Pro Max 256 GB – Natural Titanium",  price:899.00,  category:"electronics", condition:"Used", seller_name:"Eli",   verified:false, sold:false, save_count:14, created_at:t(36), description:"Used 10 months. Battery 86%. Minor frame scuffs, screen perfect. Unlocked.",                          images:["/img10.jpeg"], stock:1 },
  // Fashion
  { id:"f1",  user_id:"mock", title:"Nike Tech Fleece Full-Zip Hoodie – Dark Grey – L",   price:89.99,  category:"fashion", condition:"Used", seller_name:"Jack",  verified:true,  sold:false, save_count:18, created_at:t(1),  description:"Worn twice. No damage, tags still attached.",                          images:["/img11.jpeg"], stock:1 },
  { id:"f2",  user_id:"mock", title:"Uniqlo Ultra Light Down Jacket – Navy – M",          price:49.90,  category:"fashion", condition:"Used", seller_name:"Chris", verified:true,  sold:false, save_count:9,  created_at:t(4),  description:"Worn regularly last winter, no marks or snags.",                       images:["/img12.jpeg"], stock:1 },
  { id:"f3",  user_id:"mock", title:"Nike Club Fleece Joggers – Black – M",               price:44.99,  category:"fashion", condition:"Used", seller_name:"Axel",  verified:false, sold:false, save_count:12, created_at:t(7),  description:"Worn 3 times, no pilling.",                                            images:["/img13.jpeg"], stock:2 },
  { id:"f4",  user_id:"mock", title:"Uniqlo Merino Crew Neck Sweater – Camel – S",        price:39.90,  category:"fashion", condition:"Used", seller_name:"Bob",   verified:false, sold:false, save_count:6,  created_at:t(10), description:"Slight pilling under arms, otherwise perfect. Dry cleaned.",           images:["/img14.jpeg"], stock:1 },
  { id:"f5",  user_id:"mock", title:"Nike Windrunner Jacket – White Black – M",           price:74.99,  category:"fashion", condition:"Used", seller_name:"Ryan",  verified:true,  sold:false, save_count:21, created_at:t(14), description:"Worn a few times. No stains, zips work perfectly.",                   images:["/img15.jpeg"], stock:1 },
  { id:"f6",  user_id:"mock", title:"Uniqlo Crew Neck T-Shirt 3-Pack – White – XL",      price:19.90,  category:"fashion", condition:"New",  seller_name:"Luca",  verified:false, sold:false, save_count:4,  created_at:t(18), description:"Brand new 3-pack. Never opened. Bought wrong size.",                  images:["/img16.jpeg"], stock:2 },
  { id:"f7",  user_id:"mock", title:"Nike Essential Running Jacket – Blue – S",           price:59.99,  category:"fashion", condition:"Used", seller_name:"Finn",  verified:false, sold:false, save_count:7,  created_at:t(22), description:"Small fade on left sleeve. Otherwise great condition.",                images:["/img17.jpeg"], stock:1 },
  { id:"f8",  user_id:"mock", title:"Uniqlo Kando Pants – Beige – 30x32",                price:34.90,  category:"fashion", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:13, created_at:t(27), description:"Worn twice to the office. Lightweight and stretchy.",                 images:["/img18.jpeg"], stock:1 },
  { id:"f9",  user_id:"mock", title:"Nike Swoosh Graphic Tee – Black – XL",              price:29.99,  category:"fashion", condition:"Used", seller_name:"Noah",  verified:false, sold:false, save_count:5,  created_at:t(32), description:"Print still crisp. Small mark inside collar.",                        images:["/img19.jpeg"], stock:2 },
  { id:"f10", user_id:"mock", title:"Uniqlo Fleece Full-Zip Jacket – Olive – L",         price:44.90,  category:"fashion", condition:"Used", seller_name:"Eli",   verified:false, sold:false, save_count:10, created_at:t(38), description:"Very warm. Worn maybe 4 times. No damage.",                           images:["/img20.jpeg"], stock:1 },
  // Jewellery
  { id:"j1",  user_id:"mock", title:"10K Gold 0.25ct Diamond Solitaire Ring – Size 7",   price:349.00, category:"jewellery", condition:"Used", seller_name:"Bob",   verified:true,  sold:false, save_count:33, created_at:t(2),  description:"10K gold solitaire 0.25ct round brilliant. Appraisal included.",    images:["/img21.jpeg"], stock:1 },
  { id:"j2",  user_id:"mock", title:"14K Rose Gold Cuban Link Chain – 18in 4mm",         price:629.00, category:"jewellery", condition:"New",  seller_name:"Axel",  verified:true,  sold:false, save_count:15, created_at:t(5),  description:"Solid 14K rose gold Cuban chain. Hallmarked with certificate.",      images:["/img22.jpeg"], stock:1 },
  { id:"j3",  user_id:"mock", title:"Sterling Silver Hoop Earrings 40mm – Pair",         price:28.00,  category:"jewellery", condition:"New",  seller_name:"Chris", verified:false, sold:false, save_count:8,  created_at:t(9),  description:"925 sterling silver hoops. Hypoallergenic. Never worn.",             images:["/img23.jpeg"], stock:2 },
  { id:"j4",  user_id:"mock", title:"14K White Gold Diamond Tennis Bracelet 1ct",        price:895.00, category:"jewellery", condition:"Used", seller_name:"Ryan",  verified:true,  sold:false, save_count:44, created_at:t(13), description:"14K white gold tennis bracelet 1ct total. Original box and appraisal.", images:["/img24.jpeg"], stock:1 },
  { id:"j5",  user_id:"mock", title:"Gold Plated Chunky Chain Necklace – 20in",          price:42.00,  category:"jewellery", condition:"Used", seller_name:"Luca",  verified:false, sold:false, save_count:6,  created_at:t(17), description:"Light tarnish on the clasp, chain itself perfect.",                  images:["/img25.jpeg"], stock:1 },
  { id:"j6",  user_id:"mock", title:"925 Silver Vintage Signet Ring – Size 9",           price:65.00,  category:"jewellery", condition:"Used", seller_name:"Finn",  verified:false, sold:false, save_count:11, created_at:t(21), description:"Engraved star design. Worn twice. No scratches.",                    images:["/img26.jpeg"], stock:1 },
  { id:"j7",  user_id:"mock", title:"14K Gold Stud Earrings 0.5ct Total Diamonds",      price:425.00, category:"jewellery", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:29, created_at:t(26), description:"0.25ct each. Butterfly backs. Original jeweller box.",               images:["/img27.jpeg"], stock:1 },
  { id:"j8",  user_id:"mock", title:"Rose Gold Minimalist Watch – Stainless Steel",      price:89.00,  category:"jewellery", condition:"Used", seller_name:"Noah",  verified:false, sold:false, save_count:9,  created_at:t(31), description:"Light scratches on case back. Battery new.",                          images:["/img28.jpeg"], stock:1 },
  { id:"j9",  user_id:"mock", title:"10K Gold Rope Chain Necklace – 22in 2mm",          price:185.00, category:"jewellery", condition:"New",  seller_name:"Eli",   verified:true,  sold:false, save_count:17, created_at:t(35), description:"10K solid yellow gold. Brand new with tags. Gift box included.",     images:["/img29.jpeg"], stock:2 },
  { id:"j10", user_id:"mock", title:"Aquamarine Silver Pendant Necklace – 18in",         price:55.00,  category:"jewellery", condition:"Used", seller_name:"Jack",  verified:false, sold:false, save_count:7,  created_at:t(40), description:"Aquamarine gemstone pendant on 925 silver chain. Worn once.",        images:["/img30.jpeg"], stock:1 },
  // Sports
  { id:"s1",  user_id:"mock", title:"Nike Air Max 95 Triple Black – Men Size 10",        price:149.99, category:"sports", condition:"Used", seller_name:"Axel",  verified:true,  sold:false, save_count:27, created_at:t(3),  description:"Worn 3 times. Soles still clean. Original box and extra laces.",   images:["/img31.jpeg"], stock:1 },
  { id:"s2",  user_id:"mock", title:"Nike Tech Pack Woven Trousers – Black – M",         price:119.95, category:"sports", condition:"New",  seller_name:"Bob",   verified:true,  sold:false, save_count:12, created_at:t(6),  description:"Brand new with tags. Tapered fit, zip pockets.",                   images:["/img32.jpeg"], stock:2 },
  { id:"s3",  user_id:"mock", title:"Nike Air Force 1 White – Men Size 11",              price:89.99,  category:"sports", condition:"Used", seller_name:"Chris", verified:false, sold:false, save_count:16, created_at:t(9),  description:"Worn about 10 times, slight creasing on toe box. Cleaned.",        images:["/img33.jpeg"], stock:1 },
  { id:"s4",  user_id:"mock", title:"Nike Dri-FIT Running Shorts – Grey – L",            price:34.99,  category:"sports", condition:"Used", seller_name:"Ryan",  verified:false, sold:false, save_count:5,  created_at:t(13), description:"Worn twice for the gym. No fade or damage.",                       images:["/img34.jpeg"], stock:2 },
  { id:"s5",  user_id:"mock", title:"Nike Air Max 270 React – White Volt – Size 9.5",    price:109.99, category:"sports", condition:"Used", seller_name:"Luca",  verified:true,  sold:false, save_count:20, created_at:t(17), description:"Lightly worn, no yellowing on sole. Box included.",                images:["/img35.jpeg"], stock:1 },
  { id:"s6",  user_id:"mock", title:"Nike Pro Compression Tights – Black – M",           price:49.99,  category:"sports", condition:"New",  seller_name:"Finn",  verified:false, sold:false, save_count:4,  created_at:t(21), description:"Brand new in wrapper. Never worn.",                                 images:["/img36.jpeg"], stock:2 },
  { id:"s7",  user_id:"mock", title:"Nike Metcon 9 Training Shoes – White Black – 10",   price:119.99, category:"sports", condition:"Used", seller_name:"Omar",  verified:true,  sold:false, save_count:23, created_at:t(26), description:"Used for gym training 5 times. Soles barely worn.",                images:["/img37.jpeg"], stock:1 },
  { id:"s8",  user_id:"mock", title:"Nike Pegasus 41 Running Shoes – Blue – 10.5",       price:129.99, category:"sports", condition:"Used", seller_name:"Noah",  verified:false, sold:false, save_count:14, created_at:t(31), description:"Approx 80 miles. Upper clean, midsole cushion great.",             images:["/img38.jpeg"], stock:1 },
  { id:"s9",  user_id:"mock", title:"Nike Tech Fleece Joggers – Navy – L",               price:79.99,  category:"sports", condition:"Used", seller_name:"Eli",   verified:true,  sold:false, save_count:18, created_at:t(35), description:"Worn a handful of times. No pilling. Elastic ankles perfect.",     images:["/img39.jpeg"], stock:1 },
  { id:"s10", user_id:"mock", title:"Nike Air Max 1 – Wheat Gum – Men Size 9",           price:139.99, category:"sports", condition:"Used", seller_name:"Jack",  verified:false, sold:false, save_count:10, created_at:t(40), description:"Worn regularly over a summer. Uppers clean.",                      images:["/img40.jpeg"], stock:2 },
];

// ─── Promoted listings (paid Featured tier — shown pinned at top) ─
const PROMO_START_SECONDS = 1000 * 3600;
const PROMO_EPOCH = Date.now();

const PROMOTED_LISTINGS: Listing[] = [
  {
    id: "p1", user_id: "mock",
    title: "Apple MacBook Pro 16-inch M4 Max – 128 GB – Space Black",
    price: 3499.00, category: "electronics", condition: "New",
    seller_name: "Noah", verified: true, sold: false, save_count: 62,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    description: "M4 Max chip, 128 GB unified memory, 2 TB SSD. Sealed retail box. Full Apple warranty and receipt. Ships same day.",
    images: ["/img9.jpeg"], stock: 1,
  },
  {
    id: "p2", user_id: "mock",
    title: "Nike Air Jordan 1 Retro High OG – Chicago – Size 10",
    price: 389.00, category: "sports", condition: "New",
    seller_name: "Axel", verified: true, sold: false, save_count: 88,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    description: "DS Chicago colourway. Original box, lace bag, receipt. Purchased from Nike SNKRS. Never worn or tried on.",
    images: ["/img31.jpeg"], stock: 1,
  },
];

// ─── Countdown timer hook ──────────────────────────────────────
function useCountdown(startSeconds: number, epochMs: number) {
  const elapsed = Math.floor((Date.now() - epochMs) / 1000);
  const [secs, setSecs] = useState(Math.max(0, startSeconds - elapsed));
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h  = Math.floor(secs / 3600);
  const m  = Math.floor((secs % 3600) / 60);
  const s  = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}h ${pad(m)}m ${pad(s)}s`;
}

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (p: number) => "$" + Number(p).toLocaleString("en-US", { minimumFractionDigits: 2 });
const isMock = (id: string) => /^[efjs]/.test(id) || /^p/.test(id);

function PromotedCard({
  item,
  saved,
  onView,
  onToggleSave,
  onAddToCart,
}: {
  item: Listing;
  saved: boolean;
  onView: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onAddToCart: (e: React.MouseEvent) => void;
}) {
  const countdown = useCountdown(PROMO_START_SECONDS, PROMO_EPOCH);
  const c = COND[item.condition] ?? COND["Used"];
  const imgs = Array.isArray(item.images) ? item.images : [];
  const deals = SELLER_DEALS[item.seller_name ?? ""] ?? 0;
>>>>>>> 7113605d04dee12a5116a3645ab0d223697c177e

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
<<<<<<< HEAD
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
=======
      onClick={onView}
      className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 relative"
      style={{
        width: 220,

        // ✅ theme-aware background
        background: "var(--card)",

        border: "1.5px solid rgba(245,158,11,0.45)",

       boxShadow:
  "0 4px 24px rgba(245,158,11,0.18), 0 8px 40px rgba(0,0,0,0.35)"
      }}
    >
      {/* Promoted ribbon */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-2.5 py-1 z-10"
        style={{ background: "linear-gradient(90deg,rgba(245,158,11,0.92),rgba(234,88,12,0.88))" }}
      >
        <div className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[9px] font-black text-white uppercase tracking-wider">Featured</span>
        </div>
        <span className="text-[9px] font-bold text-white/90 font-mono">{countdown}</span>
      </div>

      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 156, marginTop: 22 }}>
        {imgs.length > 0 ? (
          <img
            src={imgs[0]} alt={item.title}
            className="w-full h-full transition-transform duration-300 hover:scale-105"
            style={{ objectFit: "cover", objectPosition: "center", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.07),rgba(234,88,12,0.07))" }}>
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
>>>>>>> 7113605d04dee12a5116a3645ab0d223697c177e
          </div>
        )}
        {item.verified && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: GRAD }}>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Verified
          </div>
        )}
        <button
          onClick={onToggleSave}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition hover:scale-110"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer" }}
        >
          <svg className="w-3.5 h-3.5" fill={saved ? "#EF4444" : "none"} viewBox="0 0 24 24" stroke={saved ? "#EF4444" : "#9CA3AF"} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
          </svg>
        </button>
      </div>

<<<<<<< HEAD
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
                    Image URLs
                  </label>
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          placeholder="https://..."
                          className="marketplace-form-input w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none"
                          value={url}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                        />
                      </div>
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="px-3 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, images: [...formData.images, ""] })}
                    className="text-xs font-bold text-blue-500 text-left mt-1 hover:text-blue-600 transition-colors"
                  >
                    + Add another image
                  </button>
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
=======
      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1" onClick={onView}>
        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 self-start" style={{ background: c.bg, color: c.color }}>{item.condition}</span>
        <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 flex-1">{item.title}</h2>
        <p className="text-base font-extrabold mb-0.5" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(item.price)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: GRAD }}>
            {(item.seller_name ?? "?")[0].toUpperCase()}
>>>>>>> 7113605d04dee12a5116a3645ab0d223697c177e
          </div>
          <span className="text-[10px] text-gray-500 truncate">{item.seller_name}</span>
          <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{deals} deals</span>
        </div>
      </div>

<<<<<<< HEAD
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

            <div className="w-full md:w-[55%] bg-gray-50 dark:bg-gray-800 flex flex-col p-6 items-center justify-center relative">
              <div className="w-full flex-1 flex items-center justify-center min-h-[300px]">
                <img
                  src={
                    selectedItem.images?.[activeImageIndex] ||
                    selectedItem.images?.[0] ||
                    "https://placehold.co/600x600/e2e8f0/64748b?text=No+Image"
                  }
                  className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-sm transition-opacity duration-300"
                  alt={selectedItem.title}
                />
              </div>

              {/* Thumbnails row */}
              {selectedItem.images && selectedItem.images.length > 1 && (
                <div className="mt-6 flex gap-3 overflow-x-auto pb-2 w-full justify-center px-4 max-w-full snap-x scrollbar-hide">
                  {selectedItem.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 snap-center rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        activeImageIndex === idx
                          ? "border-blue-500 scale-105 shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        alt={`Thumbnail ${idx + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
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
                  <button
                    type="button"
                    onClick={() => handleToggleSaveListing(selectedItem)}
                    className="w-full cursor-pointer py-3.5 rounded-xl border border-pink-200 dark:border-pink-900/30 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 font-bold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all inline-flex items-center justify-center gap-2 mb-1"
                  >
                    <Heart
                      size={16}
                      fill={savedListingIds.includes(selectedItem.id) ? "currentColor" : "none"}
                    />
                    {savedListingIds.includes(selectedItem.id) ? "Saved to Favorites" : "Save Listing"}
                  </button>
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
=======
      {/* Buttons */}
      <div className="px-3.5 pb-3.5 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition"
          style={{ background: GRAD, border: "none" }}
        >
          View
        </button>
        <button
          onClick={onAddToCart}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          style={{ border: "none" }}
        >
          Add to Cart
        </button>
>>>>>>> 7113605d04dee12a5116a3645ab0d223697c177e
      </div>
    </div>
  );
}

function TiltCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;

    el.style.boxShadow = `
      ${-x * 14}px ${y * 14}px 40px rgba(0,170,255,0.18),
      0 8px 28px rgba(107,48,255,0.12)
    `;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;

    el.style.transform =
      "perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)";

    el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        ...style,
        background: "var(--card)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col w-56 flex-shrink-0" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.8)" }}>
      <div className="animate-pulse" style={{ height: 160, background: "linear-gradient(135deg,rgba(0,170,255,0.08),rgba(107,48,255,0.08))" }} />
      <div className="p-3.5 flex flex-col gap-2">
        {[3/4, 1/2, 1/3].map((w, i) => <div key={i} className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${w*100}%` }} />)}
        <div className="flex gap-2 mt-2">
          <div className="flex-1 h-8 rounded-lg bg-gray-200/70 animate-pulse" />
          <div className="flex-1 h-8 rounded-lg bg-gray-200/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── SellerBadge ──────────────────────────────────────────────
function SellerBadge({ name, verified }: { name: string; verified: boolean }) {
  const deals = SELLER_DEALS[name] ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ background: GRAD }}>
        {name[0].toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800">{name}</span>
          {verified && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: GRAD }}>
              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Verified
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-400">{deals} deals completed</p>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────
function DetailModal({ listing, uid, onClose, onMessage, onAddToCart, saved, onToggleSave }: {
  listing: Listing; uid: string | null; onClose: () => void;
  onMessage: () => void; onAddToCart: () => void; saved: boolean; onToggleSave: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [];
  const c = COND[listing.condition] ?? COND["Used"];
  const isOwn = uid === listing.user_id;

  const markSold = async () => {
    await supabase.from("marketplace_listings").update({ sold: true }).eq("id", listing.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden" style={{ maxHeight: "92vh", overflowY: "auto" }}>
        {/* Image */}
        <div className="relative bg-gray-100" style={{ height: 280 }}>
          {imgs.length > 0 ? (
            <img src={imgs[imgIdx]} alt={listing.title} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "center", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.09),rgba(107,48,255,0.09))" }}>
              <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          {imgs.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className="w-2 h-2 rounded-full transition" style={{ background: i === imgIdx ? "#6B30FF" : "rgba(255,255,255,0.6)", border: "none" }} />)}
              </div>
              <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow text-gray-700 text-lg" style={{ border: "none" }}>&#8249;</button>
              <button onClick={() => setImgIdx(i => Math.min(imgs.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow text-gray-700 text-lg" style={{ border: "none" }}>&#8250;</button>
            </>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-600 hover:text-gray-900" style={{ border: "none" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {listing.verified && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-white" style={{ background: GRAD }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Verified
            </div>
          )}
          {listing.sold && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
              <span className="text-white font-extrabold text-2xl tracking-widest uppercase">Sold</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex-1 leading-snug">{listing.title}</h2>
            <button onClick={onToggleSave} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-red-300 flex-shrink-0 transition" style={{ background: "none" }}>
              <svg className="w-4 h-4" fill={saved ? "#EF4444" : "none"} viewBox="0 0 24 24" stroke={saved ? "#EF4444" : "#9CA3AF"} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
              </svg>
            </button>
          </div>

          <p className="text-2xl font-extrabold mb-3" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {fmt(listing.price)}
          </p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: c.bg, color: c.color }}>{listing.condition}</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 capitalize">{listing.category}</span>
            {(listing.save_count ?? 0) > 0 && <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">{listing.save_count} saved</span>}
          </div>

          {listing.description && <p className="text-sm text-gray-600 leading-relaxed mb-5">{listing.description}</p>}

          <div className="p-3 rounded-xl mb-5" style={{ background: "#F8FAFF" }}>
            <SellerBadge name={listing.seller_name ?? "Unknown"} verified={listing.verified} />
            <p className="text-xs text-gray-400 mt-1 ml-10">
              Listed {new Date(listing.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {isOwn ? (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition" style={{ border: "none" }}>Close</button>
              {!listing.sold && <button onClick={markSold} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90" style={{ background: "linear-gradient(90deg,#EF4444,#F97316)", border: "none" }}>Mark as Sold</button>}
            </div>
          ) : (() => {
              const inCart = JSON.parse(sessionStorage.getItem("verifind_cart") ?? "[]") as {id:string;qty:number}[];
              const cartQty = inCart.find(x => x.id === listing.id)?.qty ?? 0;
              const maxStock = listing.stock ?? 1;
              const atMax = cartQty >= maxStock;
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={onAddToCart}
                      disabled={listing.sold || atMax}
                      className="w-full py-3 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: listing.sold || atMax ? "rgba(0,0,0,0.08)" : GRAD, border: "none", color: listing.sold || atMax ? "#9ca3af" : "#fff" }}
                    >
                      {listing.sold ? "Item Sold" : atMax ? `Max ${maxStock} reached` : "Add to Cart"}
                    </button>
                    {maxStock > 1 && !listing.sold && (
                      <p className="text-center text-[10px]" style={{ color: atMax ? "rgb(185,28,28)" : "rgb(5,150,105)" }}>
                        {atMax ? `${maxStock} of ${maxStock} in cart` : `${cartQty} of ${maxStock} in cart · ${maxStock - cartQty} remaining`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onMessage}
                      disabled={listing.sold}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-40"
                      style={{ border: "none" }}
                    >
                      Message Seller
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                      style={{ border: "1px solid rgba(0,0,0,0.08)", background: "none" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

// ─── MessageThread ────────────────────────────────────────────
function MessageThread({ listingId, listingTitle, recipientId, recipientName, uid, onClose }: {
  listingId: string; listingTitle: string; recipientId: string; recipientName: string; uid: string; onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: asSender }, { data: asRecipient }] = await Promise.all([
      supabase.from("marketplace_messages").select("*").eq("listing_id", listingId).eq("sender_id", uid).order("created_at", { ascending: true }),
      supabase.from("marketplace_messages").select("*").eq("listing_id", listingId).eq("recipient_id", uid).order("created_at", { ascending: true }),
    ]);
    const merged = [...(asSender ?? []), ...(asRecipient ?? [])] as Message[];
    const deduped = Array.from(new Map(merged.map(m => [m.id, m])).values())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(deduped);
    if ((asRecipient ?? []).some((m: any) => !m.read)) {
      await supabase.from("marketplace_messages").update({ read: true }).eq("listing_id", listingId).eq("recipient_id", uid).eq("read", false);
    }
  }, [listingId, uid]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`thread-${listingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_messages", filter: `listing_id=eq.${listingId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, listingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("marketplace_messages").insert({ listing_id: listingId, sender_id: uid, recipient_id: recipientId, body: body.trim() });
    if (!error) { setBody(""); await load(); }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden" style={{ height: 520 }}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">Chat with {recipientName}</p>
            <p className="text-xs text-gray-400 truncate max-w-[220px]">{listingTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center mt-16">
              <p className="text-sm text-gray-400">No messages yet. Say hi!</p>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed" style={mine ? { background: GRAD, color: "#fff", borderBottomRightRadius: 4 } : { background: "#F3F4F6", color: "#1F2937", borderBottomLeftRadius: 4 }}>
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: "#F8FAFF", border: "1px solid rgba(0,0,0,0.08)" }} />
          <button onClick={send} disabled={!body.trim() || sending} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40" style={{ background: GRAD, border: "none" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inbox ────────────────────────────────────────────────────
function Inbox({ uid, onOpenThread, onClose }: { uid: string; onOpenThread: (t: Thread) => void; onClose: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase.from("marketplace_messages").select("id,listing_id,sender_id,recipient_id,body,read,created_at").eq("sender_id", uid).order("created_at", { ascending: false }),
        supabase.from("marketplace_messages").select("id,listing_id,sender_id,recipient_id,body,read,created_at").eq("recipient_id", uid).order("created_at", { ascending: false }),
      ]);
      const allMsgs = [...(sent ?? []), ...(received ?? [])];
      const msgs = Array.from(new Map(allMsgs.map((m: any) => [m.id, m])).values())
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (!msgs || msgs.length === 0) { setLoading(false); return; }
      const listingIds = [...new Set(msgs.map((m: any) => m.listing_id))];
      const otherUserIds = [...new Set(msgs.map((m: any) => m.sender_id === uid ? m.recipient_id : m.sender_id))];
      const { data: listings } = await supabase.from("marketplace_listings").select("id,title").in("id", listingIds);
      const listingMap: Record<string, string> = {};
      (listings ?? []).forEach((l: any) => { listingMap[l.id] = l.title; });
      let userMap: Record<string, string> = {};
      try {
        const { data: profiles } = await supabase.from("profiles").select("id,username").in("id", otherUserIds);
        (profiles ?? []).forEach((p: any) => { userMap[p.id] = p.username ?? p.id.slice(0, 8); });
      } catch {
        otherUserIds.forEach((id: string) => { userMap[id] = id.slice(0, 8); });
      }
      const map = new Map<string, Thread>();
      for (const m of msgs as any[]) {
        const otherId = m.sender_id === uid ? m.recipient_id : m.sender_id;
        const tKey = `${m.listing_id}__${otherId}`;
        if (!map.has(tKey)) {
          map.set(tKey, { listing_id: m.listing_id, other_user_id: otherId, other_username: userMap[otherId] ?? otherId.slice(0, 8), listing_title: listingMap[m.listing_id] ?? "Listing", last_message: m.body, last_at: m.created_at, unread: (!m.read && m.recipient_id === uid) ? 1 : 0 });
        } else if (!m.read && m.recipient_id === uid) {
          map.get(tKey)!.unread++;
        }
      }
      setThreads(Array.from(map.values()));
      setLoading(false);
    })();
  }, [uid]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ maxHeight: "80vh" }}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <p className="font-bold text-gray-900">Messages</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 64px)" }}>
          {loading && <p className="text-center text-sm text-gray-400 py-10">Loading...</p>}
          {!loading && threads.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <p className="text-gray-500 text-sm">No messages yet</p>
            </div>
          )}
          {threads.map((th) => (
            <button key={`${th.listing_id}__${th.other_user_id}`} onClick={() => onOpenThread(th)} className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition text-left" style={{ background: "none", border: "none", borderBottom: "1px solid #f9fafb", cursor: "pointer" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: GRAD }}>{th.other_username[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-semibold text-gray-800">{th.other_username}</p>
                  <p className="text-[10px] text-gray-400">{new Date(th.last_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-gray-500 truncate">{th.listing_title}</p>
                <p className="text-xs text-gray-400 truncate">{th.last_message}</p>
              </div>
              {th.unread > 0 && <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: GRAD }}>{th.unread}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SellForm ─────────────────────────────────────────────────
function SellForm({ uid, username, onDone }: { uid: string; username: string; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "electronics", condition: "Used" as Condition, stock: 1, promo: "none" as "none" | "basic" | "featured" | "premium" });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []).slice(0, 4);
    setFiles(chosen);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.price) { setError("Title and price are required."); return; }
    setSubmitting(true); setError("");
    const urls: string[] = [];
    for (const file of files) {
      const path = `${uid}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("marketplace-images").upload(path, file);
      if (!upErr) { const { data: pub } = supabase.storage.from("marketplace-images").getPublicUrl(path); urls.push(pub.publicUrl); }
    }
    const { error: insErr } = await supabase.from("marketplace_listings").insert({ user_id: uid, title: form.title.trim(), description: form.description.trim() || null, price: parseFloat(form.price), category: form.category, condition: form.condition, images: urls, seller_name: username });
    if (insErr) { setError(insErr.message); setSubmitting(false); return; }
    setSubmitting(false); onDone();
  };

  const fCls = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none";
  const fSt: React.CSSProperties = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.09)" };

  const handlePriceChange = (raw: string) => {
    let v = raw.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    if (parts[1] !== undefined && parts[1].length > 2) v = parts[0] + "." + parts[1].slice(0, 2);
    setForm(f => ({ ...f, price: v }));
  };

  const handlePriceBlur = () => {
    if (!form.price) return;
    const num = parseFloat(form.price);
    if (!isNaN(num)) setForm(f => ({ ...f, price: num.toFixed(2) }));
  };

  return (
  <div id="sell-form" className="relative z-10 max-w-lg mx-auto px-4 py-6">
    <div
      className="
        rounded-3xl p-6 md:p-8
        bg-white/60 dark:bg-neutral-900/60
        backdrop-blur-xl
        border border-white/40 dark:border-white/10
        shadow-lg dark:shadow-black/40
        transition-colors
      "
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        List an Item
      </h2>

      <div className="flex flex-col gap-4">

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Title *
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Apple MacBook Pro 16 inch M3"
            className={fCls}
            style={{
              ...fSt,
              background: "rgba(255,255,255,0.6)",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm(f => ({ ...f, description: e.target.value }))
            }
            placeholder="Condition details, what is included, reason for selling..."
            className={`${fCls} resize-none`}
            style={{
              ...fSt,
              background: "rgba(255,255,255,0.6)",
            }}
          />
        </div>

        {/* Price + Condition */}
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Price (USD) *
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                $
              </span>

              <input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                onBlur={handlePriceBlur}
                placeholder="0.00"
                className={fCls}
                style={{
                  ...fSt,
                  paddingLeft: "1.75rem",
                  background: "rgba(255,255,255,0.6)",
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Condition
            </label>

            <select
              value={form.condition}
              onChange={(e) =>
                setForm(f => ({
                  ...f,
                  condition: e.target.value as Condition,
                }))
              }
              className={fCls}
              style={{
                ...fSt,
                background: "rgba(255,255,255,0.6)",
              }}
            >
              <option value="New">New</option>
              <option value="Used">Used</option>
            </select>
          </div>
        </div>

        {/* Category + Stock */}
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Category
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                setForm(f => ({ ...f, category: e.target.value }))
              }
              className={fCls}
              style={{
                ...fSt,
                background: "rgba(255,255,255,0.6)",
              }}
            >
              {CATEGORIES.filter(c => c.id !== "all").map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Quantity in stock
            </label>

            <div className="flex items-center gap-0" style={{ height: "38px" }}>

              <button
                type="button"
                onClick={() =>
                  setForm(f => ({ ...f, stock: Math.max(1, f.stock - 1) }))
                }
                className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-white dark:hover:bg-neutral-800 transition rounded-l-xl font-bold text-lg"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.09)",
                  borderRight: "none",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>

              <div
                className="flex-1 h-full flex flex-col items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  borderTop: "1px solid rgba(0,0,0,0.09)",
                  borderBottom: "1px solid rgba(0,0,0,0.09)",
                }}
              >
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {form.stock}
                </span>
                <span className="text-[9px] text-gray-400">
                  {form.stock === 1 ? "unit" : "units"}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm(f => ({ ...f, stock: Math.min(10, f.stock + 1) }))
                }
                className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-white dark:hover:bg-neutral-800 transition rounded-r-xl"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.09)",
                  borderLeft: "none",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 mt-1">
              How many are available (max 10)
            </p>
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Photos (up to 4)
          </label>

          <label className="
            flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium
            text-gray-500 cursor-pointer transition
            bg-white/40 dark:bg-neutral-800/40
            border-2 border-dashed border-sky-300 dark:border-sky-700
            hover:bg-white/70 dark:hover:bg-neutral-800/60
          ">
            Upload photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          </label>

          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {previews.map((p, i) => (
                <img key={i} src={p} className="w-16 h-16 rounded-lg" style={{ objectFit: "cover" }} />
              ))}
            </div>
          )}
        </div>

        {/* ERROR (UNCHANGED LOGIC, SAFE) */}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onDone}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: GRAD, border: "none" }}
          >
            {submitting ? "Listing..." : "List Item"}
          </button>
        </div>

      </div>
    </div>
  </div>
);
}

// ─── Main ─────────────────────────────────────────────────────
export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [uid, setUid]             = useState<string | null>(null);
  const [username, setUsername]   = useState("");
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError]     = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState(searchParams.get("category") ?? "all");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState<SortKey>("newest");
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSell, setShowSell]   = useState(searchParams.get("sell") === "1");
  const [showAll, setShowAll]     = useState(false);
  const PREVIEW_COUNT = 8;

  const [detailItem, setDetailItem]       = useState<Listing | null>(null);
  const [messageTarget, setMessageTarget] = useState<Listing | null>(null);
  const [activeThread, setActiveThread]   = useState<Thread | null>(null);
  const [showInbox, setShowInbox]         = useState(false);

  useEffect(() => {
    const cat  = searchParams.get("category");
    const sell = searchParams.get("sell");
    if (cat)          { setActiveCat(cat); setShowSell(false); setShowAll(false); }
    if (sell === "1") { setShowSell(true); }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setUid(u.id);
        setUsername(u.user_metadata?.username ?? u.email ?? "User");
        loadSaves(u.id);
        loadUnread(u.id);
      }
    });
    loadDbListings();
  }, []);

  useEffect(() => { loadDbListings(); }, [activeCat]);

  const loadDbListings = async () => {
    setDbLoading(true); setDbError(null);
    try {
      let q = supabase.from("marketplace_listings").select("id,user_id,title,description,price,category,condition,images,seller_name,verified,sold,created_at").eq("sold", false).order("created_at", { ascending: false });
      if (activeCat !== "all") q = q.eq("category", activeCat);
      const { data, error } = await q;
      if (error) throw error;
      const normalised = (data as Listing[]).map(l => ({ ...l, condition: (["New", "Used"].includes(l.condition) ? l.condition : "Used") as Condition, stock: (l as any).stock ?? 1 }));
      setDbListings(normalised ?? []);
    } catch (e: unknown) {
      setDbError(e instanceof Error ? e.message : "Failed to load");
    }
    setDbLoading(false);
  };

  const loadSaves = async (userId: string) => {
    const { data } = await supabase.from("marketplace_saves").select("listing_id").eq("user_id", userId);
    const dbIds: string[] = data ? data.map((r: { listing_id: string }) => r.listing_id) : [];
    const raw = localStorage.getItem("verifind_saved_mock");
    const localIds: string[] = raw ? JSON.parse(raw) : [];
    setSavedIds(new Set([...dbIds, ...localIds]));
  };

  const loadUnread = async (userId: string) => {
    const { count } = await supabase.from("marketplace_messages").select("id", { count: "exact", head: true }).eq("recipient_id", userId).eq("read", false);
    setUnreadCount(count ?? 0);
  };

  useEffect(() => {
    if (!uid) return;
    const ch = supabase.channel(`inbox-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_messages", filter: `recipient_id=eq.${uid}` }, () => loadUnread(uid))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  useEffect(() => {
    const ch = supabase.channel("marketplace-new")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_listings" }, (payload) => setDbListings(prev => [payload.new as Listing, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleSave = useCallback(async (id: string) => {
    if (!uid) { navigate("/login"); return; }
    const wasSaved = savedIds.has(id);
    const willSave = !wasSaved;
    setSavedIds(prev => { const n = new Set(prev); willSave ? n.add(id) : n.delete(id); return n; });
    if (isMock(id)) {
      const raw = localStorage.getItem("verifind_saved_mock");
      const stored: string[] = raw ? JSON.parse(raw) : [];
      const updated = willSave ? [...new Set([...stored, id])] : stored.filter((x: string) => x !== id);
      localStorage.setItem("verifind_saved_mock", JSON.stringify(updated));
    } else {
      if (wasSaved) { await supabase.from("marketplace_saves").delete().eq("user_id", uid).eq("listing_id", id); }
      else { await supabase.from("marketplace_saves").insert({ user_id: uid, listing_id: id }); }
    }
  }, [uid, savedIds, navigate]);

  const allListings: Listing[] = [...MOCK_LISTINGS, ...dbListings];

  const filtered = allListings
    .filter(l => activeCat === "all" || l.category === activeCat)
    .filter(l => (l.title ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-asc")  return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "saves")      return (b.save_count ?? 0) - (a.save_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const displayed = showAll || search ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const hasMore   = !showAll && !search && filtered.length > PREVIEW_COUNT;

  return (
    <>
      {detailItem && (
        <DetailModal listing={detailItem} uid={uid} onClose={() => setDetailItem(null)} onMessage={() => { setMessageTarget(detailItem); setDetailItem(null); }} onAddToCart={() => { navigate("/cart", { state: { item: detailItem } }); setDetailItem(null); }} saved={savedIds.has(detailItem.id)} onToggleSave={() => toggleSave(detailItem.id)} />
      )}
      {messageTarget && uid && !isMock(messageTarget.id) && (
        <MessageThread listingId={messageTarget.id} listingTitle={messageTarget.title} recipientId={messageTarget.user_id} recipientName={messageTarget.seller_name ?? "Seller"} uid={uid} onClose={() => setMessageTarget(null)} />
      )}
      {showInbox && uid && (
        <Inbox uid={uid} onOpenThread={(th) => { setShowInbox(false); setActiveThread(th); }} onClose={() => setShowInbox(false)} />
      )}
      {activeThread && uid && (
        <MessageThread listingId={activeThread.listing_id} listingTitle={activeThread.listing_title} recipientId={activeThread.other_user_id} recipientName={activeThread.other_username} uid={uid} onClose={() => setActiveThread(null)} />
      )}

      <div className="min-h-screen flex flex-col" style={{ }}>
        {/* BG orbs */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position:"absolute", top:"-10%", left:"-5%", width:"55vw", height:"55vw", maxWidth:700, maxHeight:700, background:"radial-gradient(circle,rgba(0,170,255,0.16) 0%,transparent 70%)", borderRadius:"50%", filter:"blur(50px)" }} />
          <div style={{ position:"absolute", top:"25%", right:"-10%", width:"50vw", height:"50vw", maxWidth:600, maxHeight:600, background:"radial-gradient(circle,rgba(107,48,255,0.13) 0%,transparent 70%)", borderRadius:"50%", filter:"blur(50px)" }} />
        </div>

        <div className="h-20" />

        {/* Hero */}
        <div className="relative z-10 mx-4 md:mx-8 rounded-3xl mb-6" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.13),rgba(107,48,255,0.16))", border: "1px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div className="px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-1" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Marketplace</h1>
              <p className="text-sm text-gray-500">Buy and sell verified products with other Verifind users.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {uid && (
                <button onClick={() => setShowInbox(true)} className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/70 text-gray-700 hover:bg-white transition" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Messages
                  {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: GRAD }}>{unreadCount}</span>}
                </button>
              )}
              <button onClick={() => { if (!uid) { navigate("/login"); return; } setShowSell(v => !v); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 shadow-lg transition" style={{ background: GRAD, border: "none" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                {showSell ? "Back to Browse" : "List an Item"}
              </button>
            </div>
          </div>
        </div>

        {showSell && uid && <SellForm uid={uid} username={username} onDone={() => { setShowSell(false); loadDbListings(); }} />}

        {!showSell && (
          <>
            {/* Controls */}
            <div className="relative z-10 px-4 md:px-8 mb-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px] max-w-sm relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 focus:outline-none" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.95)" }}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="saves">Most saved</option>
              </select>
              <span className="text-xs text-gray-400">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Category pills */}
            <div className="relative z-10 px-4 md:px-8 mb-6 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => { setActiveCat(cat.id); setShowAll(false); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200" style={activeCat === cat.id ? { background: GRAD, color: "#fff", border: "none", boxShadow: "0 2px 10px rgba(0,170,255,0.3)" } : { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.95)", color: "#4B5563" }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="relative z-10 flex-1 px-4 md:px-8 pb-8">
              {dbLoading && <div className="flex flex-wrap gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</div>}
              {dbError && (
                <div className="mb-6 px-4 py-3 rounded-xl text-sm text-amber-700 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span>Could not load live listings. ({dbError})</span>
                  <button onClick={loadDbListings} className="ml-auto text-xs font-semibold underline" style={{ background: "none", border: "none", cursor: "pointer" }}>Retry</button>
                </div>
              )}
              {filtered.length === 0 && !dbLoading && (
                <div className="flex flex-col items-center py-20 text-center">
                  <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <p className="text-gray-700 font-semibold text-lg mb-1">No listings found</p>
                  <p className="text-gray-400 text-sm">Try a different category or search term.</p>
                </div>
              )}

              {/* Promoted listings */}
              <div className="flex flex-wrap gap-5 mb-5">
                {PROMOTED_LISTINGS.map(item => (
                  <PromotedCard key={item.id} item={item} saved={savedIds.has(item.id)} onView={() => setDetailItem(item)} onToggleSave={(e) => { e.stopPropagation(); toggleSave(item.id); }} onAddToCart={(e) => { e.stopPropagation(); navigate("/cart", { state: { item } }); }} />
                ))}
              </div>

              <div className="flex flex-wrap gap-5">
                {displayed.map((item) => {
                  const c     = COND[item.condition] ?? COND["Used"];
                  const saved = savedIds.has(item.id);
                  const imgs  = Array.isArray(item.images) ? item.images : [];
                  const deals = SELLER_DEALS[item.seller_name ?? ""] ?? 0;

                  return (
                    <TiltCard key={item.id} className="rounded-2xl overflow-hidden flex flex-col w-56 cursor-pointer" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                      <div className="relative overflow-hidden" style={{ height: 156 }} onClick={() => setDetailItem(item)}>
                        {imgs.length > 0 ? (
                          <img src={imgs[0]} alt={item.title} className="w-full h-full transition-transform duration-300 hover:scale-105" style={{ objectFit: "cover", objectPosition: "center", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,170,255,0.07),rgba(107,48,255,0.07))" }}>
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        {item.verified && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: GRAD }}>
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Verified
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition hover:scale-110" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer" }}>
                          <svg className="w-3.5 h-3.5" fill={saved ? "#EF4444" : "none"} viewBox="0 0 24 24" stroke={saved ? "#EF4444" : "#9CA3AF"} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-3.5 flex flex-col flex-1" onClick={() => setDetailItem(item)}>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 self-start" style={{ background: c.bg, color: c.color }}>{item.condition}</span>
                        <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 flex-1">{item.title}</h2>
                        <p className="text-base font-extrabold mb-0.5" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{fmt(item.price)}</p>
                        {(item.stock ?? 1) > 1 && <span className="text-[10px] font-semibold mb-0.5" style={{ color: "rgb(5,150,105)" }}>{item.stock} available</span>}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: GRAD }}>{(item.seller_name ?? "?")[0].toUpperCase()}</div>
                          <span className="text-[10px] text-gray-500 truncate">{item.seller_name}</span>
                          <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">{deals} deals</span>
                        </div>
                      </div>

                      <div className="px-3.5 pb-3.5 flex gap-2">
                        <button onClick={() => setDetailItem(item)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition" style={{ background: GRAD, border: "none" }}>View</button>
                        {item.user_id === uid ? (
                          <button onClick={() => setDetailItem(item)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition" style={{ background: "rgba(107,48,255,0.07)", color: "#6B30FF", border: "none" }}>Your listing</button>
                        ) : (() => {
                          const inCart = JSON.parse(sessionStorage.getItem("verifind_cart") ?? "[]") as {id:string;qty:number}[];
                          const cartQty = inCart.find(x => x.id === item.id)?.qty ?? 0;
                          const atMax   = cartQty >= (item.stock ?? 1);
                          return (
                            <button onClick={(e) => { e.stopPropagation(); if (!atMax) navigate("/cart", { state: { item } }); }} disabled={atMax} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition" style={atMax ? { background: "rgba(239,68,68,0.08)", color: "rgb(185,28,28)", border: "none", cursor: "not-allowed" } : { background: "rgba(0,0,0,0.06)", color: "#374151", border: "none" }}>
                              {atMax ? `Max ${item.stock ?? 1}` : "Add to Cart"}
                            </button>
                          );
                        })()}
                      </div>
                    </TiltCard>
                  );
                })}
              </div>

              {hasMore && (
                <div className="w-full flex justify-center mt-6">
                  <button onClick={() => setShowAll(true)} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 shadow-lg transition" style={{ background: GRAD, border: "none" }}>
                    See All {filtered.length} Listings
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              )}
              {showAll && !search && (
                <div className="w-full flex justify-center mt-6">
                  <button onClick={() => { setShowAll(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-white transition" style={{ background: "rgba(255,255,255,0.75)" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    Show Less
                  </button>
                </div>
              )}
            </div>
          </>
        )}

            {/* Footer */}
<div className="relative z-10 mx-4 md:mx-8 mb-4">
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

    {/* Discord */}
    <a
      href=""
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-5 py-4 rounded-2xl group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(88,101,242,0.18)",
        boxShadow: "0 4px 20px rgba(88,101,242,0.06)",
        textDecoration: "none"
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(88,101,242,0.10)" }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515l-.21.42a18.27 18.27 0 00-5.486 0l-.21-.42A19.79 19.79 0 003.68 4.37C1.4 7.24.6 10.05.9 12.83c1.6 1.2 3.15 1.92 4.66 2.4.36-.5.68-1.03.95-1.59-.52-.2-1.02-.45-1.49-.75.12-.09.24-.18.35-.27 2.87 1.3 6 1.3 8.84 0 .11.09.23.18.35.27-.47.3-.97.55-1.49.75.27.56.59 1.09.95 1.59 1.51-.48 3.06-1.2 4.66-2.4.35-3.12-.58-5.9-2.3-8.46zM9 12.2c-.72 0-1.3-.66-1.3-1.47 0-.81.58-1.47 1.3-1.47s1.3.66 1.3 1.47c0 .81-.58 1.47-1.3 1.47zm6 0c-.72 0-1.3-.66-1.3-1.47 0-.81.58-1.47 1.3-1.47s1.3.66 1.3 1.47c0 .81-.58 1.47-1.3 1.47z"/>
</svg>
      </div>

      <div className="flex-1 min-w-0">
        <p style={{ color: "var(--text)" }} className="text-sm font-bold">
          Join our Discord
        </p>
        <p style={{ color: "var(--muted)" }} className="text-xs">
          Chat with the community
        </p>
      </div>

      <svg
        className="w-4 h-4 flex-shrink-0"
        style={{ color: "var(--muted)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>

    {/* Instagram */}
    <a
      href=""
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-5 py-4 rounded-2xl group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(225,48,108,0.15)",
        boxShadow: "0 4px 20px rgba(225,48,108,0.05)",
        textDecoration: "none"
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(225,48,108,0.08)" }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2"/>
          <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2"/>
          <circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p style={{ color: "var(--text)" }} className="text-sm font-bold">
          Follow on Instagram
        </p>
        <p style={{ color: "var(--muted)" }} className="text-xs">
          Updates and new drops
        </p>
      </div>

      <svg
        className="w-4 h-4 flex-shrink-0"
        style={{ color: "var(--muted)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>

    {/* Start Selling */}
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl"
      style={{
        background: "var(--card)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(0,170,255,0.15)",
        boxShadow: "0 4px 20px rgba(0,170,255,0.06)"
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,170,255,0.12), rgba(107,48,255,0.12))"
        }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="url(#sell-grad)"
          strokeWidth={2}
        >
          <defs>
            <linearGradient id="sell-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00AAFF" />
              <stop offset="100%" stopColor="#6B30FF" />
            </linearGradient>
          </defs>

          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p style={{ color: "var(--text)" }} className="text-sm font-bold">
          Start selling
        </p>
        <p style={{ color: "var(--muted)" }} className="text-xs">
          List for free, get verified
        </p>
      </div>

      <button
        onClick={() => {
          if (!uid) {
            navigate("/login");
            return;
          }
          setShowSell(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition flex-shrink-0"
        style={{ background: GRAD, border: "none" }}
      >
        List Item
      </button>
    </div>

  </div>
</div>

        <p className="relative z-10 text-xs text-gray-400 text-center pb-6">&copy; {new Date().getFullYear()} Verifind</p>
      </div>
    </>
  );
}

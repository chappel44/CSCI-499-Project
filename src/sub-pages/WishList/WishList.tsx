import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWishlist } from "../../Contexts/WishListContext";
import ApplyGradientOrbs from "../SharedComponents/ApplyGradientOrbs";
import { SearchOtherWishlist } from "./wish-list-components/SearchOtherWishlists";
import GreetUser from "../SharedComponents/GreetUser";
import FAQSection from "./wish-list-components/FAQSection";
import DisplayBanner from "./wish-list-components/DisplayBanner";
import SignUpForDeals from "./wish-list-components/SignUpForDeals";
import sortWishlist from "./wish-list-hooks/sortWishlist";
import DisplayWishlist from "./wish-list-components/DisplayWishlist";
import DisplayWishlistActions from "./wish-list-components/DisplayWishlistActions";
import { useSearchOtherWishlist } from "./wishlist-custom-hooks/searchOtherWishlist";

function WishList() {
  const { items, searchQuery, sortBy, filterDropOnly, setOtherUsername } =
    useWishlist();
  const { searchOtherWishlist } = useSearchOtherWishlist();
  const [searchParams] = useSearchParams();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    const sharedUsername = searchParams.get("user")?.trim();
    if (!sharedUsername) return;

    setOtherUsername(sharedUsername);
    searchOtherWishlist(sharedUsername);
  }, [searchOtherWishlist, searchParams, setOtherUsername]);

  // sort + filter logic applied on top of search filter
  const filteredItems = sortWishlist(
    items,
    filterDropOnly,
    sortBy,
    searchQuery
  );

  return (
    <div
      className="wishlist-page min-h-screen flex flex-col text-gray-900 overflow-x-hidden"
      style={{ background: "#f0f4ff" }}
    >
      {/* Mesh gradient background orbs — same as Search & WhatIsVerifind for consistency */}
      <ApplyGradientOrbs />

      {/* Sticky header — frosted glass */}
      <div
        className="wishlist-sticky-header sticky top-0 z-30 px-6 py-6 flex justify-center items-center border-b"
        style={{
          background: "rgba(240,244,255,0.7)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(0,170,255,0.12)",
        }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
          {/* needed to filter the header and my banner logo */}
        </h1>
      </div>

      {/* Banner */}
      <DisplayBanner />

      {/* Welcome message */}
      <GreetUser visible={visible} />

      <DisplayWishlistActions visible={visible} />

      {/* Wishlist Items — frosted glass cards */}
      <DisplayWishlist filteredItems={filteredItems} visible={visible} />

      <SearchOtherWishlist visible={visible} />

      {/* Bottom sections — frosted glass panels */}
      <div
        className="wishlist-bottom relative z-10 w-full px-6 mt-6 flex flex-col items-center gap-4 pb-8"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease 0.4s",
        }}
      >
        {/* Sign Up for More Deals */}
        <SignUpForDeals />

        {/* FAQ */}
        <FAQSection />

        <p className="text-xs text-gray-400 mt-2">
          &copy; {new Date().getFullYear()} Verifind
        </p>
      </div>
    </div>
  );
}

export default WishList;

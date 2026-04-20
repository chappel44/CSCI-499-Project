import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Search from "./sub-pages/Search/Search";
import WishList from "./sub-pages/WishList/WishList";
import WhatIsVerifind from "./sub-pages/WhatIsVerifind";
import Login from "./sub-pages/Login";
import SignUp from "./sub-pages/SignUp";
import Settings from "./sub-pages/Settings";
import Marketplace from "./sub-pages/Marketplace";
import MarketplaceInbox from "./sub-pages/MarketplaceInbox";
import ForgotPassword from "./sub-pages/ForgotPassword";
import ResetPassword from "./sub-pages/ResetPassword";
import Layout from "./Contexts/Layout";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));

    const hasRecoveryCode = !!searchParams.get("code");
    const hasRecoveryType =
      searchParams.get("type") === "recovery" ||
      hashParams.get("type") === "recovery";
    const hasRecoveryError =
      searchParams.get("error_code") === "otp_expired" ||
      hashParams.get("error_code") === "otp_expired" ||
      hashParams.get("error") === "access_denied";
    const hasRecoveryTokens =
      !!hashParams.get("access_token") ||
      !!hashParams.get("refresh_token");

    const shouldGoToReset =
      (hasRecoveryCode || hasRecoveryType || hasRecoveryError || hasRecoveryTokens) &&
      location.pathname !== "/reset-password";

    if (shouldGoToReset) {
      navigate(
        {
          pathname: "/reset-password",
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return (
    <>
      <Header />
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wish-list" element={<WishList />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/inbox" element={<MarketplaceInbox />} />
          <Route path="/marketplace/inbox/:conversationId" element={<MarketplaceInbox />} />
          <Route path="/what-is-verifind" element={<WhatIsVerifind />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Settings />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;

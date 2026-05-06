import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Search from "./sub-pages/Search/Search";
import WishList from "./sub-pages/WishList/WishList";
import WhatIsVerifind from "./sub-pages/WhatIsVerifind";
import Login from "./sub-pages/Login";
import SignUp from "./sub-pages/SignUp";
import Settings from "./sub-pages/Settings";
import ForgotPassword from "./sub-pages/ForgotPassword";
import ResetPassword from "./sub-pages/ResetPassword";
import Marketplace from "./sub-pages/Marketplace";
import MarketplaceInbox from "./sub-pages/MarketplaceInbox";
import BlockedUsers from "./sub-pages/BlockedUsers";
import Layout from "./Contexts/Layout";
import PrivacyPolicy from "./sub-pages/PrivacyPolicy";

function App() {
  return (
    <>
      <Header />
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wish-list" element={<WishList />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/messages" element={<MarketplaceInbox />} />
          <Route
            path="/messages/:conversationId"
            element={<MarketplaceInbox />}
          />
          <Route path="/marketplace/inbox" element={<MarketplaceInbox />} />
          <Route
            path="/marketplace/inbox/:conversationId"
            element={<MarketplaceInbox />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/what-is-verifind" element={<WhatIsVerifind />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Settings />} />
          <Route path="/profile/username" element={<Settings />} />
          <Route path="/profile/security" element={<Settings />} />
          <Route path="/profile/appearance" element={<Settings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/blocked-users" element={<BlockedUsers />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;

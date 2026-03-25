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
import Layout from "./Contexts/Layout";

function App() {
  return (
    <>
      <Header />
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wish-list" element={<WishList />} />
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

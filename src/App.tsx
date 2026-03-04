import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Search from "./sub-pages/Search";
import WishList from "./sub-pages/WishList";
import WhatIsVerifind from "./sub-pages/WhatIsVerifind";
import Login from "./sub-pages/Login";
import SignUp from "./sub-pages/SignUp";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/search" element={<Search />} />
        <Route path="/wish-list" element={<WishList />} />
        <Route path="/what-is-verifind" element={<WhatIsVerifind />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
     </Routes>
    </>
  );
}

export default App;

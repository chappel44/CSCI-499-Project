import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Search from "./sub-pages/Search";
import WishList from "./sub-pages/WishList";
import WhatIsVerifind from "./sub-pages/WhatIsVerifind";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/search" element={<Search />} />
        <Route path="/wish-list" element={<WishList />} />
        <Route path="/what-is-verifind" element={<WhatIsVerifind />} />
      </Routes>
    </>
  );
}

export default App;

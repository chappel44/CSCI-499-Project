import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Search from "./sub-pages/Search";
import WishList from "./sub-pages/WishList";
import WhatIsVerifind from "./sub-pages/WhatIsVerifind";
import Login from "./sub-pages/Login";
import SignUp from "./sub-pages/SignUp";
import Settings from "./sub-pages/Settings";
import Marketplace from "./sub-pages/Marketplace";
import { SearchProvider } from "./Contexts/SearchContext";

function App() {
return (
<>
<Header />
<SearchProvider>
<Routes>
<Route path="/" element={<Search />} />
<Route path="/search" element={<Search />} />
<Route path="/wish-list" element={<WishList />} />
<Route path="/what-is-verifind" element={<WhatIsVerifind />} />
<Route path="/marketplace" element={<Marketplace />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<SignUp />} />
<Route path="/settings" element={<Settings />} />
</Routes>
</SearchProvider>
</>
  );
}

export default App;

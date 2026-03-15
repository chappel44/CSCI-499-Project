import { SearchProvider } from "./SearchContext";
import { UserProvider } from "./UserContext";
import { WishlistProvider } from "./WishListContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <UserProvider>
      <SearchProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </SearchProvider>
    </UserProvider>
  );
}

import { SearchProvider } from "./SearchContext";
import { ThemeProvider } from "./ThemeContext";
import { UserProvider } from "./UserContext";
import { WishlistProvider } from "./WishListContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <UserProvider>
        <SearchProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </SearchProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

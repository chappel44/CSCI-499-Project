import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../sub-pages/Search/search-structures/SearchStructure";
import { supabase } from "../supabase-client";
import { useUser } from "./UserContext";

export const SearchContext = createContext<MyContextType | null>(null);

type MyProviderProps = {
  children: ReactNode;
};

export type SortByType =
  | "none"
  | "price-asc"
  | "price-desc"
  | "rating-asc"
  | "rating-desc"
  | "reviews-desc"
  | "title-asc"
  | "title-desc"
  | "discount-desc";

type MyContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  openPage: number;
  setOpenPage: React.Dispatch<React.SetStateAction<number>>;
  endPage: number;
  setEndPage: React.Dispatch<React.SetStateAction<number>>;
  keyword: string;
  setKeyword: React.Dispatch<React.SetStateAction<string>>;
  addedIds: Set<string>;
  setAddedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<SortByType>>;
  minPrice: string;
  setMinPrice: React.Dispatch<React.SetStateAction<string>>;
  maxPrice: string;
  setMaxPrice: React.Dispatch<React.SetStateAction<string>>;
};

export function SearchProvider({ children }: MyProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [openPage, setOpenPage] = useState(-1);
  const [endPage, setEndPage] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortByType>("none");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { userId } = useUser();

  const fetchAddedWishlist = async (userId: string) => {
    const { data, error } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId);

    if (error) {
      console.error(error.message);
      return;
    }

    if (data) {
      setAddedIds(new Set(data.map((item) => item.product_id)));
    }
  };

  // call this once on mount or when userId changes
  useEffect(() => {
    if (userId) fetchAddedWishlist(userId);
  }, [userId]);

  return (
    <SearchContext.Provider
      value={{
        products,
        setProducts,
        openPage,
        setOpenPage,
        endPage,
        setEndPage,
        keyword,
        setKeyword,
        addedIds,
        setAddedIds,
        sortBy,
        setSortBy,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

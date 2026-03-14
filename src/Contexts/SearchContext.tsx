import { createContext, useState } from "react";
import type { ReactNode } from "react";

export type Product = {
  product_id?: string;
  title: string;
  link: string;
  thumbnail?: string;
  price?: string;
  old_price?: string;
  extracted_price?: number;
  rating?: number | undefined;
};

export const SearchContext = createContext<MyContextType | null>(null);

type MyProviderProps = {
  children: ReactNode;
};

type MyContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  openPage: number;
  setOpenPage: React.Dispatch<React.SetStateAction<number>>;
  endPage: number;
  setEndPage: React.Dispatch<React.SetStateAction<number>>;
  keyword: string;
  setKeyword: React.Dispatch<React.SetStateAction<string>>;
};

export function SearchProvider({ children }: MyProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [openPage, setOpenPage] = useState(-1);
  const [endPage, setEndPage] = useState(10);
  const [keyword, setKeyword] = useState("");

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
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

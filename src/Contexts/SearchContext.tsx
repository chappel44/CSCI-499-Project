import { createContext, useState } from "react";
import type { ReactNode } from "react";

export type Product = {
  product_id?: string; 
  title: string;
  link: string;
  thumbnail?: string;
  price?: string;
  old_price?: string;
  prices?: { symbol: string; value: number }[];
  extracted_price?: number;
  asin?: string;
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
};

export function SearchProvider({ children }: MyProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [openPage, setOpenPage] = useState(0);
  const [endPage, setEndPage] = useState(10);

  return (
    <SearchContext.Provider
      value={{
        products,
        setProducts,
        openPage,
        setOpenPage,
        endPage,
        setEndPage,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

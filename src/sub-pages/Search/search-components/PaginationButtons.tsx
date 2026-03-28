import { useSearchContext } from "../../../Contexts/useSearchContext";

interface PaginationButtonsProps {
  itemsPerPage: number;
  totalPages: number;
}

export default function PaginationButtons({
  itemsPerPage,
  totalPages,
}: PaginationButtonsProps) {
  const { openPage, setOpenPage, products } = useSearchContext();

  return (
    <>
      {products.length > itemsPerPage && (
        <div className="flex flex-wrap justify-center gap-2 mt-8 mb-8 md:mb-0">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setOpenPage(index)}
              className="search-page-button w-9 h-9 rounded-xl text-sm font-semibold transition cursor-pointer"
              style={
                openPage === index
                  ? {
                      background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(0,170,255,0.3)",
                      border: "1px solid transparent",
                    }
                  : {
                      background: "rgba(255,255,255,0.65)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.85)",
                      color: "#4B5563",
                    }
              }
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

import { useWishlist } from "../../../Contexts/WishListContext";

export default function WatchlistSummary({ visible }: { visible: boolean }) {
  const { items, watchMeta } = useWishlist();

  const watchedCount = items.length;
  const readyToBuyCount = items.filter(
    (item) => watchMeta[item.id]?.status === "ready-to-buy"
  ).length;
  const highPriorityCount = items.filter(
    (item) => watchMeta[item.id]?.priority === "high"
  ).length;
  const notedCount = items.filter((item) => watchMeta[item.id]?.note?.trim()).length;

  const summaryCards = [
    { label: "Watching", value: watchedCount },
    { label: "Ready To Buy", value: readyToBuyCount },
    { label: "High Priority", value: highPriorityCount },
    { label: "Notes Added", value: notedCount },
  ];

  return (
    <div
      className="relative z-10 w-full px-6 mt-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease 0.18s, transform 0.5s ease 0.18s",
      }}
    >
      <div className="mx-auto max-w-5xl grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="wishlist-watch-summary rounded-2xl border border-white/75 px-5 py-4"
            style={{
              background: "rgba(255,255,255,0.60)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-black text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

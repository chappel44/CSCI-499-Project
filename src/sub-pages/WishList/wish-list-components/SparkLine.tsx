import type { PricePoint } from "../wish-list-structures/wishListStructs";

export function Sparkline({ points }: { points: PricePoint[] }) {
  if (!points || points.length < 2) {
    return <p className="text-xs text-gray-400 italic">No history yet</p>;
  }

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 140;
  const height = 36;
  const pad = 4;

  const coords = prices.map((price, i) => {
    const x = pad + (i / (prices.length - 1)) * (width - pad * 2);
    const y = height - pad - ((price - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");
  const lastPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const trending = lastPrice <= firstPrice ? "#22c55e" : "#ef4444"; // green if price went down, red if up

  return (
    <div className="mt-1 mb-1">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <polyline
          points={polyline}
          fill="none"
          stroke={trending}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* dot on latest price */}
        <circle
          cx={coords[coords.length - 1].split(",")[0]}
          cy={coords[coords.length - 1].split(",")[1]}
          r="2.5"
          fill={trending}
        />
      </svg>
      <p className="text-xs text-gray-400">{points.length} price points</p>
    </div>
  );
}

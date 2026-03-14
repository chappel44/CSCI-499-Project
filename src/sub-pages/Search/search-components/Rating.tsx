import { Star } from "lucide-react";

interface StarRatingProps {
  rating?: number; // 0-5
  size?: number; // px
}

export default function StarRating({ rating = 0, size = 20 }: StarRatingProps) {
  const stars = [];

  for (let i = 0; i < 5; i++) {
    // How much of this star is filled (0–100%)
    const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100;

    stars.push(
      <span key={i} className="relative" style={{ width: size, height: size }}>
        {/* Empty star background */}
        <Star className="absolute w-full h-full text-gray-300 fill-current" />

        {/* Colored fill overlay */}
        <Star
          className="absolute w-full h-full text-yellow-400 fill-current"
          style={{
            width: `${fillPercent}%`,
            overflow: "hidden",
            clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
          }}
        />
      </span>
    );
  }

  return <div className="flex items-center gap-1">{stars}</div>;
}

import GreetUser from "../../SharedComponents/GreetUser";
import ComingSoonCards from "./ComingSoonCards";

interface SearchHeadingProps {
  visible: boolean;
}

export default function SearchHeading({ visible }: SearchHeadingProps) {
  return (
    <div
      className="flex flex-col items-center text-center mb-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <GreetUser visible={visible} />

      <h1
        className="text-4xl font-black mb-2 leading-tight"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #0088DD 55%, #6B30FF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Verifind Product Search
      </h1>
      <p className="text-gray-400 text-sm font-medium">
        Find and verify products instantly.
      </p>

      {/* App Store + Extension buttons — coming soon placeholders */}
      <ComingSoonCards />
    </div>
  );
}

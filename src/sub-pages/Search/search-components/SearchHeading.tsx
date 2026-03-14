import { useUser } from "../../../Contexts/UserContext";
import ComingSoonCards from "./ComingSoonCards";

interface SearchHeadingProps {
  visible: boolean;
}

export default function SearchHeading({ visible }: SearchHeadingProps) {
  const { username } = useUser();
  return (
    <div
      className="flex flex-col items-center text-center mb-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {username && (
        <div
          className="mb-4 px-4 py-1.5 rounded-full text-sm backdrop-blur-md border"
          style={{
            background: "rgba(255,255,255,0.55)",
            borderColor: "rgba(0,170,255,0.2)",
          }}
        >
          Welcome back,{" "}
          <span
            className="font-semibold"
            style={{
              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {username}
          </span>{" "}
          👋
        </div>
      )}

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

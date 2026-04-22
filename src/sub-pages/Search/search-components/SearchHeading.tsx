import GreetUser from "../../SharedComponents/GreetUser";
import ComingSoonCards from "./ComingSoonCards";
import { motion } from "framer-motion";

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

      <motion.h1
        className="search-title text-4xl font-black mb-2 leading-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Verifind Product Search
      </motion.h1>
      <p className="search-subtitle text-gray-400 text-sm font-medium">
        Find and verify products instantly.
      </p>

      {/* App Store + Extension buttons — coming soon placeholders */}
      <ComingSoonCards />
    </div>
  );
}

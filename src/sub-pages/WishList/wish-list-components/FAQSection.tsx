import { useState } from "react";

const faqItems = [
  {
    question: "How do I add items to my wishlist?",
    answer:
      "Search for a product using the search bar, then click the 'Add to Wishlist' button on any product card. You can set a target price and we'll notify you when the price drops.",
  },
  {
    question: "Can I share my wishlist with friends?",
    answer:
      "Yes! Friends can search for your username using the 'Search Other People's Wishlist' section below. Your wishlist is public so anyone can find and view it.",
  },
  {
    question: "What happens if a price drops?",
    answer:
      "When a live price falls below your target price, a flame icon appears on that item. Sign up for deal emails below to also get notified directly in your inbox.",
  },
];

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null); // FAQ accordion

  return (
    <div
      className="wishlist-faq-card w-full max-w-md rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.75)",
        boxShadow: "0 12px 40px rgba(31,38,135,0.14)",
      }}
    >
      <h3 className="text-base font-bold text-gray-900 mb-3">FAQ</h3>
      <div className="w-full flex flex-col gap-2">
        {faqItems.map((faq, index) => (
          <div
            key={index}
            className="wishlist-faq-item rounded-xl overflow-hidden"
            style={{
              background: "rgba(240,244,255,0.6)",
              border: "1px solid rgba(0,170,255,0.1)",
            }}
          >
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="wishlist-faq-question w-full text-left px-4 py-3 flex justify-between items-center transition font-medium text-sm text-gray-800 hover:bg-white/40"
            >
              {faq.question}
              <svg
                className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
                  openFaq === index ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openFaq === index && (
              <div
                className="wishlist-faq-answer px-4 py-3 text-sm text-gray-600 border-t"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  borderColor: "rgba(0,170,255,0.1)",
                }}
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

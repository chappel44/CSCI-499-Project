import { useEffect } from "react";
import { useTheme } from "../Contexts/ThemeContext";

export default function PrivacyPolicy() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const numStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: isDark ? "#0b0f1a" : "#fff",
    background: isDark ? "#e4e4e7" : "#1a1a2e",
    borderRadius: "50%",
    width: 22,
    height: 22,
    display: "inline-flex" as const,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const dividerStyle = {
    border: "none",
    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#eee"}`,
    margin: "32px 0",
  };

  const pStyle = { color: isDark ? "#a1a1aa" : "#444" };
  const titleStyle = { color: isDark ? "#f4f4f5" : "#1a1a2e" };
  const subStyle = { color: isDark ? "#52525b" : "#888" };
  const dashStyle = {
    position: "absolute" as const,
    left: 0,
    color: isDark ? "#3f3f46" : "#ccc",
  };

  const SectionTitle = ({
    num,
    children,
  }: {
    num: number;
    children: string;
  }) => (
    <h2 className="pp-section-title" style={titleStyle}>
      <span style={numStyle}>{num}</span>
      {children}
    </h2>
  );

  const BulletList = ({ items }: { items: string[] }) => (
    <ul className="pp-ul">
      {items.map((item) => (
        <li key={item} style={pStyle}>
          <span style={dashStyle}>—</span>
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{
        background: isDark ? "#0b0f1a" : "#f7f5f0",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        .pp-container { max-width: 780px; margin: 0 auto; border-radius: 4px; padding: 64px 72px; }
        .pp-brand { font-family: 'Fraunces', serif; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px; }
        .pp-title { font-family: 'Fraunces', serif; font-size: 42px; font-weight: 700; line-height: 1.1; margin-bottom: 8px; }
        .pp-effective { font-size: 13px; margin-bottom: 48px; font-weight: 300; }
        .pp-intro { font-size: 15px; line-height: 1.8; margin-bottom: 48px; padding-bottom: 48px; }
        .pp-section { margin-bottom: 40px; }
        .pp-section-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .pp-sub { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; margin-top: 20px; }
        .pp-p { font-size: 14.5px; line-height: 1.85; margin-bottom: 12px; }
        .pp-ul { list-style: none; margin: 8px 0 12px 0; padding: 0; }
        .pp-ul li { font-size: 14.5px; line-height: 1.8; padding: 4px 0 4px 20px; position: relative; }
        .pp-contact { border-radius: 4px; padding: 24px 28px; margin-top: 12px; }
        .pp-contact-name { font-weight: 500; font-size: 15px; margin-bottom: 6px; }
        .pp-contact a { text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 640px) { .pp-container { padding: 36px 24px; } .pp-title { font-size: 30px; } }
      `}</style>

      <div
        className="pp-container"
        style={{
          background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
          boxShadow: isDark
            ? "0 2px 40px rgba(0,0,0,0.3)"
            : "0 2px 40px rgba(0,0,0,0.07)",
        }}
      >
        <p className="pp-brand" style={subStyle}>
          Verifind
        </p>
        <h1 className="pp-title" style={titleStyle}>
          Privacy Policy
        </h1>
        <p
          className="pp-effective"
          style={{ color: isDark ? "#52525b" : "#aaa" }}
        >
          Effective Date: May 5, 2025
        </p>

        <p
          className="pp-intro"
          style={{
            ...pStyle,
            borderBottom: `1px solid ${
              isDark ? "rgba(255,255,255,0.08)" : "#eee"
            }`,
          }}
        >
          Welcome to Verifind. We are a small development team based in New York
          City, New York, United States. This Privacy Policy explains what
          information we collect from you when you use our platform, how we use
          it, and how we protect it. By using Verifind, you agree to the
          practices described in this policy.
        </p>

        {/* Section 1 */}
        <div className="pp-section">
          <SectionTitle num={1}>Information We Collect</SectionTitle>
          <p className="pp-sub" style={subStyle}>
            Account Information
          </p>
          <p className="pp-p" style={pStyle}>
            When you create an account on Verifind, we collect:
          </p>
          <BulletList
            items={[
              "Email address",
              "Password (stored securely as a hash via Supabase — we never store your plain text password)",
            ]}
          />

          <p className="pp-sub" style={subStyle}>
            Search History
          </p>
          <p className="pp-p" style={pStyle}>
            When you search for products on Verifind, we store your user ID, the
            search term you entered, and the timestamp of the search. This is
            used to power your search history feature within the platform.
          </p>

          <p className="pp-sub" style={subStyle}>
            Wishlist Data
          </p>
          <p className="pp-p" style={pStyle}>
            When you add a product to your wishlist, we store your user ID along
            with product information associated with that item, such as the
            product title, price, link, and image URL as returned by our product
            data provider.
          </p>

          <p className="pp-sub" style={subStyle}>
            Marketplace Listings
          </p>
          <p className="pp-p" style={pStyle}>
            When you create a listing on our marketplace, we store all
            information you provide about the listing, including title,
            description, price, images, and any other details you choose to
            submit.
          </p>

          <p className="pp-sub" style={subStyle}>
            Messages and Conversations
          </p>
          <p className="pp-p" style={pStyle}>
            When you use our messaging feature to communicate with buyers or
            sellers, we store the messages exchanged as well as the
            conversations they belong to. This data is used solely to deliver
            and display your messages within the platform.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 2 */}
        <div className="pp-section">
          <SectionTitle num={2}>How We Use Your Information</SectionTitle>
          <p className="pp-p" style={pStyle}>
            We use the information we collect to:
          </p>
          <BulletList
            items={[
              "Provide and operate the Verifind platform",
              "Authenticate your account and keep it secure",
              "Display your search history, wishlist, listings, and messages",
              "Improve and maintain the platform",
            ]}
          />
        </div>

        <hr style={dividerStyle} />

        {/* Section 3 */}
        <div className="pp-section">
          <SectionTitle num={3}>How We Store Your Data</SectionTitle>
          <p className="pp-p" style={pStyle}>
            All user data is stored securely using Supabase, a managed cloud
            database platform. Passwords are hashed and never stored in plain
            text. We do not store any payment information — Verifind does not
            currently process payments.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 4 */}
        <div className="pp-section">
          <SectionTitle num={4}>Third-Party Services</SectionTitle>
          <p className="pp-p" style={pStyle}>
            We use the following third-party services to operate Verifind:
          </p>
          <BulletList
            items={[
              "Supabase — for database storage and user authentication",
              "SerpApi — for fetching real-time product data from retailers. Search queries are sent to SerpApi to retrieve results.",
            ]}
          />
          <p className="pp-p" style={pStyle}>
            We do not sell your data to any third parties, and we do not use
            your data for advertising purposes.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 5 */}
        <div className="pp-section">
          <SectionTitle num={5}>Data Retention</SectionTitle>
          <p className="pp-p" style={pStyle}>
            We retain your data for as long as your account is active. If you
            would like your data deleted, please contact us at the email address
            below and we will process your request.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 6 */}
        <div className="pp-section">
          <SectionTitle num={6}>Children's Privacy</SectionTitle>
          <p className="pp-p" style={pStyle}>
            Verifind is not directed at children under the age of 13. We do not
            knowingly collect personal information from anyone under 13. If you
            believe a child has provided us with their information, please
            contact us and we will delete it.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 7 */}
        <div className="pp-section">
          <SectionTitle num={7}>Your Rights</SectionTitle>
          <p className="pp-p" style={pStyle}>
            You have the right to:
          </p>
          <BulletList
            items={[
              "Access the personal data we hold about you",
              "Request correction of inaccurate data",
              "Request deletion of your account and associated data",
            ]}
          />
          <p className="pp-p" style={pStyle}>
            To exercise any of these rights, please reach out to us directly
            using the contact information below.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 8 */}
        <div className="pp-section">
          <SectionTitle num={8}>Changes to This Policy</SectionTitle>
          <p className="pp-p" style={pStyle}>
            We may update this Privacy Policy from time to time. If we make
            significant changes, we will update the effective date at the top of
            this page. Continued use of Verifind after any changes constitutes
            your acceptance of the updated policy.
          </p>
        </div>

        <hr style={dividerStyle} />

        {/* Section 9 */}
        <div className="pp-section">
          <SectionTitle num={9}>Contact Us</SectionTitle>
          <p className="pp-p" style={pStyle}>
            If you have any questions or concerns about this Privacy Policy or
            your data, please contact us at:
          </p>
          <div
            className="pp-contact"
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "#f7f5f0",
            }}
          >
            <p className="pp-contact-name" style={titleStyle}>
              Verifind
            </p>
            <p className="pp-p" style={{ ...pStyle, marginBottom: 4 }}>
              New York City, New York, United States
            </p>
            <p className="pp-p" style={{ ...pStyle, marginBottom: 0 }}>
              Email:{" "}
              <a href="mailto:chris.happel10@gmail.com" style={titleStyle}>
                chris.happel10@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

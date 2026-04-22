import { useUser } from "../../Contexts/UserContext";

interface GreetUserProps {
  visible: boolean;
}

export default function GreetUser({ visible }: GreetUserProps) {
  const { username } = useUser();

  return (
    <>
      {username && (
        <div
          className="relative z-10 flex justify-center mt-5"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease" }}
        >
          <div
            className="greet-user-pill px-4 py-1.5 rounded-full text-sm backdrop-blur-md border"
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
        </div>
      )}
    </>
  );
}

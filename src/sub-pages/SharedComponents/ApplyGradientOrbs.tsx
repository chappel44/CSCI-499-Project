export default function ApplyGradientOrbs() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "55vw",
          height: "55vw",
          maxWidth: 700,
          maxHeight: 700,
          background:
            "radial-gradient(circle, rgba(0, 153, 255, 0.16) 50%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          maxWidth: 600,
          maxHeight: 600,
          background:
            "radial-gradient(circle, rgba(107,48,255,0.13) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "25%",
          width: "40vw",
          height: "40vw",
          maxWidth: 500,
          maxHeight: 500,
          background:
            "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: "55vw",
          height: "55vw",
          maxWidth: 700,
          maxHeight: 700,
          background:
            "radial-gradient(circle, rgba(109, 43, 172, 0.2) 0%, rgba(107,33,168,0.12) 60%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}

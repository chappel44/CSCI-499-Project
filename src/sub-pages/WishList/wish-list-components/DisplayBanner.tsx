export default function DisplayBanner() {
  return (
    <div className="relative z-10 w-full h-24 relative overflow-hidden rounded-b-3xl shadow-lg group">
      <img
        src="/wishlist1.png"
        alt="Wishlist Banner"
        className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-transform duration-500 group-hover:scale-125"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-300 opacity-40 pointer-events-none"></div>
      <img
        src="/wishlist1.png"
        alt="Wishlist Banner"
        className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 shadow-inner rounded-b-3xl pointer-events-none"></div>
    </div>
  );
}

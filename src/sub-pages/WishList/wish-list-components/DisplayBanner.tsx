<<<<<<< Updated upstream
import wishlistBanner from "../../../assets/wishlist-banner.png";

export default function DisplayBanner() {
  return (
    <div className="wishlist-banner relative z-10 mx-auto mt-6 h-32 w-[min(100%-2rem,1100px)] overflow-hidden rounded-3xl shadow-lg group">
      <img
        src={wishlistBanner}
        alt="Wishlist Banner"
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl transition-transform duration-500 group-hover:scale-125"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/40 pointer-events-none"></div>
      <img
        src={wishlistBanner}
        alt="Wishlist Banner"
        className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/50 pointer-events-none"></div>
    </div>
  );
}
=======
export default function DisplayBanner() {
  return (
    <div className="wishlist-banner relative z-10 w-full h-24 relative overflow-hidden rounded-b-3xl shadow-lg group mt-6">
      <img
        src="wishlist1.png"
        alt="Wishlist Banner"
        className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-transform duration-500 group-hover:scale-125 "
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-300 opacity-40 pointer-events-none"></div>
      <img
        src="wishlist1.png"
        alt="Wishlist Banner"
        className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 shadow-inner rounded-b-3xl pointer-events-none"></div>
    </div>
  );
}
>>>>>>> Stashed changes

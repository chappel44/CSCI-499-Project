import { useEffect, useState } from "react";
import { Search, Plus, X, Camera, Filter, Trash2 } from "lucide-react";
import { supabase } from "../supabase-client";

export default function Marketplace() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Track logged-in user ID
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "electronics",
    description: "",
    condition: "Good",
    imageInput: "" 
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setCurrentUserId(data.session?.user?.id || null); // Save the user's ID
    });
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("sold", false)
      .order("created_at", { ascending: false });
    
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handlePostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return alert("You must be logged in to post.");

    const numericPrice = formData.price === "" ? 0 : parseFloat(formData.price.replace(/[^0-9.]/g, ''));

    const { error } = await supabase.from("marketplace_listings").insert([
      { 
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: numericPrice,
        category: formData.category, 
        condition: formData.condition,
        images: formData.imageInput ? [formData.imageInput] : [], 
        sold: false
      }
    ]);

    if (error) {
      alert("Error posting: " + error.message);
    } else {
      setIsPostModalOpen(false);
      setFormData({ title: "", price: "", category: "electronics", description: "", condition: "Good", imageInput: "" });
      fetchListings(); 
    }
  };

  // Delete listing function
  const handleDeleteListing = async (itemId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this listing? This cannot be undone.");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", itemId);

    if (error) {
      alert("Error deleting listing: " + error.message);
    } else {
      setSelectedItem(null); // Close the modal
      fetchListings(); // Refresh the items grid
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price}`;
  };

  return (
    <div className="min-h-screen flex flex-col pt-24 pb-12 px-4 relative overflow-hidden" style={{ background: "#f0f4ff" }}>
      
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: "55vw", height: "55vw", background: "radial-gradient(circle, rgba(0,170,255,0.18) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "-10%",
          width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(107,48,255,0.15) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-black mb-8 text-center text-gray-900 tracking-tight">Marketplace</h1>

        {/* Search, Filter & Post Bar */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search items..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all"
            />
          </div>

          <div className="flex gap-4 justify-center">
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-700 bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm hover:bg-white active:scale-95 transition-all">
              <Filter size={20} /> Filter
            </button>

            {loggedIn && (
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                <Plus size={20} /> Post Item
              </button>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {items.map((item) => (
            <div key={item.id} className="bg-white/60 backdrop-blur-md rounded-[2rem] p-4 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                <img 
                  src={item.images?.[0] || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"} 
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400/e2e8f0/64748b?text=Image+Unavailable"; }}
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <div className="px-2 flex-grow flex flex-col">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{item.category}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{item.title}</h3>
                
                {/* Changed font weight from font-black to font-medium */}
                <p className="text-2xl font-medium mb-4 text-gray-900">
                  {formatPrice(item.price)}
                </p>
                
                <button onClick={() => setSelectedItem(item)} className="w-full mt-auto py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: POST LISTING */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }} />
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">List an Item</h2>
                <button onClick={() => setIsPostModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-400" /></button>
              </div>

              <form onSubmit={handlePostItem} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Title</label>
                  <input required placeholder="What are you selling?" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Price</label>
                    <input required type="number" step="0.01" min="0" placeholder="$0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Category</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="electronics">Electronics</option>
                      <option value="home">Home</option>
                      <option value="fashion">Fashion</option>
                      <option value="toys">Toys</option>
                      <option value="books">Books</option>
                      <option value="sports">Sports</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Condition</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Image URL</label>
                  <div className="relative">
                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input placeholder="https://..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={formData.imageInput} onChange={e => setFormData({...formData, imageInput: e.target.value})} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Description</label>
                  <textarea rows={3} placeholder="Provide details about the item..." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <button type="submit" className="w-full py-4 rounded-2xl text-white font-bold shadow-xl transition-all hover:opacity-90 active:scale-[0.98] mt-4" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}>
                  Publish Listing
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ITEM DETAILS */}
      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[32px] max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl cursor-default flex flex-col md:flex-row border border-white/20">
            
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white z-10 w-10 h-10 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <X size={20} className="text-gray-900" />
            </button>

            <div className="w-full md:w-[55%] bg-gray-50 min-h-[300px] flex items-center justify-center">
              <img 
                src={selectedItem.images?.[0] || "https://placehold.co/600x600/e2e8f0/64748b?text=No+Image"} 
                onError={(e) => { e.currentTarget.src = "https://placehold.co/600x600/e2e8f0/64748b?text=Image+Unavailable"; }}
                className="w-full h-full object-cover" 
                alt={selectedItem.title}
              />
            </div>

            <div className="w-full md:w-[45%] p-10 md:p-12 flex flex-col bg-white">
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">{selectedItem.category}</span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">{selectedItem.condition}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{selectedItem.title}</h2>
              
              {/* Changed font weight from font-black to font-medium */}
              <p className="text-4xl font-medium mb-8 text-gray-900">
                {formatPrice(selectedItem.price)}
              </p>
              
              <div className="space-y-6 mb-10 flex-grow">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedItem.description || "No description provided by the seller."}</p>
                </div>
                
                <div className="pt-6 border-t border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedItem.seller_name ? selectedItem.seller_name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Listed By</p>
                    <p className="text-sm font-bold text-gray-900">{selectedItem.seller_name || "Anonymous User"}</p>
                  </div>
                </div>
              </div>

              {/* Conditional Button: Delete if owner, otherwise Message Seller */}
              {currentUserId === selectedItem.user_id ? (
                <button 
                  onClick={() => handleDeleteListing(selectedItem.id)}
                  className="w-full py-5 bg-red-50 text-red-600 border border-red-200 text-lg font-bold rounded-2xl hover:bg-red-100 shadow-sm transition-all transform active:scale-95 mt-auto flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete Listing
                </button>
              ) : (
                <button className="w-full py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 shadow-xl transition-all transform active:scale-95 mt-auto">
                  Message Seller
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 w-full py-10 mt-auto flex justify-center" style={{ borderTop: "1px solid rgba(0,170,255,0.1)" }}>
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Verifind. All rights reserved.</p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Search } from "lucide-react";

// mock data to populate the marketplace

const MOCK_ITEMS = [
   { id: 1, name:"Vintage Camera", price: "$120", category: "Electronics", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&h=200" },
   { id: 2, name:"Mountain Bike", price: "$450", category: "Sports", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&h=200" },
   { id: 3, name:"Cool Lamp", price: "$45", category: "Home", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&h=200" },
];

export default function Marketplace(){
   const [selectedItem, setSelectedItem] = useState<any>(null);
   return(
      <div className="pt-24 px-6 min-h-screen bg-gray-50">
         <h1 className="text-3xl font-bold mb-8 text-center">Marketplace</h1>
         
         {/*Search bar and filter*/}
         <div className="mb-8 max-w-2xl mx-auto flex gap-3 items-center"> 
            <div className="relative flex-1 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  className="w-full pl-10 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all shadow-sm" 
                />
            </div>
   
            <button className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-black active:scale-95 transition-all">
               Filter
            </button>
         </div>

         {/*Product grid*/}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"> 
         {MOCK_ITEMS.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
               <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-44 object-cover rounded-lg mb-4"
               />
               <div className="flex-grow">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight mb-1">{item.category}</p>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">{item.name}</h3>
                  <span className="text-2xl font-bold text-gray-900 block mb-4">{item.price}</span>
            </div>
               <button 
                  onClick={() => setSelectedItem(item)}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all">
                  View Details
               </button>
               </div>
            ))}
      </div>
     {/*Item Profiles*/}
     {selectedItem && (
         <div onClick={() => setSelectedItem(null)} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-7xl w-full min-h-[80vh] max-h-[95vh] overflow-y-auto relative shadow-2xl cursor-default flex flex-col md:flex-row">
               
               <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10 w-10 h-10 flex items-center justify-center text-xl font-bold">✕</button>

               <div className="w-full md:w-[60%]">
                  <img src={selectedItem.image} className="w-full h-full min-h-[400px] md:min-h-[80vh] object-cover rounded-l-2xl" />
               </div>

               <div className="w-full md:w-[40%] p-12 flex flex-col gap-8">
                  <div>
                     <p className="text-blue-600 font-bold uppercase text-sm tracking-widest mb-2">{selectedItem.category}</p>
                     <h2 className="text-4xl font-extrabold leading-tight">{selectedItem.name}</h2>
                  </div>
                  
                  <p className="text-2xl font-bold">{selectedItem.price}</p>
                  
                  <p className="text-gray-600 text-xl leading-relaxed">
                     This is a mock description for Verifind. 
                     Here you would usally find the description of the object, it's condition, location and any other relevant information. 
                     The seller contact information will be hidden untill the button is pressed to avoid spam calls.
                  </p>

                  <div className="mt-auto pt-10">
                     <button className="w-full py-5 bg-blue-600 text-white text-xl font-bold rounded-2xl hover:bg-blue-700 shadow-xl transition-all transform active:scale-95">
                        Message Seller
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
      </div>
   );
} 

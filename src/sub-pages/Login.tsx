import { useState } from "react";
import { Search } from "lucide-react";

export default function Login() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Logging in with:", {email, password});
      // supabase auth logic here
   };

   return (
      <div className="pt-24 p-8">
         <h1 className="text-2xl font-bold mb-4">Login</h1>
         <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
            <input
               type="email"
               placeholder="youremail@email.com"
               className="border p-2 rounded"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
              />
             <input
               type="password"
               placeholder="Password"
               className="border p-2 rounded"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
             />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
               Login
            </button>
         </form>
      </div>
   );
}

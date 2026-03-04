import { useState } from "react";
import { Link } from "react-router-dom"; // so that we can send to Login Page :)
import { useNavigate } from "react-router-dom";

export default function SignUp() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const navigate = useNavigate();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Signing up with:", {email, password});
      /* Ready for database keys
       const { data,error } = await supabase.auth.signUp({email,password,});

       if (error) {
       alert("Sign up failed: " + error.message);
       } else {
         navigate("/"); // same as login, sends to main page
       }
       */

      alert("Sign up is waiting for dtabase keys rn.");




   };

   return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
         <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
            <input
               type="email"
               placeholder="Email"
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
            <button type="submit" className="bg-green-500 text-white transition-transform duration-200 hover:scale-105 active:scale-95 p-2 rounded">
               Sign Up
            </button>
         </form>
      <p className="mt-4 text-sm">
      Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
      </p>
      </div>
   );
}

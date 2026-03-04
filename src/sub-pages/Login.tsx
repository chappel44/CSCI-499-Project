import { useState } from "react";
import { Link } from "react-router-dom"; // to link to the sign up page
import { useNavigate } from "react-router-dom";

export default function Login() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const navigate = useNavigate();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Logging in with:", {email, password});
      console.log("Form submitted!");
      navigate("/");
      /* uncomment supabase auth logic here after supabase set up properly
      const { data, error } = await supabase.auth.signInWithPassword({email,password,});

      if (error) {
         alert(error.message);
      } else {
         navigate("/"); // bring user to homepage on successful login can do navigate(-1) to go to last page
      }
       */
      alert("Auth disabled until database keys setup.");
   };

   return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <h1 className="text-2xl font-bold mb-4">Login</h1>
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
            <button type="submit" className="bg-blue-500 text-white transition-transform duration-200 hover:scale-105 active:scale-95 p-2 rounded">
               Login
            </button>
         </form>
      <p className="mt-4 text-sm">
      Need an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
      </p>
      </div>
   );
}

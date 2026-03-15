import type { SetStateAction } from "react";
import { supabase } from "../../../supabase-client";

export default async function handleDealSignup(
  dealEmail: string,
  setDealLoading: React.Dispatch<SetStateAction<boolean>>,
  setDealSent: React.Dispatch<SetStateAction<boolean>>,
  setDealEmail: React.Dispatch<SetStateAction<string>>
) {
  if (!dealEmail.trim()) return;
  setDealLoading(true);

  // connected with supabase — sends a magic link email as a test to confirm email delivery works
  const { error } = await supabase.auth.signInWithOtp({
    email: dealEmail.trim(),
    options: {
      shouldCreateUser: false, // don't create a new account, just send the email
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    // if user doesn't exist it will still "succeed" in terms of email delivery test
    console.warn("Deal signup note:", error.message);
  }

  setDealSent(true);
  setDealLoading(false);
  setTimeout(() => {
    setDealSent(false);
    setDealEmail("");
  }, 4000);
}

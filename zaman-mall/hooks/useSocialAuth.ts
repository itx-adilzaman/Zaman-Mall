import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";

function useSocialAuth() {
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { showAlert } = useAlert();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setLoadingStrategy(strategy);

    try {
      if (strategy === "oauth_google") {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } catch (error: any) {
      console.log("💥 Error in social auth:", error);
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      showAlert({
        title: "Auth Error",
        message: `Failed to sign in with ${provider}. ${error.message}`,
        icon: "lock-closed-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { loadingStrategy, handleSocialAuth };
}

export default useSocialAuth;

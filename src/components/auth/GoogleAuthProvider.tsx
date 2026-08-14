"use client";

import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";

// Fallback client ID so the app loads cleanly even before Google Cloud Console keys are pasted
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1000000000000-placeholder.apps.googleusercontent.com";

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    // Rehydrate active session on app load
    checkSession();
  }, [checkSession]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

"use client";

import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";

const GOOGLE_CLIENT_ID = 
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
  "15482042037-ubm85i4kv52r6734q63d54b5hvbck7dg.apps.googleusercontent.com";

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

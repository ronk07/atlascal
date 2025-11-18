"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";

export function ThemeInitializer() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const { data: session, status } = useSession();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Wait for session to be loaded
    if (status === "loading") return;

    const loadTheme = async () => {
      if (session?.user?.email && !hasInitialized) {
        try {
          const res = await fetch("/api/user/preferences");
          if (res.ok) {
            const data = await res.json();
            if (data.theme && data.theme !== "system") {
              // Force set the theme to ensure it's applied
              setTheme(data.theme);
            }
          }
        } catch (error) {
          console.error("Failed to load theme preference", error);
        } finally {
          setHasInitialized(true);
        }
      } else if (!session && !hasInitialized) {
        // No session, mark as initialized
        setHasInitialized(true);
      }
    };
    loadTheme();
  }, [session, status, setTheme, hasInitialized]);

  return null; // This component doesn't render anything
}


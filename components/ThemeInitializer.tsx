"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";

export function ThemeInitializer() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const { data: session, status } = useSession();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const currentTheme = resolvedTheme ?? theme;
    if (!currentTheme) return;

    const root = document.documentElement;
    const body = document.body;
    const isDark = currentTheme === "dark";

    root.classList.toggle("dark", isDark);
    body.classList.toggle("dark", isDark);

    root.setAttribute("data-theme", currentTheme);
    body.setAttribute("data-theme", currentTheme);
  }, [resolvedTheme, theme]);

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

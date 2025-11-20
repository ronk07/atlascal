"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to prevent hydration mismatch
  }

  const activeTheme = (theme === "system" ? resolvedTheme : theme) ?? "light";

  const handleToggle = async () => {
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // Save theme preference to database when user toggles
    if (session?.user?.email) {
      try {
        await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (error) {
        console.error("Failed to save theme preference", error);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="text-[#B3B3B3] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:text-white transition-colors"
      aria-label="Toggle dark mode"
    >
      {activeTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

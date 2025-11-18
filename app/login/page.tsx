"use client";

import { signIn, useSession } from "next-auth/react";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFFFF] p-4 text-[#2B2B2B] dark:bg-[#1a1a1a] dark:text-white">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4D4D4] dark:bg-[#404040]">
            <Bot className="h-8 w-8 text-[#2B2B2B] dark:text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Atlas</h1>
          <p className="text-lg text-[#B3B3B3] dark:text-[#A0A0A0]">
            Chat with your calendar and tasks
          </p>
        </div>

        <div className="mt-10">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="group relative flex w-full justify-center rounded-md bg-[#2B2B2B] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2B2B] dark:bg-white dark:text-[#2B2B2B] dark:focus-visible:outline-white"
          >
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}


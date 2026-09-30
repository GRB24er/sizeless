"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

type TawkApi = { maximize?: () => void };

/** Opens the site's live chat window, or the contact page if the chat script is blocked. */
export function ChatButton({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const api = (window as unknown as { Tawk_API?: TawkApi }).Tawk_API;
        if (typeof api?.maximize === "function") api.maximize();
        else router.push("/contact");
      }}
    >
      {children}
    </button>
  );
}

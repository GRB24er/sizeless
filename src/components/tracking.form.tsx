"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TrackingForm = ({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dark = variant === "dark";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = trackingNumber.trim().toUpperCase();
    if (!num) {
      toast.error("Please enter a tracking number");
      return;
    }
    setIsLoading(true);
    router.push(`/track/${encodeURIComponent(num)}`);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <label htmlFor="tracking-number" className="sr-only">
        Tracking number
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl p-1.5 transition-shadow focus-within:ring-2",
          dark
            ? "bg-white/[0.07] ring-1 ring-white/15 backdrop-blur-sm focus-within:ring-gold/60"
            : "bg-white ring-1 ring-ink/10 shadow-sm focus-within:ring-gold-deep/50"
        )}
      >
        <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
        <input
          id="tracking-number"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. LOX-7K2M9QXA"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          className={cn(
            "h-12 min-w-0 flex-1 bg-transparent px-2 font-mono text-[15px] tracking-wide outline-none",
            dark ? "text-white placeholder:text-slate-400" : "text-ink placeholder:text-slate-400"
          )}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "inline-flex h-12 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors disabled:opacity-70",
            dark ? "bg-gold text-ink hover:bg-[#d8b566]" : "bg-navy text-white hover:bg-navy-soft"
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Track <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
};

export default TrackingForm;

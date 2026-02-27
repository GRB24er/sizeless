"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TrackingForm = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast.success("Tracking request submitted", {
        description: `Tracking number: ${trackingNumber}`,
      });
      const num = trackingNumber.trim();
      setTrackingNumber("");
      router.push(`/track/${encodeURIComponent(num)}`);
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            type="text"
            placeholder="Enter tracking number (e.g. AML-XXXXXXXX)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="h-14 pl-12 pr-4 text-base bg-[#0A1628]/50 border-emerald-900/30 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "h-14 px-8 rounded-xl font-semibold text-base",
            "bg-gradient-to-r from-emerald-600 to-emerald-700",
            "hover:from-emerald-500 hover:to-emerald-600",
            "text-white shadow-lg shadow-emerald-600/25",
            "transition-all duration-200",
            "disabled:opacity-70"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Track <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default TrackingForm;

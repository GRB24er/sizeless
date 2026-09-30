"use client";

import React, { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Arrow, buttonClass } from "@/components/landing/primitives";

/** Accepts "lox-7k2m 9qxa" or just the 8-character code, returns "LOX-7K2M9QXA". */
function normalize(raw: string) {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9]{8}$/.test(v) ? `LOX-${v}` : v;
}

const TrackingForm = ({
  className,
  help = "It starts with LOX- and is in your booking confirmation email.",
}: {
  className?: string;
  help?: string | null;
}) => {
  const id = useId();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = normalize(value);
    if (!num) {
      setError("Enter the tracking number from your booking confirmation.");
      return;
    }
    setError(null);
    setPending(true);
    router.push(`/track/${encodeURIComponent(num)}`);
  };

  const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("w-full", className)}>
      <label htmlFor={`${id}-input`} className="text-sm font-medium text-ink">
        Tracking number
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={`${id}-input`}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="LOX-7K2M9QXA"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "figures h-12 w-full min-w-0 rounded-md border bg-white sm:flex-1 px-4 text-[15px] uppercase text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus:outline-none focus:ring-[3px]",
            error ? "border-[#B42318] focus:ring-[#B42318]/15" : "border-line-2 focus:border-ink focus:ring-signal/15"
          )}
        />
        <button type="submit" disabled={pending} className={buttonClass("primary", "md", "h-12 sm:w-auto")}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Opening
            </>
          ) : (
            <>
              Track <Arrow />
            </>
          )}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] text-[#B42318]">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="mt-2 text-[13px] text-ink-3">
            {help}
          </p>
        )
      )}
    </form>
  );
};

export default TrackingForm;

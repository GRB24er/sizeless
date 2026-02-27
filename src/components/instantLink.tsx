"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface InstantNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export function InstantNavLink({
  href,
  children,
  className = "",
  activeClassName = "",
}: InstantNavLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsClicked(true);

    startTransition(() => {
      router.push(href);
    });

    // Reset clicked state after a short delay
    setTimeout(() => setIsClicked(false), 2000);
  };

  const isLoading = isPending || isClicked;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${className} ${isLoading ? activeClassName : ""} relative`}
      prefetch={true} // Enable prefetching
    >
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-emerald-100 bg-opacity-50 flex items-center justify-center rounded">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </Link>
  );
}

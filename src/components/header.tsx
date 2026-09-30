"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, User, Package, LogOut, LayoutDashboard, ChevronDown, LayoutGrid, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./logo";
import { Notifications } from "./features/notification/notification";
import { ActiveShipment } from "./features/dashboard/shipments/activeShipment";
import { buttonClass } from "./landing/primitives";

const NAV = [
  { href: "/track", label: "Track" },
  { href: "/services", label: "Services" },
  { href: "/vault", label: "Vault" },
  { href: "/support", label: "Support" },
];

// Signed-in clients get their own vault in place of the public vault page.
const SIGNED_IN_NAV = NAV.map((item) => (item.href === "/vault" ? { href: "/my-vault", label: "My vault" } : item));

const ACCOUNT_LINKS = [
  { href: "/account", label: "My account", icon: LayoutGrid },
  { href: "/my-vault", label: "My vault", icon: LockKeyhole },
  { href: "/shipments/history", label: "My shipments", icon: Package },
  { href: "/profile", label: "Profile", icon: User },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinel = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";
  const name = session?.user?.name || session?.user?.email || "Account";

  // The border appears once the top of the page has scrolled away.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const nav = signedIn ? SIGNED_IN_NAV : NAV;
  const handleSignOut = () => signOut({ callbackUrl: "/" });

  return (
    <>
      <span ref={sentinel} aria-hidden className="pointer-events-none absolute left-0 top-0 h-2 w-px" />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 h-[var(--header-h)] border-b bg-canvas/85 backdrop-blur-md backdrop-saturate-150 transition-[border-color,box-shadow] duration-200",
          scrolled ? "border-line shadow-[0_1px_12px_-6px_rgba(15,29,47,0.18)]" : "border-transparent"
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-8">
            <Logo />
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center">
                {nav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-[var(--header-h)] items-center px-3 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-8 focus-visible:outline-signal",
                          active ? "text-ink" : "text-ink-2 hover:text-ink"
                        )}
                      >
                        {item.label}
                        {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-signal" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {signedIn ? (
              <>
                <Notifications />
                <ActiveShipment />
                <Link href="/shipments/create" className={buttonClass("dark", "sm", "ml-1")}>
                  Book a shipment
                </Link>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="group ml-1 inline-flex h-9 items-center gap-2 rounded-md pl-1 pr-2 text-sm font-medium text-ink transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-signal">
                    <span className="grid size-7 place-items-center rounded-full bg-navy text-[12px] font-semibold uppercase text-white">
                      {name.charAt(0)}
                    </span>
                    <span className="max-w-28 truncate">{name}</span>
                    <ChevronDown aria-hidden strokeWidth={1.75} className="size-4 text-ink-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-lg border-line bg-surface p-1 shadow-[0_16px_40px_-16px_rgba(15,29,47,0.35)]">
                    <DropdownMenuLabel className="px-2 py-1.5 text-[13px] font-normal text-ink-3">
                      Signed in as
                      <span className="block truncate font-medium text-ink">{session?.user?.email || name}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-line" />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="gap-2 text-ink">
                          <LayoutDashboard strokeWidth={1.75} /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                      <DropdownMenuItem key={href} asChild>
                        <Link href={href} className="gap-2 text-ink">
                          <Icon strokeWidth={1.75} /> {label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-line" />
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-[#B42318] focus:text-[#B42318]">
                      <LogOut strokeWidth={1.75} className="text-[#B42318]" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-md px-3 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
                >
                  Sign in
                </Link>
                <Link href="/register" className={buttonClass("dark", "sm")}>
                  Open an account
                </Link>
              </>
            )}
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-signal lg:hidden"
            >
              <Menu strokeWidth={1.75} className="size-6" />
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined} className="w-full gap-0 border-line bg-canvas p-0 sm:max-w-sm">
              <SheetHeader className="h-[var(--header-h)] justify-center border-b border-line px-5">
                <SheetTitle asChild>
                  <div>
                    <SheetClose asChild>
                      <Logo />
                    </SheetClose>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <nav aria-label="Main" className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
                <ul>
                  {[{ href: "/", label: "Home" }, ...nav, { href: "/contact", label: "Contact" }].map((item, i) => {
                    const active = item.href === "/" ? pathname === "/" : isActive(item.href);
                    return (
                      <li key={item.href} className="animate-rise border-b border-line" style={{ "--delay": `${i * 40}ms` } as CSSProperties}>
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn("flex items-center justify-between py-4 text-xl font-medium", active ? "text-ink" : "text-ink-2")}
                          >
                            {item.label}
                            {active && <span aria-hidden className="size-2 rounded-full bg-signal" />}
                          </Link>
                        </SheetClose>
                      </li>
                    );
                  })}
                </ul>

                {signedIn ? (
                  <div className="mt-8 space-y-4">
                    <p className="text-[13px] text-ink-3">
                      Signed in as <span className="block truncate text-[15px] font-medium text-ink">{session?.user?.email || name}</span>
                    </p>
                    <SheetClose asChild>
                      <Link href="/shipments/create" className={buttonClass("dark", "md", "w-full")}>
                        Book a shipment
                      </Link>
                    </SheetClose>
                    <div className="flex">
                      <ActiveShipment />
                    </div>
                    <ul className="space-y-1">
                      {isAdmin && (
                        <li>
                          <SheetClose asChild>
                            <Link href="/dashboard" className="flex items-center gap-3 rounded-md py-2.5 text-[15px] text-ink">
                              <LayoutDashboard strokeWidth={1.75} className="size-4 text-ink-3" /> Dashboard
                            </Link>
                          </SheetClose>
                        </li>
                      )}
                      {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                          <SheetClose asChild>
                            <Link href={href} className="flex items-center gap-3 rounded-md py-2.5 text-[15px] text-ink">
                              <Icon strokeWidth={1.75} className="size-4 text-ink-3" /> {label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                      <li>
                        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-md py-2.5 text-[15px] text-[#B42318]">
                          <LogOut strokeWidth={1.75} className="size-4" /> Sign out
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-3">
                    <SheetClose asChild>
                      <Link href="/register" className={buttonClass("dark", "md", "w-full")}>
                        Open an account
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/login" className={buttonClass("outline", "md", "w-full")}>
                        Sign in
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
};

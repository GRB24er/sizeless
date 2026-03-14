"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Menu, User, Package, LogOut, LayoutDashboard,
  MapPin, Mail, Clock, ChevronDown, Vault,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Logo } from "./logo";
import { Notifications } from "./features/notification/notification";
import { ActiveShipment } from "./features/dashboard/shipments/activeShipment";
import { InstantNavLink } from "./instantLink";

const mainNavItems = [
  { href: "/", label: "Home" },
  { href: "/track", label: "Track" },
  { href: "/services", label: "Services" },
  { href: "/vault", label: "Vault" },
  { href: "/support", label: "Support" },
];

const authNavItems = {
  unauthenticated: [{ href: "/login", label: "Login" }],
  authenticated: [
    { href: "/profile", label: "Profile", icon: User },
    { href: "/shipments/history", label: "My Shipments", icon: Package },
  ],
};

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => { await signOut({ callbackUrl: "/" }); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar */}
      <div className={cn(
        "hidden lg:block transition-all duration-300 overflow-hidden bg-[#0F1D2F]/95 backdrop-blur-xl border-b border-[#0F1D2F]/30",
        isScrolled ? "h-0 opacity-0" : "h-10 opacity-100"
      )}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#8C9EAF]" />
                <span>17 Bluestem Rd, Ipswich IP3 9RR, United Kingdom</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Mail className="w-3.5 h-3.5 text-[#8C9EAF]" />
                <span>admin@aegiscargo.org</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Clock className="w-3.5 h-3.5 text-[#8C9EAF]" />
                <span>Mon - Sat: 8:00 AM - 5:00 PM</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/vault" className="text-xs text-[#8C9EAF] hover:text-[#C8D3DD] transition-colors font-medium">Vault Services</Link>
              <Link href="/support" className="text-xs text-slate-400 hover:text-white transition-colors">Help Center</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={cn(
        "transition-all duration-300",
        isScrolled
          ? "bg-[#0F1D2F]/95 backdrop-blur-xl border-b border-[#0F1D2F]/30 shadow-lg shadow-[#0F1D2F]/50"
          : "bg-[#0F1D2F]/80 backdrop-blur-md"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Logo />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const isVault = item.label === "Vault";
                return (
                  <InstantNavLink key={item.href} href={item.href} className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                    isActive ? "text-white" : isVault ? "text-[#8C9EAF] hover:text-[#C8D3DD] hover:bg-[#8C9EAF]/10" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}>
                    {item.label}
                    {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1E3A5F]" />}
                  </InstantNavLink>
                );
              })}
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Notifications />
                  <ActiveShipment />
                  <InstantNavLink href="/shipments/create" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1E3A5F] to-[#162D4A] text-white text-sm font-medium hover:from-[#1E3A5F] hover:to-[#1E3A5F] transition-all shadow-lg shadow-[#1E3A5F]/25">
                    Create Shipment
                  </InstantNavLink>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800/50">
                        <div className="w-8 h-8 rounded-full bg-[#0F1D2F]/50 border border-[#162D4A]/50 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#8C9EAF]" />
                        </div>
                        <span className="max-w-24 truncate text-sm">{session?.user?.name || "Account"}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#0F1D2F] border-[#0F1D2F]/50">
                      <DropdownMenuLabel className="text-slate-300">My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#0F1D2F]/30" />
                      {session?.user?.role === "ADMIN" && (
                        <DropdownMenuItem asChild>
                          <InstantNavLink href="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white"><LayoutDashboard className="w-4 h-4" />Dashboard</InstantNavLink>
                        </DropdownMenuItem>
                      )}
                      {authNavItems.authenticated.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <InstantNavLink href={item.href} className="flex items-center gap-2 text-slate-300 hover:text-white"><Icon className="w-4 h-4" />{item.label}</InstantNavLink>
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator className="bg-[#0F1D2F]/30" />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer">
                        <LogOut className="w-4 h-4" />Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <InstantNavLink href="/login" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1E3A5F] to-[#162D4A] text-white text-sm font-medium hover:from-[#1E3A5F] hover:to-[#1E3A5F] transition-all shadow-lg shadow-[#1E3A5F]/25">
                  Login
                </InstantNavLink>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-800/50"><Menu className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm bg-[#0F1D2F] border-[#0F1D2F]/30 p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-[#0F1D2F]/30">
                    <SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader>
                  </div>
                  <div className="p-4 bg-[#132640]/50 border-b border-[#0F1D2F]/30">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-400"><MapPin className="w-4 h-4 text-[#8C9EAF]" /><span>17 Bluestem Rd, Ipswich IP3 9RR, UK</span></div>
                      <div className="flex items-center gap-3 text-sm text-slate-400"><Mail className="w-4 h-4 text-[#8C9EAF]" /><span>admin@aegiscargo.org</span></div>
                      <div className="flex items-center gap-3 text-sm text-slate-400"><Clock className="w-4 h-4 text-[#8C9EAF]" /><span>Mon - Sat: 8:00 AM - 5:00 PM</span></div>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {mainNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <SheetClose key={item.href} asChild>
                          <InstantNavLink href={item.href} className={cn(
                            "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            isActive ? "bg-[#1E3A5F]/10 text-[#8C9EAF] border border-[#1E3A5F]/20" : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                          )}>
                            {item.label}
                          </InstantNavLink>
                        </SheetClose>
                      );
                    })}
                    <div className="my-4 h-px bg-[#0F1D2F]/30" />
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 mb-4">
                          <p className="text-xs text-slate-500">Signed in as</p>
                          <p className="text-sm font-medium text-white truncate">{session?.user?.email || session?.user?.name}</p>
                        </div>
                        <div className="space-y-2 px-4 mb-4">
                          <ActiveShipment />
                          <SheetClose asChild>
                            <InstantNavLink href="/shipments/create" className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#1E3A5F] to-[#162D4A] text-white text-sm font-medium">Create Shipment</InstantNavLink>
                          </SheetClose>
                        </div>
                        {session?.user?.role === "ADMIN" && (
                          <SheetClose asChild><InstantNavLink href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50"><LayoutDashboard className="w-4 h-4" />Dashboard</InstantNavLink></SheetClose>
                        )}
                        {authNavItems.authenticated.map((item) => {
                          const Icon = item.icon;
                          return (<SheetClose key={item.href} asChild><InstantNavLink href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50"><Icon className="w-4 h-4" />{item.label}</InstantNavLink></SheetClose>);
                        })}
                        <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><LogOut className="w-4 h-4" />Logout</button>
                      </>
                    ) : (
                      <SheetClose asChild>
                        <InstantNavLink href="/login" className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#1E3A5F] to-[#162D4A] text-white text-sm font-medium">Login</InstantNavLink>
                      </SheetClose>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Facebook, Twitter, Linkedin, Instagram, Mail, Phone,
  MapPin, ArrowRight, Shield, Package, Vault,
} from "lucide-react";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const handleSubscribe = (e: React.FormEvent) => { e.preventDefault(); setEmail(""); };

  return (
    <footer className="relative bg-[#0F1D2F] text-gray-300 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#1E3A5F] via-[#8C9EAF] to-[#1E3A5F]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(140,158,175,0.4) 1px, transparent 0)`, backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image src="/images/logo.png" alt="Aegis Cargo" width={180} height={60} className="brightness-110" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">Enterprise-grade global logistics, secure vault storage, and real-time shipment tracking. Trusted by businesses worldwide since 1998.</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E3A5F]/20 border border-[#1E3A5F]/30">
                <Shield className="w-3.5 h-3.5 text-[#B3C7DB]" /><span className="text-xs text-[#B3C7DB] font-medium">ISO 9001</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8C9EAF]/10 border border-[#8C9EAF]/20">
                <Vault className="w-3.5 h-3.5 text-[#8C9EAF]" /><span className="text-xs text-[#8C9EAF] font-medium">LBMA Approved</span>
              </div>
            </div>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1E3A5F]/30 hover:border-[#1E3A5F]/40 transition-all"><Icon className="w-4 h-4" /></a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6 flex items-center gap-2"><Package className="w-4 h-4 text-[#8C9EAF]" /> Services</h3>
            <ul className="space-y-3">
              {[
                { label: "Global Shipping", href: "/services" }, { label: "Express Delivery", href: "/services" },
                { label: "Freight Forwarding", href: "/services" }, { label: "Container Shipping", href: "/services" },
                { label: "Vault Storage", href: "/vault", accent: true }, { label: "Gold Custody", href: "/vault", accent: true },
                { label: "Customs Clearance", href: "/services" },
              ].map((item, i) => (
                <li key={i}><Link href={item.href} className={`text-sm flex items-center gap-2 transition-colors ${item.accent ? "text-[#8C9EAF]/80 hover:text-[#8C9EAF]" : "text-gray-400 hover:text-[#B3C7DB]"}`}><ArrowRight className="w-3 h-3" /> {item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Support</h3>
            <ul className="space-y-3">
              {[
                { label: "Track Shipment", href: "/track" }, { label: "Get a Quote", href: "/quote" },
                { label: "Contact Us", href: "/contact" }, { label: "FAQs", href: "/support" },
                { label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" },
              ].map((item, i) => (
                <li key={i}><Link href={item.href} className="text-sm text-gray-400 hover:text-[#B3C7DB] transition-colors flex items-center gap-2"><ArrowRight className="w-3 h-3" /> {item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Get In Touch</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-[#8C9EAF] mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-400">Strada Bulevardul Unirii 72,<br />Floor 3, Office 12,<br />030833 Bucharest, Romania</p></div>
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#8C9EAF] flex-shrink-0" /><a href="tel:+440201412251" className="text-sm text-gray-400 hover:text-white transition-colors">+44 020 1412 251</a></div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#8C9EAF] flex-shrink-0" /><a href="mailto:admin@aegiscargo.org" className="text-sm text-gray-400 hover:text-white transition-colors">admin@aegiscargo.org</a></div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-3">Subscribe for shipping updates & vault insights</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm h-10 focus:border-[#1E3A5F]/50" />
                <Button type="submit" size="sm" className="bg-[#1E3A5F] hover:bg-[#162D4A] text-white px-4 h-10 flex-shrink-0"><ArrowRight className="w-4 h-4" /></Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Aegis Cargo. All rights reserved. Licensed & Bonded International Freight Carrier.</p>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-[#1E3A5F]" /> 256-bit SSL Encrypted</span>
              <span className="flex items-center gap-1.5"><Vault className="w-3 h-3 text-[#8C9EAF]" /> Insured Vault Storage</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Shield, Clock, Headphones, BarChart3, Globe, Vault } from "lucide-react";

export const Choice = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  const reasons = [
    { icon: Globe, title: "International Shipping", desc: "Door-to-door shipping with customs brokerage included in your quote.", color: "emerald" },
    { icon: Shield, title: "KYC-Verified Vault Clients", desc: "Identity and source-of-funds checks before any vault deposit is accepted.", color: "emerald" },
    { icon: Clock, title: "Logged Handovers", desc: "Every status change is recorded on your tracking page and emailed to you.", color: "emerald" },
    { icon: Vault, title: "Secure Vault Storage", desc: "Insured gold and precious metals custody in high-security, climate-controlled vaults.", color: "gold" },
    { icon: Headphones, title: "Dedicated Support", desc: "Live chat and email support for shipments, customs, and vault enquiries.", color: "emerald" },
    { icon: BarChart3, title: "Transparent Pricing", desc: "Every charge is itemized and agreed before you book. Nothing is added afterwards.", color: "emerald" },
  ];

  return (
    <section ref={ref} className="relative py-24 bg-gradient-to-b from-slate-950 to-[#0F1D2F] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#1E3A5F]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#8C9EAF]/4 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A5F]/10 border border-[#1E3A5F]/20 mb-6">
            <Shield className="w-4 h-4 text-[#8C9EAF]" />
            <span className="text-sm font-medium text-[#B3C7DB]">Why Aegis Cargo</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            The Smart Choice for{" "}
            <span className="bg-gradient-to-r from-[#8C9EAF] to-[#B3C7DB] bg-clip-text text-transparent">Global Logistics</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Clear pricing, logged handovers, and secure custody for high-value cargo.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((item, i) => {
            const isGold = item.color === "gold";
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`group relative p-7 rounded-2xl border transition-all duration-300 hover:translate-y-[-2px] ${
                  isGold
                    ? "bg-[#8C9EAF]/5 border-[#8C9EAF]/20 hover:border-[#8C9EAF]/40 hover:bg-[#8C9EAF]/10"
                    : "bg-slate-800/30 border-slate-700/50 hover:border-[#1E3A5F]/30 hover:bg-slate-800/50"
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  isGold ? "bg-[#8C9EAF]/15 text-[#8C9EAF]" : "bg-[#1E3A5F]/10 text-[#8C9EAF] group-hover:bg-[#1E3A5F]/20"
                } transition-colors`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

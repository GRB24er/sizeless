"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { ArrowRight, Phone, Mail, Shield, Vault } from "lucide-react";
import Link from "next/link";

export const Quota = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="relative py-24 bg-gradient-to-b from-[#0A1628] to-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[200px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="relative p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/80 border border-slate-700/50 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4A853]/8 rounded-full blur-[80px]" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Ship?{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Get a Quote</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">Whether you're shipping cargo worldwide or looking for secure vault storage for your precious metals, our team is ready to help.</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/quote" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/25">
                  Request a Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/vault" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] font-semibold text-sm hover:bg-[#D4A853]/20 transition-all">
                  <Vault className="w-4 h-4" /> Vault Inquiry
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <a href="tel:+440201412251" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><Phone className="w-4 h-4 text-emerald-400" />+44 020 1412 251</a>
                <a href="mailto:admin@aramexlogistics.org" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><Mail className="w-4 h-4 text-emerald-400" />admin@aramexlogistics.org</a>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Shield, title: "Fully Insured Shipments", desc: "Every package covered with comprehensive cargo insurance.", color: "emerald" },
                { icon: Vault, title: "Certified Vault Storage", desc: "LBMA-approved facilities for gold and precious metals custody.", color: "gold" },
              ].map((item, i) => {
                const isGold = item.color === "gold";
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.15 }}
                    className={`p-6 rounded-2xl border ${isGold ? "bg-[#D4A853]/5 border-[#D4A853]/20" : "bg-slate-800/30 border-slate-700/50"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isGold ? "bg-[#D4A853]/15 text-[#D4A853]" : "bg-emerald-500/10 text-emerald-400"}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

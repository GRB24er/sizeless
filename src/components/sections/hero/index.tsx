"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { ArrowRight, Shield, Globe, Vault, Package, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const Hero = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center bg-gradient-to-br from-[#0A1628] via-[#0D1F35] to-[#071018] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#D4A853]/5 rounded-full blur-[180px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(5,150,105,0.4) 1px, transparent 0)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Floating elements */}
      <motion.div className="absolute top-32 right-[15%] hidden lg:block" animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Package className="w-5 h-5 text-emerald-400" /></div>
            <div><p className="text-xs text-slate-400">Active Shipments</p><p className="text-lg font-bold text-white">2,847</p></div>
          </div>
        </div>
      </motion.div>

      <motion.div className="absolute bottom-40 right-[10%] hidden lg:block" animate={{ y: [0, 12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-[#D4A853]/20 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A853]/20 flex items-center justify-center"><Vault className="w-5 h-5 text-[#D4A853]" /></div>
            <div><p className="text-xs text-slate-400">Vault Secured</p><p className="text-lg font-bold text-[#D4A853]">$48.2M</p></div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">ISO 9001 Certified & LBMA Approved</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Global Logistics &{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Shipping</span>
              <br />
              <span className="bg-gradient-to-r from-[#D4A853] to-[#F5DEB3] bg-clip-text text-transparent">Vault Services</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              Enterprise-grade logistics across 190+ countries with secure gold vault storage. Real-time tracking, customs clearance, and insured precious metals custody — all under one roof.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/track" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/25 text-sm">
                Track Shipment <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/vault" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] font-semibold hover:bg-[#D4A853]/20 transition-all text-sm">
                <Vault className="w-4 h-4" /> Vault Services
              </Link>
            </div>

            {/* Trust stats */}
            <div className="grid grid-cols-3 gap-8">
              {[
                { value: "190+", label: "Countries" },
                { value: "50K+", label: "Shipments/Month" },
                { value: "99.8%", label: "On-Time Rate" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 + i * 0.15 }}>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — image + overlay */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.3 }} className="relative hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-600/20 to-[#D4A853]/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <Image src="/images/warehouse.jpg" alt="AramexLogistics Operations" width={600} height={500} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent" />
              </div>
              {/* Bottom overlay stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1 }}
                className="absolute -bottom-6 left-6 right-6 p-5 bg-[#0A1628]/90 backdrop-blur-xl rounded-2xl border border-emerald-900/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <p className="text-xs text-slate-400">Air & Sea Freight</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    <p className="text-xs text-slate-400">Ground Logistics</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Vault className="w-5 h-5 text-[#D4A853]" />
                    <p className="text-xs text-slate-400">Gold Vault</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </section>
  );
};

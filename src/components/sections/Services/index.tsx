"use client";

import { Check, Container, Ship, Plane, Truck, Warehouse, ArrowRight, Vault } from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import Link from "next/link";

export const Service = () => {
  const [sectionRef, sectionInView] = useInView({ triggerOnce: true, threshold: 0.15 });

  const features = [
    "Standard, refrigerated, and specialized containers",
    "Full container (FCL) and less than container (LCL) shipments",
    "Real-time container tracking and monitoring",
    "Temperature-controlled logistics solutions",
    "Customs clearance and documentation support",
  ];

  const services = [
    { icon: Container, label: "Container", active: true },
    { icon: Ship, label: "Ocean", active: false },
    { icon: Plane, label: "Air", active: false },
    { icon: Truck, label: "Ground", active: false },
    { icon: Warehouse, label: "Warehouse", active: false },
    { icon: Vault, label: "Vault", active: false, gold: true },
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#D4A853]/4 rounded-full blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`, backgroundSize: "40px 40px" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={sectionInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Container className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Our Services</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Comprehensive{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Logistics Solutions</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">From container shipping to secure gold vault storage, we deliver end-to-end supply chain excellence.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Image */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={sectionInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8 }} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-600/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
              <Image src="/images/port.jpeg" alt="Container shipping operations" width={600} height={450} className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            </div>
            {/* Service tabs overlay */}
            <div className="absolute -bottom-4 left-4 right-4 p-4 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar">
                {services.map((svc, i) => (
                  <button key={i} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    svc.active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    svc.gold ? "bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/20 hover:bg-[#D4A853]/20" :
                    "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                  }`}>
                    <svc.icon className="w-4 h-4" />{svc.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — Features */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={sectionInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }}>
            <h3 className="text-2xl font-bold text-white mb-3">Container Shipping</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">Industry-leading container logistics with global port coverage. From standard dry containers to specialized reefer units, we handle it all with precision.</p>

            <div className="space-y-4 mb-10">
              {features.map((feat, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={sectionInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300">{feat}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-4">
              <Link href="/quote" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/25">
                Get a Quote <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700/50 text-slate-300 font-medium text-sm hover:bg-slate-800/50 transition-all">
                All Services
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

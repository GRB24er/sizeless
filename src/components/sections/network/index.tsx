"use client";

import { Globe, MapPin, Truck, Clock, Plane } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";

export const GlobalNetwork = () => {
  const { ref: sectionRef, inView: isSectionInView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const features = [
    { icon: MapPin, title: "220+ Countries & Territories", description: "Comprehensive global coverage for all your shipping needs with local expertise" },
    { icon: Globe, title: "Strategic Global Hubs", description: "Optimized routing through key logistics centers for faster delivery times" },
    { icon: Truck, title: "Multi-Modal Transport", description: "Seamless integration of air, sea, and ground freight solutions" },
    { icon: Clock, title: "24/7 Operations", description: "Round-the-clock logistics support ensuring uninterrupted service" },
  ];

  const networkPoints = [
    { top: "25%", left: "15%", delay: 0, label: "Americas" },
    { top: "30%", left: "45%", delay: 0.3, label: "Europe" },
    { top: "35%", left: "75%", delay: 0.6, label: "Asia Pacific" },
    { top: "55%", left: "25%", delay: 0.9, label: "South America" },
    { top: "60%", left: "55%", delay: 1.2, label: "Africa" },
    { top: "65%", left: "82%", delay: 1.5, label: "Oceania" },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#D4A853]/4 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`, backgroundSize: "48px 48px" }} />
      </div>

      <div ref={sectionRef} className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isSectionInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Global Network</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Connecting Businesses{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Worldwide</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Our extensive global network ensures your shipments reach virtually any destination with efficiency and reliability.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Features */}
          <motion.div initial={{ opacity: 0 }} animate={isSectionInView ? { opacity: 1 } : {}} transition={{ duration: 0.5 }} className="space-y-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={isSectionInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group relative p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 hover:bg-slate-800/50">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Map */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={isSectionInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-[#D4A853]/5 rounded-3xl blur-2xl" />
              <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(rgba(5,150,105,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.3) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                  <Image src="/images/map.png" alt="Global shipping network" width={400} height={400} className="w-full h-auto opacity-60" />
                </motion.div>

                {networkPoints.map((point, i) => (
                  <motion.div key={i} className="absolute group cursor-pointer" style={{ top: point.top, left: point.left }}
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: point.delay + 0.5, duration: 0.5 }}>
                    <motion.div className="absolute inset-0 rounded-full bg-emerald-500/40" animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, delay: point.delay }} style={{ width: "16px", height: "16px", margin: "-4px" }} />
                    <div className="relative w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"><div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse" /></div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{point.label}</div>
                  </motion.div>
                ))}

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.path d="M 60 100 Q 180 80 200 120" stroke="rgba(5,150,105,0.3)" strokeWidth="1" fill="none" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1 }} />
                  <motion.path d="M 200 120 Q 280 100 300 140" stroke="rgba(5,150,105,0.3)" strokeWidth="1" fill="none" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1.5 }} />
                </svg>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
                  className="absolute bottom-4 left-4 right-4 p-4 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-emerald-900/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xl font-bold text-emerald-400">50+</p><p className="text-xs text-slate-400">Distribution Hubs</p></div>
                    <div><p className="text-xl font-bold text-[#D4A853]">24/7</p><p className="text-xs text-slate-400">Operations</p></div>
                    <div><p className="text-xl font-bold text-emerald-400">99%</p><p className="text-xs text-slate-400">Uptime</p></div>
                  </div>
                </motion.div>
              </div>

              <motion.div className="absolute -top-4 -right-4 p-3 bg-slate-800/80 backdrop-blur-xl rounded-xl border border-emerald-900/50 shadow-xl"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <Plane className="w-6 h-6 text-emerald-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { TrendingUp, Users, Package, MapPin, Award, Vault } from "lucide-react";
import { useEffect, useState } from "react";

const Counter = ({ end, suffix = "", inView }: { end: number; suffix?: string; inView: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const Achievement = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const stats = [
    { icon: Package, value: 850000, suffix: "+", label: "Shipments Delivered", color: "emerald" },
    { icon: MapPin, value: 190, suffix: "+", label: "Countries Served", color: "emerald" },
    { icon: Users, value: 12000, suffix: "+", label: "Business Clients", color: "emerald" },
    { icon: Vault, value: 48, suffix: "M+", label: "Vault Assets (USD)", color: "gold" },
    { icon: TrendingUp, value: 99, suffix: ".8%", label: "On-Time Delivery", color: "emerald" },
    { icon: Award, value: 26, suffix: "+", label: "Years in Service", color: "gold" },
  ];

  return (
    <section ref={ref} className="relative py-24 bg-[#0A1628] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(5,150,105,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.3) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/20 mb-6">
            <TrendingUp className="w-4 h-4 text-[#D4A853]" />
            <span className="text-sm font-medium text-[#D4A853]">Our Track Record</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Numbers That Speak{" "}
            <span className="bg-gradient-to-r from-[#D4A853] to-[#F5DEB3] bg-clip-text text-transparent">For Themselves</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Decades of excellence in global logistics and secure vault operations.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => {
            const isGold = stat.color === "gold";
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative p-8 rounded-2xl border text-center ${
                  isGold
                    ? "bg-gradient-to-br from-[#D4A853]/10 to-[#D4A853]/5 border-[#D4A853]/20"
                    : "bg-slate-800/30 border-slate-700/50"
                }`}>
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
                  isGold ? "bg-[#D4A853]/15 text-[#D4A853]" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <p className={`text-3xl sm:text-4xl font-bold mb-2 ${isGold ? "text-[#D4A853]" : "text-white"}`}>
                  {stat.label.includes("USD") ? "$" : ""}<Counter end={stat.value} suffix={stat.suffix} inView={inView} />
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

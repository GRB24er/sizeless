"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Receipt, Lock, Ban, MapPin, Vault, FileCheck } from "lucide-react";

export const Commitments = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const commitments = [
    { icon: Receipt, title: "Itemized Quote", desc: "Every charge is listed line by line before you book: freight, insurance, handling, customs brokerage, and estimated duty.", color: "emerald" },
    { icon: Lock, title: "Price Fixed at Booking", desc: "The total you accept is the total you pay. It's stored with your shipment and shown on your receipt.", color: "emerald" },
    { icon: Ban, title: "No Charges After Booking", desc: "We never add hold, release, or clearance fees to a shipment once it's booked.", color: "gold" },
    { icon: MapPin, title: "Logged Handovers", desc: "Each status change is recorded with its time and location on your tracking page, and emailed to you.", color: "emerald" },
    { icon: FileCheck, title: "Published Vault Fees", desc: "Storage, intake, insurance, and withdrawal fees are shown on the deposit form before you submit.", color: "gold" },
    { icon: Vault, title: "Your Holdings Online", desc: "Vault clients can see each deposit's weight, purity, status, and activity history from their dashboard.", color: "gold" },
  ];

  return (
    <section ref={ref} className="relative py-24 bg-[#0A1628] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(5,150,105,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.3) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/20 mb-6">
            <Receipt className="w-4 h-4 text-[#D4A853]" />
            <span className="text-sm font-medium text-[#D4A853]">Our Pricing Commitments</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            You See the Price{" "}
            <span className="bg-gradient-to-r from-[#D4A853] to-[#F5DEB3] bg-clip-text text-transparent">Before You Commit</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">No surprises after booking — for shipments or vault storage.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {commitments.map((item, i) => {
            const isGold = item.color === "gold";
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative p-8 rounded-2xl border ${
                  isGold
                    ? "bg-gradient-to-br from-[#D4A853]/10 to-[#D4A853]/5 border-[#D4A853]/20"
                    : "bg-slate-800/30 border-slate-700/50"
                }`}>
                <div className={`w-14 h-14 rounded-2xl mb-5 flex items-center justify-center ${
                  isGold ? "bg-[#D4A853]/15 text-[#D4A853]" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isGold ? "text-[#D4A853]" : "text-white"}`}>{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

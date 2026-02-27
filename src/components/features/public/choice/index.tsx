"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import { TrendingUp, Users, CheckCircle, Shield, Leaf, Cpu, Zap } from "lucide-react";

interface ProgressMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export const Choice = () => {
  const [contentRef, contentInView] = useInView({ triggerOnce: true, threshold: 0.15 });
  const [progressRef, progressInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [imageRef, imageInView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const } } };
  const fadeInRight = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } } };
  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
  const progressVariants = {
    hidden: { width: "0%", opacity: 0 },
    visible: (value: number) => ({ width: `${value}%`, opacity: 1, transition: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.3 } }),
  };

  const progressMetrics: ProgressMetric[] = [
    { label: "Successful Delivery Rate", value: 96, icon: <TrendingUp size={18} className="text-emerald-400" /> },
    { label: "Customer Satisfaction", value: 98, icon: <Users size={18} className="text-amber-400" /> },
    { label: "On-Time Performance", value: 94, icon: <CheckCircle size={18} className="text-emerald-400" /> },
  ];

  const achievements = [
    { icon: Shield, text: "Certified Logistics Excellence" },
    { icon: Leaf, text: "Carbon-Neutral Operations" },
    { icon: Cpu, text: "Advanced Tracking Technology" },
    { icon: Zap, text: "Express Global Coverage" },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 to-[#0A1628] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(5,150,105,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.3) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <motion.div ref={contentRef} initial="hidden" animate={contentInView ? "visible" : "hidden"} variants={staggerContainer} className="space-y-8">
            <div>
              <motion.span variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Our Excellence Record</span>
              </motion.span>
              <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Setting Industry Standards Through{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">Performance</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-slate-400 leading-relaxed">
                At AramexLogistics, we&apos;re committed to delivering top-tier logistics and vault services with unmatched reliability. Our comprehensive approach combines advanced technology, expert teams, and sustainable practices.
              </motion.p>
            </div>

            <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4">
              {achievements.map((item, index) => (
                <motion.div key={index} variants={fadeInUp} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-emerald-500/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div ref={progressRef} initial="hidden" animate={progressInView ? "visible" : "hidden"} variants={staggerContainer} className="space-y-6 pt-4">
              {progressMetrics.map((metric, index) => (
                <motion.div key={index} variants={fadeInUp} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">{metric.icon}</div>
                      <span className="text-slate-300 font-medium">{metric.label}</span>
                    </div>
                    <span className="text-lg font-bold text-white">{metric.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div custom={metric.value} variants={progressVariants} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 relative">
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right */}
          <motion.div ref={imageRef} initial="hidden" animate={imageInView ? "visible" : "hidden"} variants={fadeInRight} className="relative">
            <div className="relative max-w-lg mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-600/20 to-amber-500/10 rounded-3xl blur-2xl" />
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="relative aspect-square rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <Image src="/images/gold.jpeg" alt="Gold standard logistics" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/80 via-transparent to-transparent" />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.5 }} whileHover={{ scale: 1.05 }} className="absolute -bottom-4 -left-4 p-4 bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Since 1995</p>
                    <p className="text-sm font-semibold text-white">Industry Leader</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }} className="absolute -top-4 -right-4 p-4 bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Eco-Friendly</p>
                    <p className="text-sm font-semibold text-white">Carbon Neutral</p>
                  </div>
                </div>
              </motion.div>

              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-dashed border-slate-700/30 rounded-full pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

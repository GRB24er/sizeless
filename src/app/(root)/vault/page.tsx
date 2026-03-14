"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Vault, Shield, Lock, Eye, Clock, FileCheck, ArrowRight, Mail, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function VaultPage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [featRef, featInView] = useInView({ triggerOnce: true, threshold: 0.15 });
  const [processRef, processInView] = useInView({ triggerOnce: true, threshold: 0.15 });

  const features = [
    { icon: Lock, title: "High-Security Vaults", desc: "State-of-the-art biometric access, 24/7 armed surveillance, and multi-layer security protocols." },
    { icon: Shield, title: "Fully Insured", desc: "Every asset insured up to its full declared value through Lloyd's of London underwriters." },
    { icon: Eye, title: "Independent Audits", desc: "Quarterly third-party audits with full transparency reports available to all depositors." },
    { icon: Clock, title: "Flexible Access", desc: "Schedule withdrawals with 48-hour advance notice. Emergency releases available for verified clients." },
    { icon: FileCheck, title: "LBMA Approved", desc: "Our vault operations meet London Bullion Market Association standards for precious metals custody." },
    { icon: Vault, title: "Climate Controlled", desc: "Precision temperature and humidity control to preserve asset integrity long-term." },
  ];

  const steps = [
    { num: "01", title: "Submit Deposit Request", desc: "Complete our secure deposit form with asset details, weight, purity, and declared value." },
    { num: "02", title: "Verification & Assay", desc: "Our certified team verifies authenticity, weight, and purity. Serial numbers are recorded." },
    { num: "03", title: "Secure Storage", desc: "Assets are catalogued, insured, and placed in your assigned high-security vault unit." },
    { num: "04", title: "Monitor & Release", desc: "Track your assets in real-time. Request release anytime through your secure dashboard." },
  ];

  return (
    <div className="bg-[#0A1628]">
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[70vh] flex items-center overflow-hidden pt-28 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4A853]/6 rounded-full blur-[200px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,168,83,0.4) 1px, transparent 0)`, backgroundSize: "48px 48px" }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/20 mb-8">
                <Vault className="w-4 h-4 text-[#D4A853]" />
                <span className="text-sm font-medium text-[#D4A853]">LBMA Approved Vault Services</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                Secure{" "}
                <span className="bg-gradient-to-r from-[#D4A853] to-[#F5DEB3] bg-clip-text text-transparent">Gold Vault</span>
                <br />Storage
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
                Insured precious metals custody in high-security, climate-controlled vaults. Independent audits, real-time monitoring, and flexible access when you need it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#C09740] text-[#0A1628] font-semibold text-sm hover:from-[#F5DEB3] hover:to-[#D4A853] transition-all shadow-lg shadow-[#D4A853]/25">
                  Open Vault Account <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="mailto:admin@aegiscargo.org" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-700/50 text-slate-300 font-semibold text-sm hover:bg-slate-800/50 transition-all">
                  <Mail className="w-4 h-4" /> Speak to an Advisor
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={heroInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.3 }} className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#D4A853]/15 to-emerald-600/5 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden border border-[#D4A853]/20">
                <Image src="/images/gold.jpeg" alt="Secure gold vault" width={600} height={450} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent" />
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1 }}
                className="absolute -bottom-6 left-6 right-6 p-5 bg-[#0A1628]/90 backdrop-blur-xl rounded-2xl border border-[#D4A853]/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-xl font-bold text-[#D4A853]">$48M+</p><p className="text-xs text-slate-400">Assets Secured</p></div>
                  <div><p className="text-xl font-bold text-[#D4A853]">99.99%</p><p className="text-xs text-slate-400">Security Rating</p></div>
                  <div><p className="text-xl font-bold text-emerald-400">24/7</p><p className="text-xs text-slate-400">Monitoring</p></div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featRef} className="relative py-24 bg-gradient-to-b from-[#0A1628] to-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={featInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Trust <span className="bg-gradient-to-r from-[#D4A853] to-[#F5DEB3] bg-clip-text text-transparent">Our Vaults</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Enterprise-grade security infrastructure built for the most demanding institutional and private clients.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
                className="p-7 rounded-2xl bg-[#D4A853]/5 border border-[#D4A853]/15 hover:border-[#D4A853]/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#D4A853]/15 flex items-center justify-center mb-5 text-[#D4A853]"><f.icon className="w-6 h-6" /></div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section ref={processRef} className="relative py-24 bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={processInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">A transparent, step-by-step process from deposit to secure storage.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={processInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15 }}
                className="relative p-7 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <span className="text-4xl font-bold text-emerald-500/20 absolute top-4 right-6">{s.num}</span>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0A1628]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-[#D4A853]/10 to-[#D4A853]/5 border border-[#D4A853]/20 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A853]/10 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <Vault className="w-12 h-12 text-[#D4A853] mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Start Securing Your Assets Today</h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-8">Join institutional and private clients who trust Aegis Cargo for secure precious metals custody.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#C09740] text-[#0A1628] font-semibold text-sm hover:from-[#F5DEB3] hover:to-[#D4A853] transition-all shadow-lg shadow-[#D4A853]/25">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="mailto:admin@aegiscargo.org" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-[#D4A853]/30 text-[#D4A853] font-semibold text-sm hover:bg-[#D4A853]/10 transition-all">
                  <Mail className="w-4 h-4" /> Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import TrackingForm from "@/components/tracking.form";
import Link from "next/link";
import { Package, Globe, Shield, Clock, MessageCircle, HelpCircle, ChevronDown, Truck, Plane, Ship } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Track every movement with live GPS positioning and instant status notifications across our global network.",
  },
  {
    icon: Globe,
    title: "190+ Countries",
    description: "Seamless tracking across international borders with unified logistics visibility and customs integration.",
  },
  {
    icon: Shield,
    title: "Secure & Verified",
    description: "Enterprise-grade encryption with verified chain of custody at every checkpoint from origin to destination.",
  },
];

const faqs = [
  {
    question: "How quickly does tracking information become available?",
    answer: "Tracking data is synchronized within minutes of pickup. Initial scans typically appear within 15-30 minutes, with full tracking history available as your shipment moves through our global network.",
  },
  {
    question: "What should I do if tracking hasn't updated?",
    answer: "If your shipment shows no movement for 48+ hours, our Priority Support team is available 24/7. Contact us via live chat or call for immediate assistance with escalation protocols.",
  },
  {
    question: "Can I track multiple shipments simultaneously?",
    answer: "Yes. Business accounts support bulk tracking of up to 500 shipments via our dashboard. You can also set up automated webhook notifications for real-time status updates to your systems.",
  },
  {
    question: "What tracking formats are supported?",
    answer: "We support all standard formats including our AML tracking numbers, plus full compatibility with partner carrier formats for cross-carrier visibility.",
  },
];

const shipmentTypes = [
  { icon: Package, label: "Parcel", desc: "Documents & small packages" },
  { icon: Truck, label: "Freight", desc: "LTL & FTL ground shipments" },
  { icon: Plane, label: "Air Cargo", desc: "Express & standard air freight" },
  { icon: Ship, label: "Ocean", desc: "FCL & LCL container shipping" },
];

export default function TrackingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/6 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D4A853]/4 rounded-full blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(5,150,105,0.3) 1px, transparent 0)`, backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-emerald-300 tracking-wide">Live Tracking Active</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Track Your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Shipment</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Real-time location data, predictive delivery estimates, and complete visibility across our global logistics network.
            </p>
          </div>
        </section>

        {/* Tracking Form */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-[#D4A853]/10 to-emerald-600/20 rounded-2xl blur-xl" />
              <div className="relative bg-[#0D1F35]/90 backdrop-blur-xl rounded-2xl border border-emerald-900/30 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-600 via-[#D4A853] to-emerald-600" />
                <div className="p-8 sm:p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Package className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Enter Tracking Number</h2>
                      <p className="text-sm text-slate-400">AWB, tracking ID, or reference number</p>
                    </div>
                  </div>

                  <TrackingForm />

                  <div className="mt-6 pt-6 border-t border-emerald-900/30">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Example format: AML-XXXXXXXX, AWB-XXXXXXXXXX
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shipment Types */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {shipmentTypes.map((type, i) => (
                <div key={i} className="p-5 rounded-xl bg-[#0D1F35]/60 border border-emerald-900/20 hover:border-emerald-500/30 transition-all text-center group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
                    <type.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{type.label}</h3>
                  <p className="text-xs text-slate-500">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-emerald-900/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Enterprise-Grade Tracking</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Advanced logistics visibility powered by cutting-edge technology</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="group relative p-6 rounded-xl bg-[#0D1F35]/60 border border-emerald-900/20 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <div className="relative">
                    <div className="p-3 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-emerald-900/20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-400">Everything you need to know about shipment tracking</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-emerald-900/20 overflow-hidden bg-[#0D1F35]/40 hover:bg-[#0D1F35]/60 transition-colors">
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full px-6 py-5 flex items-center justify-between text-left">
                    <span className="font-medium text-white pr-8">{faq.question}</span>
                    <span className={`flex-shrink-0 p-1.5 rounded-full bg-emerald-500/10 transition-transform duration-200 ${expandedFaq === i ? "rotate-180" : ""}`}>
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${expandedFaq === i ? "max-h-48" : "max-h-0"}`}>
                    <p className="px-6 pb-5 text-slate-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-emerald-900/20">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/15 to-[#D4A853]/10" />
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
              <div className="relative px-8 py-12 sm:px-12 sm:py-16 text-center">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Need Help With Your Shipment?</h3>
                <p className="text-slate-300 mb-8 max-w-xl mx-auto">Our logistics specialists are available 24/7 to assist with tracking, delivery modifications, or any shipping concerns.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/support" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/25">
                    <MessageCircle className="w-5 h-5" /> Live Chat Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

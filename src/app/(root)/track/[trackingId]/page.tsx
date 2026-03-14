import TrackingResult from "@/components/features/tracking.result";
import Link from "next/link";
import { prisma } from "@/constants/config/db";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ trackingId: string }> }): Promise<Metadata> {
  const { trackingId } = await params;
  return {
    title: trackingId ? `Track ${trackingId} | Aegis Cargo` : "Tracking Results | Aegis Cargo",
    description: "Real-time shipment tracking and delivery status updates — Aegis Cargo Global Logistics",
  };
}

async function getTrackingData(trackingNumber: string) {
  try {
    return await prisma.shipment.findUnique({
      where: { trackingNumber },
      select: {
        trackingNumber: true, estimatedDelivery: true, deliveredAt: true, isPaid: true,
        originAddress: true, originCity: true, originState: true, originPostalCode: true, originCountry: true,
        destinationAddress: true, destinationCity: true, destinationState: true, destinationPostalCode: true, destinationCountry: true,
        serviceType: true, specialInstructions: true,
        recipient: { select: { name: true, company: true, email: true, phone: true } },
        Sender: { select: { name: true, email: true } },
        TrackingUpdates: { select: { id: true, timestamp: true, location: true, status: true, message: true }, orderBy: { timestamp: "asc" } },
        packages: { select: { height: true, width: true, length: true, packageType: true, declaredValue: true, weight: true, description: true, pieces: true, dangerous: true, insurance: true } },
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Database query error:", error);
    return null;
  }
}

function TrackingError({ trackingNumber, type }: { trackingNumber?: string; type: "not-found" | "error" | "missing" }) {
  const content = {
    "not-found": {
      icon: <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      title: "Shipment Not Found",
      subtitle: trackingNumber ? `Tracking Number: ${trackingNumber}` : undefined,
      description: "We couldn't locate a shipment with this tracking number. Please verify and try again.",
      suggestions: ["Double-check for typos in your tracking number", "Ensure the shipment has been processed (allow 1-2 hours after pickup)", "Try searching with an alternative reference number"],
    },
    error: {
      icon: <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      title: "Unable to Retrieve Data",
      subtitle: "A temporary error occurred",
      description: "We're experiencing technical difficulties. Our team has been notified.",
      suggestions: ["Wait a few moments and refresh the page", "Clear your browser cache and try again", "Contact support if the issue persists"],
    },
    missing: {
      icon: <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      title: "No Tracking Number Provided",
      subtitle: "Please enter your tracking information",
      description: "Enter your AWB or reference number to get started.",
      suggestions: ["Find your tracking number in your shipping confirmation email", "Check your receipt or shipping label", "Contact the sender for tracking details"],
    },
  };

  const { icon, title, subtitle, description, suggestions } = content[type];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-slate-900 to-[#0A1628]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 mb-8">{icon}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
          {subtitle && <p className="text-lg text-slate-400 mb-6 font-mono tracking-wide">{subtitle}</p>}
          <p className="text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">{description}</p>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-10 text-left max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Suggestions</h3>
            <ul className="space-y-3">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/track" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/25">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Try Another Number
            </Link>
            <Link href="/support" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:bg-slate-700 transition-all">
              Contact Support
            </Link>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800/50">
            <p className="text-sm text-slate-500 mb-2">Need immediate assistance?</p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <a href="tel:+440201412251" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                +44 020 1412 251
              </a>
              <span className="text-slate-700">|</span>
              <a href="mailto:admin@aegiscargo.org" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                admin@aegiscargo.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function TrackingResultsPage({ params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params;
  if (!trackingId) return <TrackingError type="missing" />;

  const sanitizedTrackingNumber = trackingId.trim().toUpperCase();
  const trackingData = await getTrackingData(sanitizedTrackingNumber);
  if (!trackingData) return <TrackingError type="not-found" trackingNumber={sanitizedTrackingNumber} />;

  try {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-slate-900 to-[#0A1628]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[130px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`, backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative z-10">
          <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/track" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Tracking
                  </Link>
                  <span className="text-slate-700">|</span>
                  <span className="text-sm font-mono text-emerald-400">{sanitizedTrackingNumber}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TrackingResult data={trackingData} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering tracking result:", error);
    return <TrackingError type="error" trackingNumber={sanitizedTrackingNumber} />;
  }
}

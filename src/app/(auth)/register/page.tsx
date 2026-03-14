import { AnimatePresence } from "motion/react";
import { Package, Shield, Vault } from "lucide-react";
import Image from "next/image";
import { RegistrationForm } from "@/components/features/auth/registration.form";
import { MotionDiv } from "@/components/motion.div";
import { auth } from "~/auth";
import { redirect } from "next/navigation";

const RegisterPage = async () => {
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Left Column — Brand Panel */}
        <MotionDiv
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#0F1D2F] via-[#132640] to-[#0F1D2F] p-8 text-white flex-col justify-between hidden md:flex relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(140,158,175,0.5) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }} />

          <div className="relative z-10">
            <div className="mb-8">
              <Image src="/images/logo.png" alt="Aegis Cargo" width={160} height={55} className="mb-8" />
              <h2 className="text-2xl font-bold mb-4">Join Our Network</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Create an account to start shipping with the most reliable
                logistics partner worldwide. Access vault storage and premium services.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-[#1E3A5F]/20 flex items-center justify-center flex-shrink-0">
                  <Package className="text-[#8C9EAF] w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Global Shipping Network</h3>
                  <p className="text-xs text-gray-400">Access to 190+ countries and territories worldwide</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-[#1E3A5F]/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="text-[#8C9EAF] w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Real-Time Tracking</h3>
                  <p className="text-xs text-gray-400">Monitor your shipments with precision and ease</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-[#8C9EAF]/20 flex items-center justify-center flex-shrink-0">
                  <Vault className="text-[#8C9EAF] w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Secure Vault Storage</h3>
                  <p className="text-xs text-gray-400">Insured gold and precious metals custody</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-gray-500 pt-6 border-t border-white/10">
            <p>&copy; {new Date().getFullYear()} Aegis Cargo. All rights reserved.</p>
          </div>
        </MotionDiv>

        {/* Right Column — Registration Form */}
        <div className="p-8 sm:p-10">
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-500 text-sm">Fill in the form below to join our platform</p>
          </MotionDiv>

          <AnimatePresence mode="wait">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegistrationForm />
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

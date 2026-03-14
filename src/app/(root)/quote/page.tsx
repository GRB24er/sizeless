"use client";

import { useState } from "react";
import { Send, CheckCircle, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";

const quoteSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(5, { message: "Please enter a valid phone number" }),
  shipmentType: z.enum([
    "Standard Parcel",
    "Express Parcel",
    "Freight (LTL)",
    "Freight (FTL)",
    "Air Freight",
    "Ocean Freight",
    "Vault Storage",
  ]),
  origin: z.string().min(2, { message: "Please enter the origin location" }),
  destination: z
    .string()
    .min(2, { message: "Please enter the destination location" }),
  weight: z.string().min(1, { message: "Please enter the estimated weight" }),
  description: z.string().optional(),
});

type QuoteFormType = z.infer<typeof quoteSchema>;

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export default function QuotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [formRef, formInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const form = useForm<QuoteFormType>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      shipmentType: "Standard Parcel",
      origin: "",
      destination: "",
      weight: "",
      description: "",
    },
  });

  const onSubmit = async (_values: QuoteFormType) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      form.reset();
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error("Submission error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#0F1D2F] to-[#0A1628] overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#1E3A5F]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8C9EAF]/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(140,158,175,0.4) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Hero */}
        <motion.div
          ref={heroRef}
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A5F]/20 border border-[#1E3A5F]/30 mb-6">
              <Package className="w-4 h-4 text-[#B3C7DB]" />
              <span className="text-sm font-medium text-[#B3C7DB]">
                Free Estimate
              </span>
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Get a{" "}
            <span className="bg-gradient-to-r from-[#B3C7DB] to-[#8C9EAF] bg-clip-text text-transparent">
              Quote
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Tell us about your shipment and we will provide a competitive rate
            tailored to your needs. Our team typically responds within 24 hours.
          </motion.p>
        </motion.div>

        {/* Quote Form */}
        <motion.div
          ref={formRef}
          initial="hidden"
          animate={formInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="max-w-3xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A5F]/20 via-[#8C9EAF]/20 to-[#1E3A5F]/20 rounded-3xl blur-xl" />
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 sm:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Shipment Details
                </h2>
                <p className="text-slate-400">
                  Fill in the details below and we will get back to you with a
                  quote.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Email + Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              {...field}
                              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+xx xxx xxx xxxx"
                              {...field}
                              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Shipment Type */}
                  <FormField
                    control={form.control}
                    name="shipmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Shipment Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20">
                              <SelectValue placeholder="Select shipment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {[
                              "Standard Parcel",
                              "Express Parcel",
                              "Freight (LTL)",
                              "Freight (FTL)",
                              "Air Freight",
                              "Ocean Freight",
                              "Vault Storage",
                            ].map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                className="text-slate-300 focus:bg-slate-700 focus:text-white"
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Origin + Destination */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Origin
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, Country"
                              {...field}
                              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Destination
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, Country"
                              {...field}
                              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Weight */}
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Estimated Weight (kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 25"
                            {...field}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Additional Details (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your shipment, any special handling requirements, preferred timeline, etc."
                            className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Success message */}
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <p className="text-emerald-300">
                        Your quote request has been submitted. We will contact
                        you within 24 hours.
                      </p>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#1E3A5F] to-[#162D4A] hover:from-[#254B78] hover:to-[#1E3A5F] text-white font-semibold py-6 shadow-lg shadow-[#1E3A5F]/25"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Request Quote
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </motion.div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
          {[
            {
              title: "Fast Response",
              desc: "Get your quote within 24 hours of submission.",
            },
            {
              title: "Competitive Rates",
              desc: "We offer market-leading prices for all shipment types.",
            },
            {
              title: "No Obligation",
              desc: "Our quotes are free with no commitment required.",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="bg-slate-800/30 border-slate-700/50"
            >
              <CardContent className="p-6 text-center">
                <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

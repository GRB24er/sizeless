"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Clock,
  Globe,
} from "lucide-react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  subject: z
    .string()
    .min(3, { message: "Subject must be at least 3 characters" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormType = z.infer<typeof contactSchema>;

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

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: [
      "Strada Bulevardul Unirii 72",
      "Floor 3, Office 12",
      "030833 Bucharest, Romania",
    ],
    action: null,
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["admin@aegiscargo.org"],
    action: "mailto:admin@aegiscargo.org",
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+44 020 1412 251"],
    action: "tel:+440201412251",
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: ["Mon - Fri: 9:00 AM - 6:00 PM", "Sat: 10:00 AM - 2:00 PM"],
    action: null,
  },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [infoRef, infoInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [formRef, formInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const form = useForm<ContactFormType>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (_values: ContactFormType) => {
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
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#1E3A5F]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#8C9EAF]/5 rounded-full blur-[120px]" />
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
              <Globe className="w-4 h-4 text-[#B3C7DB]" />
              <span className="text-sm font-medium text-[#B3C7DB]">
                Get In Touch
              </span>
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Contact{" "}
            <span className="bg-gradient-to-r from-[#B3C7DB] to-[#8C9EAF] bg-clip-text text-transparent">
              Us
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Have questions about our shipping or vault services? Our team is here
            to help. Reach out and we will respond promptly.
          </motion.p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          ref={infoRef}
          initial="hidden"
          animate={infoInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {contactInfo.map((item) => {
            const Wrapper = item.action ? "a" : "div";
            const wrapperProps = item.action
              ? { href: item.action }
              : {};
            return (
              <motion.div key={item.title} variants={fadeInUp}>
                <Wrapper {...wrapperProps}>
                  <Card className="group h-full bg-slate-800/30 border-slate-700/50 hover:border-[#1E3A5F]/40 transition-all duration-300 hover:bg-slate-800/50 cursor-default">
                    <CardContent className="p-6">
                      <div className="p-3 rounded-xl bg-[#1E3A5F]/15 border border-[#1E3A5F]/25 w-fit mb-4 group-hover:bg-[#1E3A5F]/25 transition-colors">
                        <item.icon className="w-6 h-6 text-[#B3C7DB]" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.title}
                      </h3>
                      {item.lines.map((line, i) => (
                        <p key={i} className="text-sm text-slate-400">
                          {line}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                </Wrapper>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contact Form */}
        <motion.div
          ref={formRef}
          initial="hidden"
          animate={formInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="max-w-2xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A5F]/20 via-[#8C9EAF]/20 to-[#1E3A5F]/20 rounded-3xl blur-xl" />
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 sm:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Send Us a Message
                </h2>
                <p className="text-slate-400">
                  Fill out the form below and our team will get back to you
                  within 24 hours.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Subject
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What is this regarding?"
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
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Message
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us how we can help you..."
                            className="min-h-[140px] bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <p className="text-emerald-300">
                        Your message has been sent successfully. We will be in
                        touch soon.
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
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

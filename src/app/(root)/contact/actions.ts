"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { COMPANY } from "@/lib/company";
import { CONTACT_TOPICS } from "./topics";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120, "Keep your name under 120 characters."),
  email: z.string().trim().email("Enter a valid email address so we can reply.").max(200),
  topic: z.enum(CONTACT_TOPICS, { errorMap: () => ({ message: "Choose a topic." }) }),
  reference: z.string().trim().max(60, "Keep the reference under 60 characters.").optional(),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(5000, "Keep your message under 5,000 characters."),
  // Honeypot: hidden from people, so only bots fill it in.
  website: z.string().optional(),
});

export type ContactField = "name" | "email" | "topic" | "reference" | "message";
export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message?: string; fieldErrors?: Partial<Record<ContactField, string>> };

// Five messages an hour per connection, so the form can't be used to flood the inbox.
const limiter = new RateLimiterMemory({ points: 5, duration: 60 * 60 });

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ContactField;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", fieldErrors };
  }

  const { name, email, topic, reference, message, website } = parsed.data;
  if (website) return { status: "sent" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    await limiter.consume(ip);
  } catch {
    return { status: "error", message: `You've sent several messages in the last hour. Please email ${COMPANY.email} instead.` };
  }

  try {
    // Imported here so rendering the page never opens an SMTP connection.
    const { default: transporter, FROM_EMAIL } = await import("@/lib/verify-mail");
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: COMPANY.email,
      replyTo: { name, address: email },
      subject: `Website enquiry: ${topic}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Topic: ${topic}`,
        `Reference: ${reference || "none given"}`,
        "",
        message,
        "",
        "Sent from the contact form on the website. Reply to this email to answer the sender.",
      ].join("\n"),
    });
    return { status: "sent" };
  } catch (error) {
    console.error("Contact form email failed:", error);
    return { status: "error", message: `We couldn't send your message just now. Please email ${COMPANY.email} directly.` };
  }
}

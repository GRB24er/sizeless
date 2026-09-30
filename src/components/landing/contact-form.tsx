"use client";

import { ReactNode, useActionState, useId, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { sendContactMessage, type ContactField, type ContactState } from "@/app/(root)/contact/actions";
import { CONTACT_TOPICS } from "@/app/(root)/contact/topics";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";
import { Arrow, buttonClass } from "./primitives";

const FIELD =
  "w-full min-w-0 rounded-md border bg-white px-3.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus:outline-none focus:ring-[3px]";
const FIELD_OK = "border-line-2 focus:border-ink focus:ring-signal/15";
const FIELD_BAD = "border-[#B42318] focus:ring-[#B42318]/15";

function Field({
  id,
  label,
  optional,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[13px] text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}

const EMPTY = { name: "", email: "", topic: CONTACT_TOPICS[0] as string, reference: "", message: "" };

/** Sends a message to the company inbox through the sendContactMessage server action. */
export function ContactForm({ defaultTopic }: { defaultTopic?: (typeof CONTACT_TOPICS)[number] }) {
  const id = useId();
  const [values, setValues] = useState({ ...EMPTY, topic: defaultTopic ?? EMPTY.topic });
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, { status: "idle" });
  const errors: Partial<Record<ContactField, string>> = state.status === "error" ? state.fieldErrors ?? {} : {};

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const aria = (key: ContactField) => (errors[key] ? { "aria-invalid": true, "aria-describedby": `${id}-${key}-error` } : {});

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <CheckCircle2 aria-hidden strokeWidth={1.5} className="size-7 text-[#1F7A4D]" />
        <h3 className="mt-4 text-xl font-semibold text-ink">Message sent</h3>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          Thank you, {values.name.trim().split(/\s+/)[0]}. Your message is with the team, and the reply will go to{" "}
          <span className="font-medium text-ink">{values.email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative grid gap-5 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-8">
      <Field id={`${id}-name`} label="Your name" error={errors.name}>
        <input id={`${id}-name`} name="name" autoComplete="name" value={values.name} onChange={set("name")} className={cn(FIELD, "h-11", errors.name ? FIELD_BAD : FIELD_OK)} {...aria("name")} />
      </Field>
      <Field id={`${id}-email`} label="Email" error={errors.email}>
        <input id={`${id}-email`} name="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} className={cn(FIELD, "h-11", errors.email ? FIELD_BAD : FIELD_OK)} {...aria("email")} />
      </Field>
      <Field id={`${id}-topic`} label="Topic" error={errors.topic}>
        <div className="relative">
          <select id={`${id}-topic`} name="topic" value={values.topic} onChange={set("topic")} className={cn(FIELD, "h-11 appearance-none pr-9", errors.topic ? FIELD_BAD : FIELD_OK)} {...aria("topic")}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <ChevronDown aria-hidden strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        </div>
      </Field>
      <Field id={`${id}-reference`} label="Tracking or deposit number" optional error={errors.reference}>
        <input id={`${id}-reference`} name="reference" autoComplete="off" spellCheck={false} placeholder="LOX-7K2M9QXA" value={values.reference} onChange={set("reference")} className={cn(FIELD, "figures h-11 uppercase", errors.reference ? FIELD_BAD : FIELD_OK)} {...aria("reference")} />
      </Field>
      <Field id={`${id}-message`} label="Message" error={errors.message} className="sm:col-span-2">
        <textarea id={`${id}-message`} name="message" rows={6} value={values.message} onChange={set("message")} className={cn(FIELD, "resize-y py-3 leading-relaxed", errors.message ? FIELD_BAD : FIELD_OK)} {...aria("message")} />
      </Field>

      {/* Honeypot, hidden from people and assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] top-0">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-ink-3">Your message goes to {COMPANY.email}.</p>
        <button type="submit" disabled={pending} className={buttonClass("primary", "md", "shrink-0")}>
          {pending ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" /> Sending
            </>
          ) : (
            <>
              Send message <Arrow />
            </>
          )}
        </button>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-md border border-[#B42318]/25 bg-[#B42318]/[0.06] px-4 py-3 text-sm text-[#B42318] sm:col-span-2">
          {state.message}
        </p>
      )}
    </form>
  );
}

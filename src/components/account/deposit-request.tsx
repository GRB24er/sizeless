"use client";

import { ReactNode, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { requestVaultDeposit } from "@/app/(root)/(protected)/vault/actions";
import { ASSET_TYPE_LABELS, PURITY_OPTIONS, STORAGE_TYPE_CONFIG, VAULT_PUBLISHED_FEES, calculateMonthlyStorageFee } from "@/lib/vault/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Amount, Arrow, buttonClass, usdCents } from "@/components/landing/primitives";

const FIELD =
  "w-full min-w-0 rounded-md border border-line-2 bg-white px-3 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-signal/15";
const FEE_GROUPS = Array.from(new Set(VAULT_PUBLISHED_FEES.map((f) => f.group)));

function Field({ id, label, optional, className, children }: { id: string; label: string; optional?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}

function Select({ id, name, children, required }: { id: string; name: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="relative">
      <select id={id} name={name} required={required} defaultValue="" className={cn(FIELD, "h-11 appearance-none pr-9")}>
        {children}
      </select>
      <ChevronDown aria-hidden strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

/** "Request a deposit" button and form. The published fee schedule is shown and must be accepted before submitting. */
export function DepositRequest({ label = "Request a deposit", variant = "primary" }: { label?: string; variant?: "primary" | "outline" }) {
  const id = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [grams, setGrams] = useState("");
  const [error, setError] = useState<string | null>(null);
  const weight = parseFloat(grams) || 0;

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await requestVaultDeposit(formData);
      if ("success" in result && result.success) {
        toast.success(`Deposit request ${result.depositNumber} sent. We'll be in touch about the handover.`);
        setOpen(false);
        setGrams("");
        router.refresh();
      } else {
        setError(("error" in result && result.error) || "Your request couldn't be sent. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonClass(variant, "sm")}>{label}</DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-xl border-line bg-surface p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-line px-6 pb-4 pt-6 text-left">
          <DialogTitle className="type-display text-xl font-semibold text-ink">Request a vault deposit</DialogTitle>
          <DialogDescription className="text-sm text-ink-3">
            Tell us what you&apos;d like to store. We&apos;ll arrange the handover, then weigh and test it on arrival.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="grid gap-4 px-6 py-6 sm:grid-cols-2">
          <Field id={`${id}-type`} label="What you're depositing" className="sm:col-span-2">
            <Select id={`${id}-type`} name="assetType" required>
              <option value="" disabled>
                Choose a type
              </option>
              {Object.entries(ASSET_TYPE_LABELS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-desc`} label="Description" className="sm:col-span-2">
            <textarea
              id={`${id}-desc`}
              name="description"
              required
              rows={3}
              placeholder="For example: one 1 kg bar, refiner and bar number as stamped"
              className={cn(FIELD, "resize-y py-2.5 leading-relaxed")}
            />
          </Field>
          <Field id={`${id}-weight`} label="Total weight (grams)">
            <input id={`${id}-weight`} name="weightGrams" inputMode="decimal" required value={grams} onChange={(e) => setGrams(e.target.value)} className={cn(FIELD, "figures h-11")} />
          </Field>
          <Field id={`${id}-qty`} label="Number of items">
            <input id={`${id}-qty`} name="quantity" inputMode="numeric" defaultValue={1} required className={cn(FIELD, "figures h-11")} />
          </Field>
          <Field id={`${id}-purity`} label="Purity" optional>
            <Select id={`${id}-purity`} name="purity">
              <option value="">Not sure</option>
              {PURITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label.replace(/\s*[–—]\s*/g, ", ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-value`} label="Declared value (USD)">
            <input id={`${id}-value`} name="declaredValue" inputMode="decimal" required className={cn(FIELD, "figures h-11")} />
          </Field>
          <Field id={`${id}-serials`} label="Serial numbers" optional className="sm:col-span-2">
            <input id={`${id}-serials`} name="serialNumbers" placeholder="Separate several with commas" className={cn(FIELD, "figures h-11")} />
          </Field>

          <div className="rounded-lg border border-line bg-canvas p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-ink">Fee schedule</p>
            {weight > 0 && (
              <div className="mt-3 text-[13px]">
                <p className="text-ink-3">Monthly storage for {new Intl.NumberFormat("en-US").format(weight)} g</p>
                {Object.entries(STORAGE_TYPE_CONFIG).map(([key, cfg]) => (
                  <p key={key} className="mt-1 flex justify-between gap-4">
                    <span className="text-ink-2">{cfg.label}</span>
                    <span className="figures text-ink">{usdCents(calculateMonthlyStorageFee(weight, key))}</span>
                  </p>
                ))}
              </div>
            )}
            {FEE_GROUPS.map((group) => (
              <div key={group} className="mt-3 text-[13px]">
                <p className="font-medium text-ink">{group}</p>
                {VAULT_PUBLISHED_FEES.filter((f) => f.group === group).map((f) => (
                  <p key={f.label} className="mt-1 flex justify-between gap-4">
                    <span className="text-ink-2">{f.label}</span>
                    <Amount text={f.price} className="text-right" />
                  </p>
                ))}
              </div>
            ))}
            <p className="mt-3 text-[13px] text-ink-3">These are the only fees we charge. Nothing outside this list is added to your account.</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-ink">
              <input type="checkbox" name="feesAccepted" value="true" required className="mt-0.5 size-4 accent-signal" />
              I have read and accept this fee schedule.
            </label>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-[#B42318]/25 bg-[#B42318]/[0.06] px-4 py-3 text-sm text-[#B42318] sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("outline", "md")}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
              {pending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" /> Sending
                </>
              ) : (
                <>
                  Send request <Arrow />
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

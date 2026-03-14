"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Shield,
  Clock,
  AlertTriangle,
  Info,
  Lock,
  Package,
  Truck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { shipmentSchema, ShipmentFormValues } from "@/store/schema";
import { createShipment } from "./actions";
import {
  SHIPPING_OPTIONS,
  PACKAGE_TYPES,
  PURITY_OPTIONS,
  FEE_SCHEDULE,
} from "./type";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function CreateShipmentPage() {
  const router = useRouter();
  const { status } = useSession();

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      originAddress: "",
      originCity: "",
      originState: "",
      originPostalCode: "",
      originCountry: "",
      destinationAddress: "",
      destinationCity: "",
      destinationState: "",
      destinationPostalCode: "",
      destinationCountry: "",
      serviceType: "armored_express",
      packages: [
        {
          packageType: "gold_bar",
          weight: 0,
          length: 0,
          width: 0,
          height: 0,
          declaredValue: 0,
          description: "",
          pieces: 1,
          dangerous: false,
          insurance: true,
        },
      ],
      recipient: {
        company: "",
        email: "",
        name: "",
        phone: "",
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "packages",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 pt-28">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const onSubmit = async (data: ShipmentFormValues) => {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "packages") {
          if (key === "recipient") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      data.packages.forEach((pkg, index) => {
        Object.entries(pkg).forEach(([field, value]) => {
          formData.append(`packages[${index}].${field}`, String(value));
        });
      });

      const result = await createShipment(formData);
      if (result.error) {
        toast.error(result.error);
        console.error("Validation issues:", result.issues);
      } else {
        toast.success("Shipment created successfully!");
        router.push("/shipments/history");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    }
  };

  // ═══════════════════════════════════════════════════
  // REALISTIC GOLD CONSIGNMENT COST CALCULATION
  // ═══════════════════════════════════════════════════
  const calculateSummary = () => {
    const packages = form.watch("packages");
    const serviceType = form.watch("serviceType");

    const selectedShipping = SHIPPING_OPTIONS.find(
      (option) => option.id === serviceType
    );

    if (!selectedShipping) {
      return {
        packages: [],
        shippingOption: SHIPPING_OPTIONS[0],
        baseFreight: 0,
        weightSurcharge: 0,
        insurancePremium: 0,
        securitySurcharge: 0,
        vaultHandling: 0,
        customsBrokerage: 0,
        exportPermit: 0,
        customsDuty: 0,
        tamperSeals: 0,
        subtotal: 0,
        totalDeclaredValue: 0,
        totalWeight: 0,
        totalPieces: 0,
      };
    }

    const totalWeight = packages.reduce((s, p) => s + (p.weight || 0), 0);
    const totalDeclaredValue = packages.reduce(
      (s, p) => s + (p.declaredValue || 0),
      0
    );
    const totalPieces = packages.reduce((s, p) => s + (p.pieces || 0), 0);
    const hasInsurance = packages.some((p) => p.insurance);

    // ── Base freight (flat + per-kg) ──
    const baseFreight = selectedShipping.price;
    const weightSurcharge = totalWeight * selectedShipping.perKgRate;

    // ── Insurance: % of declared value, minimum $500 ──
    let insurancePremium = 0;
    if (hasInsurance && totalDeclaredValue > 0) {
      insurancePremium = Math.max(
        totalDeclaredValue * (selectedShipping.insuranceRate / 100),
        FEE_SCHEDULE.minInsuranceValue
      );
    }

    // ── Security surcharge (only for armored/secure tiers) ──
    const securitySurcharge =
      selectedShipping.id === "armored_express" ||
      selectedShipping.id === "secure_freight"
        ? FEE_SCHEDULE.securitySurcharge
        : 0;

    // ── Vault handling ──
    const vaultHandling = FEE_SCHEDULE.vaultHandlingFee;

    // ── Customs brokerage ──
    const customsBrokerage = FEE_SCHEDULE.customsBrokerageFee;

    // ── Export permit ──
    const exportPermit = FEE_SCHEDULE.exportPermitFee;

    // ── Customs duty: 5% of declared value ──
    const customsDuty = totalDeclaredValue * FEE_SCHEDULE.customsDutyRate;

    // ── Tamper seals per package ──
    const tamperSeals = packages.length * FEE_SCHEDULE.tamperSealFee;

    // ── Heavy cargo surcharge ──
    let heavyCargo = 0;
    if (totalWeight > FEE_SCHEDULE.heavyCargoSurchargeKg) {
      heavyCargo = totalDeclaredValue * FEE_SCHEDULE.heavyCargoRate;
    }

    const subtotal =
      baseFreight +
      weightSurcharge +
      insurancePremium +
      securitySurcharge +
      vaultHandling +
      customsBrokerage +
      exportPermit +
      customsDuty +
      tamperSeals +
      heavyCargo;

    const packageSummary = packages.map((pkg, index) => ({
      number: index + 1,
      weight: pkg.weight > 0 ? `${pkg.weight} kg` : "—",
      dimensions:
        pkg.length > 0 && pkg.width > 0 && pkg.height > 0
          ? `${pkg.length} × ${pkg.width} × ${pkg.height} cm`
          : "—",
      declaredValue: pkg.declaredValue > 0 ? formatCurrency(pkg.declaredValue) : "—",
      type: PACKAGE_TYPES.find((t) => t.value === pkg.packageType)?.label || pkg.packageType,
    }));

    return {
      packages: packageSummary,
      shippingOption: selectedShipping,
      baseFreight,
      weightSurcharge,
      insurancePremium,
      securitySurcharge,
      vaultHandling,
      customsBrokerage,
      exportPermit,
      customsDuty,
      tamperSeals,
      heavyCargo,
      subtotal,
      totalDeclaredValue,
      totalWeight,
      totalPieces,
    };
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── HERO HEADER ─── */}
      {/* pt-28 prevents overlap with the fixed navbar */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#122041] to-[#0a1628] pt-28 pb-10 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-2">
                Precious Metals Logistics
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Create Shipment
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Secure vault-to-vault transfer with full chain-of-custody
                documentation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-white text-xs font-medium">
                  LBMA Approved
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <span className="text-white text-xs font-medium">
                  ISO 9001 Certified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FORM CONTENT ─── */}
      <div className="container mx-auto max-w-7xl px-4 -mt-4 pb-12">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) =>
              console.error("Validation Errors", errors)
            )}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ═══ LEFT COLUMN ═══ */}
              <div className="lg:col-span-2 space-y-6">
                {/* ── ORIGIN INFORMATION ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Package className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Origin / Shipper
                      </h2>
                      <p className="text-xs text-gray-500">
                        Vault or facility dispatching the consignment
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="originCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. United Kingdom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Vault / facility address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="originCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* ── RECIPIENT INFORMATION ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Recipient / Consignee
                      </h2>
                      <p className="text-xs text-gray-500">
                        Destination vault, refinery, or authorized receiver
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="recipient.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Authorized receiver name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recipient.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="recipient.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (with country code)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recipient.company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company / Refinery</FormLabel>
                          <FormControl>
                            <Input placeholder="Company or vault name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="destinationAddress"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinationCountry"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Destination country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="destinationCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* ── ADD PACKAGE BUTTON ── */}
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    onClick={() =>
                      append({
                        packageType: "gold_bar",
                        weight: 0,
                        length: 0,
                        width: 0,
                        height: 0,
                        declaredValue: 0,
                        description: "",
                        pieces: 1,
                        dangerous: false,
                        insurance: true,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Consignment Package
                  </Button>
                </div>

                {/* ── PACKAGE DETAILS ── */}
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Package #{index + 1}
                          </h2>
                          <p className="text-xs text-gray-500">
                            Precious metals consignment details
                          </p>
                        </div>
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Package Type & Purity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <FormField
                        control={form.control}
                        name={`packages.${index}.packageType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commodity Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select commodity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PACKAGE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`packages.${index}.pieces`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Pieces / Units</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 5 bars"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Total individual items in this package
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Weight & Dimensions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      <FormField
                        control={form.control}
                        name={`packages.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gross Weight (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Including packaging
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`packages.${index}.length`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`packages.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`packages.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Declared Value & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <FormField
                        control={form.control}
                        name={`packages.${index}.declaredValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Declared Value (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Market value of contents"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Based on current spot price. Required for insurance
                              & customs.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`packages.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contents Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. 5x LBMA Good Delivery gold bars, 999.9 fine, ~12.4 kg each, serial numbers attached"
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col sm:flex-row gap-6">
                      <FormField
                        control={form.control}
                        name={`packages.${index}.insurance`}
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                Full-Value Insurance
                              </FormLabel>
                              <FormDescription>
                                {summary.shippingOption.insuranceRate}% of
                                declared value (min{" "}
                                {formatCurrency(FEE_SCHEDULE.minInsuranceValue)})
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`packages.${index}.dangerous`}
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                Hazardous / Restricted
                              </FormLabel>
                              <FormDescription>
                                Contains materials requiring special handling
                                documentation
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                {/* ── SHIPPING OPTIONS ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Transport & Security Tier
                      </h2>
                      <p className="text-xs text-gray-500">
                        Select the appropriate security level for your
                        consignment
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            {SHIPPING_OPTIONS.map((option) => (
                              <div
                                key={option.id}
                                className={`relative flex items-start justify-between space-x-3 rounded-xl border-2 p-4 transition-colors cursor-pointer ${
                                  field.value === option.id
                                    ? "border-emerald-500 bg-emerald-50/30"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => field.onChange(option.id)}
                              >
                                <div className="flex items-start space-x-3">
                                  <RadioGroupItem
                                    value={option.id}
                                    id={option.id}
                                    className="mt-1"
                                  />
                                  <div className="grid gap-1.5">
                                    <Label
                                      htmlFor={option.id}
                                      className="font-semibold text-gray-900 cursor-pointer"
                                    >
                                      {option.label}
                                    </Label>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                      {option.description}
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-1">
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                        <Clock className="h-3 w-3" />
                                        {option.transitDays}
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <Shield className="h-3 w-3" />
                                        {option.securityLevel} Security
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        +{formatCurrency(option.perKgRate)}/kg
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(option.price)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    base rate
                                  </p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── SPECIAL INSTRUCTIONS ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                      <Info className="h-4 w-4 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Special Instructions
                    </h2>
                  </div>

                  <Textarea
                    placeholder="e.g. Require independent assay verification on arrival. Contact vault manager John Smith at +44 xxx upon delivery. Temperature-controlled storage required."
                    className="resize-none h-24"
                  />

                  {/* Compliance notice */}
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        All precious metals shipments are subject to export
                        licensing, customs inspection, and chain-of-custody
                        verification. Shipments above $100,000 USD require
                        enhanced due diligence documentation. Allow 1–2 business
                        days for compliance clearance before dispatch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ RIGHT COLUMN — ORDER SUMMARY ═══ */}
              <div className="space-y-6">
                <Card className="sticky top-24 shadow-sm border border-gray-100">
                  <CardHeader className="bg-gradient-to-r from-[#0a1628] to-[#122041] rounded-t-xl">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-400" />
                      Cost Estimate
                    </CardTitle>
                    <p className="text-gray-400 text-xs mt-1">
                      Based on current rates for precious metals transport
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-5">
                    {/* Package summaries */}
                    {summary.packages.map((pkg, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-[10px] font-bold">
                            {pkg.number}
                          </span>
                          <h3 className="font-medium text-sm text-gray-900">
                            {pkg.type}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 text-xs pl-7">
                          <span className="text-gray-500">Weight</span>
                          <span className="text-right">{pkg.weight}</span>
                        </div>
                        <div className="grid grid-cols-2 text-xs pl-7">
                          <span className="text-gray-500">Dimensions</span>
                          <span className="text-right">{pkg.dimensions}</span>
                        </div>
                        <div className="grid grid-cols-2 text-xs pl-7">
                          <span className="text-gray-500">Declared Value</span>
                          <span className="text-right font-medium">
                            {pkg.declaredValue}
                          </span>
                        </div>
                        {index < summary.packages.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}

                    <Separator />

                    {/* Shipping method */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">Transport Tier</span>
                        <span className="text-right font-medium text-sm">
                          {summary.shippingOption.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">Est. Transit</span>
                        <span className="text-right text-blue-600 font-medium">
                          {summary.shippingOption.transitDays}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Detailed cost breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Freight & Handling
                      </p>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">Base Freight</span>
                        <span className="text-right">
                          {formatCurrency(summary.baseFreight)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">
                          Weight Surcharge ({summary.totalWeight} kg)
                        </span>
                        <span className="text-right">
                          {formatCurrency(summary.weightSurcharge)}
                        </span>
                      </div>
                      {summary.securitySurcharge > 0 && (
                        <div className="grid grid-cols-2 text-xs">
                          <span className="text-gray-500">
                            Armed Security Escort
                          </span>
                          <span className="text-right">
                            {formatCurrency(summary.securitySurcharge)}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">
                          Vault Handling
                        </span>
                        <span className="text-right">
                          {formatCurrency(summary.vaultHandling)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">
                          Tamper-Evident Seals (×{form.watch("packages").length})
                        </span>
                        <span className="text-right">
                          {formatCurrency(summary.tamperSeals)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Customs & Compliance
                      </p>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">Export Permit</span>
                        <span className="text-right">
                          {formatCurrency(summary.exportPermit)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">
                          Customs Brokerage
                        </span>
                        <span className="text-right">
                          {formatCurrency(summary.customsBrokerage)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">
                          Import Duty (5%)
                        </span>
                        <span className="text-right">
                          {formatCurrency(summary.customsDuty)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Insurance
                      </p>
                      <div className="grid grid-cols-2 text-xs">
                        <span className="text-gray-500">
                          Full-Value Coverage (
                          {summary.shippingOption.insuranceRate}%)
                        </span>
                        <span className="text-right">
                          {formatCurrency(summary.insurancePremium)}
                        </span>
                      </div>
                      {summary.totalDeclaredValue > 0 && (
                        <p className="text-[10px] text-gray-400 pl-0">
                          Insuring{" "}
                          {formatCurrency(summary.totalDeclaredValue)} in
                          declared value
                        </p>
                      )}
                    </div>

                    {summary.heavyCargo && summary.heavyCargo > 0 && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 text-xs">
                          <span className="text-gray-500">
                            Heavy Cargo Surcharge (&gt;50kg)
                          </span>
                          <span className="text-right">
                            {formatCurrency(summary.heavyCargo)}
                          </span>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Total */}
                    <div className="bg-gradient-to-r from-[#0a1628] to-[#122041] -mx-6 px-6 py-4 rounded-lg">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-300 text-sm font-medium">
                          Estimated Total
                        </span>
                        <span className="text-right text-xl font-bold text-emerald-400">
                          {formatCurrency(summary.subtotal)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[10px] mt-1">
                        Final amount confirmed after customs clearance &
                        weight verification
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                      disabled={form.formState.isSubmitting}
                      type="submit"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Create Secure Shipment
                        </>
                      )}
                    </Button>
                    <div className="flex gap-3 w-full">
                      <Button
                        variant="outline"
                        type="button"
                        className="flex-1"
                        onClick={() => router.back()}
                      >
                        Cancel
                      </Button>
                      <Button variant="outline" type="button" className="flex-1">
                        Save Draft
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                      By creating this shipment you agree to Aegis Cargo
                      terms of service, insurance policy, and LBMA
                      chain-of-custody requirements.
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

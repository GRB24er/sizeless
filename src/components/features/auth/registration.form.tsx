"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { motion } from "motion/react";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerAction } from "@/components/features/auth/action";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { RegisterProps, RegisterSchema } from "@/lib/schemas/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const RegistrationForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const router = useRouter();
  const form = useForm<RegisterProps>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      firstname: "",
      lastname: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async ({
    email,
    firstname,
    lastname,
    password,
    phone,
  }: RegisterProps) => {
    const formData = new FormData();
    formData.append("firstname", firstname);
    formData.append("lastname", lastname);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);

    startTransition(async () => {
      try {
        const result = await registerAction(null, formData);

        if (!result?.success) {
          toast.warning(result?.message || "Registration failed");
          setFormState(result);
          return;
        }

        toast.success(result.message || "Account created successfully");
        form.reset();
        router.push("/login");
      } catch {
        toast.error("An error occurred during registration");
        setFormState({ success: false, message: "Registration failed" });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+44 7700 900123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Label htmlFor="login-password">Password</Label>
                  </FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with a number and special
              character
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required />
            <Label htmlFor="terms" className="text-sm font-normal">
              I agree to the{" "}
              <Link href="/terms" className="text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
                Privacy Policy
              </Link>
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full bg-ink text-white hover:bg-navy-2 active:scale-[0.98] transition-[background-color,transform] duration-150 h-11 mt-2"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </motion.div>

        {/* Toggle between forms */}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?
            <button
              type="button"
              className="ml-1 font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink"
            >
              <Link href={"/login"}>Login</Link>
            </button>
          </p>
        </div>
      </form>
    </Form>
  );
};
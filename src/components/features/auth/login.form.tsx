"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().nonempty("Password is required"),
});

export const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (result?.error) {
        // Display error toast if signIn returns an error
        if (result.error === "CredentialsSignin") {
          toast.error("Invalid email or password. Please try again.");
          form.setError("root", {
            message: "Invalid email or password. Please try again.",
          });
        } else {
          toast.error("Too many login attempts. Please try again later.");
          form.setError("root", {
            message: "Too many login attempts. Please try again later.",
          });
        }
        // form.reset();
        return;
      }

      // Optionally, display a success message
      toast.success("Successfully signed in!");
      router.refresh();
      // Return to the page that sent the user here if it's a path on this site;
      // otherwise clients go to their account and admins to the dashboard.
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
      const session = safeNext ? null : await getSession();
      router.replace(safeNext ?? (session?.user?.role === "ADMIN" ? "/dashboard" : "/account"));
    } catch (error: unknown) {
      console.error(error);
      toast.error("An unexpected error occurred.");
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4 mb-4">
          {form.formState.errors.root && (
            <span className="text-xs bg-red-200 text-red-500 px-2 py-1 text-center block rounded-md">
              {form.formState.errors.root.message}
            </span>
          )}
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      <Label htmlFor="login-password">Password</Label>
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-ink-2 underline decoration-line-2 underline-offset-4 hover:text-ink"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember me for 30 days
            </Label>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full bg-ink text-white hover:bg-navy-2 active:scale-[0.98] transition-[background-color,transform] duration-150 h-11 mt-2"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.div>
        {/* <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Don&apos;t have an account?
            <button
              type="button"
              className="ml-1 font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink"
            >
              <Link href={"/register"}>Sign up</Link>
            </button>
          </p>
        </div> */}
      </form>
    </Form>
  );
};

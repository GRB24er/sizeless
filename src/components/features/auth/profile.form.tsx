"use client";

import { useActionState, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Phone, Building, Save, Edit, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
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
import { UpdateProfileAction } from "@/app/(root)/(protected)/profile/action";

type UserDataType = {
  User: {
    name: string;
    email: string;
    phone: string;
  };
  Address: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;

  id: string;
  bio: string | null;
  company: string | null;
};

interface ProfileUserData {
  userData: UserDataType;
}

// Define the profile form schema using Zod
export const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number is required" }),
  company: z.string().optional(),
  bio: z
    .string()
    .max(500, { message: "Bio cannot exceed 500 characters" })
    .optional(),
  address: z.object({
    street: z.string().min(1, { message: "Street address is required" }),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    postalCode: z.string().min(1, { message: "Postal code is required" }),
    country: z.string().min(1, { message: "Country is required" }),
  }),
});

export default function ProfileForm({ userData }: ProfileUserData) {
  const [isEditMode, setIsEditMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, action, isPending] = useActionState(UpdateProfileAction, null);

  // Initialize form with user data
  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userData.User.name || "",
      email: userData.User.email || "",
      phone: userData.User.phone || "",
      company: userData.company || "",
      bio: userData.bio || "",
      address: {
        street: userData.Address?.street || "",
        city: userData.Address?.city || "",
        state: userData.Address?.state || "",
        postalCode: userData.Address?.postalCode || "",
        country: userData.Address?.country || "",
      },
    },
  });

  const onSubmit = (value: z.infer<typeof profileFormSchema>) => {
    const formData = new FormData();

    formData.append("name", value.name || "");
    formData.append("email", value.email || "");
    formData.append("phone", value.phone || "");
    formData.append("company", value.company || "");
    formData.append("bio", value.bio || "");

    // Address fields (using dot notation for nested objects)
    formData.append("address.street", value.address?.street || "");
    formData.append("address.city", value.address?.city || "");
    formData.append("address.state", value.address?.state || "");
    formData.append("address.postalCode", value.address?.postalCode || "");
    formData.append("address.country", value.address?.country || "");

    action(formData);
    try {
      toast.success("Profile Updated", {
        description: "Your profile information has been updated successfully.",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed Update", {
        description: "Failed to update profile. Please try again.",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          className={`${isEditMode && "bg-primary hover:bg-primary/90"}`}
          onClick={() => setIsEditMode(!isEditMode)}
          disabled={isPending}
        >
          {isEditMode ? (
            <Save className="h-4 w-4 mr-1" />
          ) : (
            <Edit className="h-4 w-4 mr-1" />
          )}
          {isEditMode ? "Save" : "Edit"}
        </Button>
      </div>

      <Form {...profileForm}>
        <form
          onSubmit={profileForm.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input
                        placeholder="Your name"
                        {...field}
                        disabled={true}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input
                        placeholder="your.email@example.com"
                        {...field}
                        disabled={true}
                        type="email"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Phone className="mr-2 h-4 w-4 mt-3 text-gray-400" />
                      <Input
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        disabled={true}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Building className="mr-2 h-4 w-4 mt-3 text-gray-400" />
                      <Input
                        placeholder="Your company"
                        {...field}
                        disabled={!isEditMode || isPending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={profileForm.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself"
                    className="resize-none"
                    {...field}
                    disabled={!isEditMode || isPending}
                  />
                </FormControl>
                <FormDescription>
                  Brief description for your profile. Maximum 500 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input
                          placeholder="123 Main St"
                          {...field}
                          disabled={!isEditMode || isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City"
                        {...field}
                        disabled={!isEditMode || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="State"
                        {...field}
                        disabled={!isEditMode || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="address.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345"
                        {...field}
                        disabled={!isEditMode || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditMode || isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                        <SelectItem value="cn">China</SelectItem>
                        <SelectItem value="br">Brazil</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {isEditMode && (
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}

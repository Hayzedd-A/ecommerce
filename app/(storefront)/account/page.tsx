"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api/client";
import { setUser } from "@/lib/store/slices/authSlice";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put("/api/users/me", data);
      if (response.data.success) {
        dispatch(setUser(response.data.user));
        toast.success("Profile updated successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <Input
          label="Full Name"
          {...register("name")}
          error={errors.name?.message}
        />

        <Input
          label="Email Address"
          type="email"
          {...register("email")}
          error={errors.email?.message}
          disabled // Usually email changes require extra verification
        />

        <Input
          label="Phone Number"
          type="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />

        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!isDirty || isLoading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

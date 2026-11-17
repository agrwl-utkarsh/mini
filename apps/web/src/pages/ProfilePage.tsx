import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/ui";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { User, Mail, Lock, Eye, EyeOff, Bell, Shield, Save } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { clsx } from "@/lib/clsx";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      department: user?.department || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateUser(data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password changed successfully!");
      passwordForm.reset();
    } catch (error) {
      toast.error("Failed to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Profile Settings" description="Manage your account settings and preferences" />

      <div className="card">
        <div className="border-b border-secondary-200">
          <nav className="flex gap-4 p-4" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <CardBody className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-700">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">{user?.name}</h3>
                  <p className="text-secondary-500">{user?.email}</p>
                  <span className={clsx("badge mt-2", user?.role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-primary-100 text-primary-800")}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  error={profileForm.formState.errors.name?.message}
                  {...profileForm.register("name")}
                />
                <Input
                  label="Email"
                  type="email"
                  error={profileForm.formState.errors.email?.message}
                  {...profileForm.register("email")}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Department"
                  placeholder="Computer Science"
                  {...profileForm.register("department")}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...profileForm.register("phone")}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-secondary-200">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6 max-w-xl">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-[38px] text-secondary-400 hover:text-secondary-600"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    error={passwordForm.formState.errors.newPassword?.message}
                    {...passwordForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-[38px] text-secondary-400 hover:text-secondary-600"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <Input
                  label="Confirm New Password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register("confirmPassword")}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-secondary-200">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-secondary-900">Email Notifications</h4>
                  <p className="text-sm text-secondary-500">Receive email updates about your events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-secondary-900">Event Reminders</h4>
                  <p className="text-sm text-secondary-500">Get reminded before events start</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-secondary-900">Task Assignments</h4>
                  <p className="text-sm text-secondary-500">Notify when assigned new tasks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-secondary-900">Marketing Updates</h4>
                  <p className="text-sm text-secondary-500">Receive product updates and tips</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
        </CardBody>
      </div>
    </div>
  );
}
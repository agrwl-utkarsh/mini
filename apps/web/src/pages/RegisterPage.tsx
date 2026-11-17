import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/ui";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Calendar, Mail, Lock, Eye, EyeOff, User, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["PARTICIPANT", "ORGANIZER", "VOLUNTEER"]),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "PARTICIPANT",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-secondary-900">FESTORA</span>
          </Link>
          <h1 className="text-3xl font-bold text-secondary-900">Create your account</h1>
          <p className="mt-2 text-secondary-600">Join thousands of event organizers and participants</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Enter your details to create a new account</CardDescription>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@college.edu"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-secondary-400 hover:text-secondary-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              {password && (
                <div className="card p-3 bg-secondary-50">
                  <p className="text-xs font-medium text-secondary-700 mb-2">Password strength:</p>
                  <div className="flex gap-1 mb-2">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className="flex-1 h-1.5 rounded-full transition-colors"
                        style={{
                          backgroundColor: req.met ? "#10b981" : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                  <ul className="space-y-1 text-xs">
                    {passwordRequirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <UserCheck className={req.met ? "h-3 w-3 text-green-500" : "h-3 w-3 text-secondary-300"} />
                        <span className={req.met ? "text-green-600" : "text-secondary-400"}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  {...register("role")}
                  aria-describedby={errors.role ? "role-error" : undefined}
                >
                  <option value="PARTICIPANT">Participant - Attend events, register, get certificates</option>
                  <option value="ORGANIZER">Organizer - Create and manage events</option>
                  <option value="VOLUNTEER">Volunteer - Help with event execution</option>
                </select>
                {errors.role && (
                  <p id="role-error" className="mt-1.5 text-sm text-red-600" role="alert">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  {...register("terms")}
                />
                <label htmlFor="terms" className="text-sm text-secondary-600">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600" role="alert">{errors.terms.message}</p>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                <UserCheck className="h-4 w-4" />
                Create Account
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-sm text-secondary-600">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
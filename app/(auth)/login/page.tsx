// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "@/lib/firebase/auth";
import { getUser } from "@/lib/firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import Image from "next/image";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const ROLE_ROUTES: Record<string, string> = {
  member:      "/member",
  investor:    "/investor",
  president:   "/president",
  treasurer:   "/treasurer",
  secretary:   "/secretary",
  boardMember: "/board",
};

export default function LoginPage() {
  const router  = useRouter();
  const [show,  setShow]  = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const cred    = await signIn(data.email, data.password);
      const profile = await getUser(cred.user.uid);

      if (!profile) {
        throw new Error("Account not found. Contact your secretary.");
      }

      // Set session cookie for middleware
      document.cookie = `campuslink_session=${JSON.stringify({
        uid:  cred.user.uid,
        role: profile.role,
      })}; path=/; max-age=${60 * 60 * 24 * 7}`;

      toast.success(`Welcome back, ${profile.fullName.split(" ")[0]}! 👋`);

      // Force password change on first login
      if (!profile.passwordChanged) {
        router.push("/change-password");
        return;
      }

      router.push(ROLE_ROUTES[profile.role] ?? "/member");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg.includes("auth/invalid") ? "Invalid email or password" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] bg-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A017] opacity-[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#F5C842] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative w-20 h-20 mb-4 animate-float">
            <Image src="/images/icon.png" alt="CampusLink" fill className="object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold gold-text">
            CampusLink
          </h1>
          <p className="text-[#9a8a6a] text-sm mt-1 tracking-wide">
            Together we grow – Share, Save, Succeed
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl p-8"
        >
          <h2 className="text-xl font-display font-semibold text-[#f0e6c8] mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#9a8a6a] mb-2">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="gold-input"
                autoComplete="email"
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#9a8a6a] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  className="gold-input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a6a] hover:text-[#D4A017] transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-xs text-[#5a5040] mt-6">
            First time? Your secretary will provide your credentials.
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-[#3a3020] mt-6">
          © {new Date().getFullYear()} CampusLink Investment Association
        </p>
      </motion.div>
    </div>
  );
}

// app/(auth)/change-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { changePassword } from "@/lib/firebase/auth";
import { updateUser } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import Image from "next/image";

const schema = z
  .object({
    newPassword:     z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
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

export default function ChangePasswordPage() {
  const router  = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [show1, setShow1]  = useState(false);
  const [show2, setShow2]  = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await changePassword(data.newPassword);
      if (profile) {
        await updateUser(profile.uid, { passwordChanged: true });
        await refreshProfile();
        toast.success("Password updated! Welcome to CampusLink 🎉");
        router.push(ROLE_ROUTES[profile.role] ?? "/member");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] bg-pattern flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#D4A017] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4">
            <Image src="/images/icon.png" alt="CampusLink" fill className="object-contain" />
          </div>
          <div className="flex items-center gap-2 text-[#D4A017]">
            <ShieldCheck size={20} />
            <span className="font-display text-lg font-semibold">Secure Your Account</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-xl font-display font-semibold text-[#f0e6c8] mb-2">
            Set a New Password
          </h2>
          <p className="text-[#9a8a6a] text-sm mb-6">
            For your security, please choose a strong password before continuing.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#9a8a6a] mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  {...register("newPassword")}
                  type={show1 ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="gold-input pr-10"
                />
                <button type="button" onClick={() => setShow1(!show1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a6a] hover:text-[#D4A017] transition-colors">
                  {show1 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9a8a6a] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={show2 ? "text" : "password"}
                  placeholder="Repeat your password"
                  className="gold-input pr-10"
                />
                <button type="button" onClick={() => setShow2(!show2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8a6a] hover:text-[#D4A017] transition-colors">
                  {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 mt-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Updating…</>
              ) : (
                <><Lock size={16} /> Set Password & Continue</>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

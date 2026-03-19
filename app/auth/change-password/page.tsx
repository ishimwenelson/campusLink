"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { updateUser } from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Passwords don't match"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      await updateUser(user.uid, { passwordChanged: true });
      toast.success("Password updated! Welcome to CampusLink 🎉");
      router.push("/member");
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern-subtle p-6">
      <motion.div
        className="card-gold p-8 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-amber-600" size={28} />
          </div>
          <h1 className="font-display text-2xl text-stone-900">Set Your Password</h1>
          <p className="text-stone-500 text-sm mt-1">First login – please set a secure password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Current Password (default: CampusLink2025)", value: current, set: setCurrent },
            { label: "New Password", value: newPw, set: setNewPw },
            { label: "Confirm New Password", value: confirm, set: setConfirm },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-sm font-medium text-stone-700 block mb-1.5">{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => set(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 
                           text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 
                           focus:border-amber-400 transition-all text-sm"
              />
            </div>
          ))}
          <motion.button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <><Loader2 className="animate-spin" size={18} />Updating...</> : <><CheckCircle size={18} />Set Password & Continue</>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// components/dashboard/EmergencyModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createEmergencyRequest } from "@/lib/firebase/firestore";
import { createNotification } from "@/lib/firebase/firestore";
import type { CampusUser } from "@/lib/types";
import { formatRF } from "@/lib/types";
import { toast } from "sonner";
import { AlertCircle, X, Loader2, Info } from "lucide-react";

interface EmergencyModalProps {
  open:      boolean;
  onClose:   () => void;
  profile:   CampusUser;
  maxAmount: number;
}

export default function EmergencyModal({
  open, onClose, profile, maxAmount,
}: EmergencyModalProps) {
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    amount: z
      .number({ invalid_type_error: "Enter a valid amount" })
      .min(1_000, "Minimum amount is 1,000 RF")
      .max(maxAmount, `Maximum is ${formatRF(maxAmount)}`),
    reason: z.string().min(10, "Please explain why you need this (min 10 chars)"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ amount: number; reason: string }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { amount: number; reason: string }) => {
    setLoading(true);
    try {
      await createEmergencyRequest(profile.uid, data.amount);
      // Notify president
      await createNotification({
        userId:    "president_notifications", // president role channel
        title:     "Emergency Cash Request",
        message:   `${profile.fullName} requested ${formatRF(data.amount)}`,
        read:      false,
        createdAt: new Date().toISOString(),
        type:      "emergency_request",
      });
      toast.success("Emergency request submitted! The President will review it shortly. ✅");
      reset();
      onClose();
    } catch (err) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const interest = maxAmount > 0
    ? Math.round((Math.min(maxAmount, 100_000) * 0.05))
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-[#f0e6c8]">
                    Request Emergency Cash
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#5a5040] hover:text-[#D4A017] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info banner */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5 flex gap-3">
                <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#9a8a6a] space-y-1">
                  <p><span className="text-amber-400 font-semibold">Maximum:</span> {formatRF(maxAmount)} (40% of what you've paid)</p>
                  <p><span className="text-amber-400 font-semibold">Interest:</span> 5% of the amount you withdraw</p>
                  <p><span className="text-amber-400 font-semibold">Approval:</span> President must approve before funds are released</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9a8a6a] mb-2">
                    Amount Needed (RF)
                  </label>
                  <input
                    {...register("amount", { valueAsNumber: true })}
                    type="number"
                    placeholder={`Max: ${maxAmount.toLocaleString()} RF`}
                    className="gold-input"
                  />
                  {errors.amount && (
                    <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9a8a6a] mb-2">
                    Reason for Emergency
                  </label>
                  <textarea
                    {...register("reason")}
                    placeholder="Please explain your emergency situation..."
                    rows={3}
                    className="gold-input resize-none"
                  />
                  {errors.reason && (
                    <p className="text-red-400 text-xs mt-1">{errors.reason.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#9a8a6a] hover:text-[#f0e6c8] text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                    ) : (
                      "Submit Request"
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

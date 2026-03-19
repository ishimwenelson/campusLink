"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { createEmergencyRequest } from "@/lib/firebase/firestore";
import { formatRF } from "@/lib/utils/format";
import { getInterestAmount } from "@/lib/types";
import { toast } from "sonner";

interface EmergencyModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
  userId: string;
  userName: string;
  paidSoFar: number;
  emergencyTaken: number;
  interestOwed: number;
  activeExposure: number;
  remainingCapacity: number;
}

export function EmergencyModal({ 
  open, onClose, maxAmount, userId, userName, paidSoFar,
  emergencyTaken, interestOwed, activeExposure, remainingCapacity 
}: EmergencyModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalDebt = emergencyTaken + interestOwed;
  const isBlocked = remainingCapacity <= 0;

  const numAmount = Number(amount) || 0;
  const interest = numAmount * 0.05;
  const totalRepay = numAmount + interest;
  const isValid = numAmount > 0 && numAmount <= remainingCapacity;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await createEmergencyRequest(userId, userName, numAmount, note);
      setSubmitted(true);
      toast.success("Emergency request submitted! Awaiting President approval.");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setAmount("");
    setNote("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="relative w-full max-w-md card-gold p-6 z-10"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {submitted ? (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="text-green-600" size={40} />
                </motion.div>
                <h3 className="font-display text-2xl text-stone-900 mb-2">Request Submitted!</h3>
                <p className="text-stone-500 text-sm mb-6">
                  Your request for <strong>{formatRF(numAmount)}</strong> has been sent to the President for approval.
                  You'll be notified once reviewed.
                </p>
                <button onClick={handleClose} className="btn-gold w-full">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-xl text-stone-900">Emergency Cash Request</h3>
                    <p className="text-stone-500 text-xs mt-0.5">Requires President approval</p>
                  </div>
                  <button onClick={handleClose} className="p-2 rounded-xl hover:bg-amber-50">
                    <X size={18} className="text-stone-500" />
                  </button>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 mb-5 flex gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-500">Max Limit (40%):</span>
                        <span className="font-bold text-stone-900">{formatRF(maxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-500">Active Exposure:</span>
                        <span className="font-bold text-red-600">{formatRF(activeExposure)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200 mt-1">
                        <span className="text-stone-600 font-black uppercase tracking-tighter">Available Now:</span>
                        <span className="font-black text-amber-600">{formatRF(remainingCapacity)}</span>
                    </div>
                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-tight mt-2 opacity-70">
                      ️ 5% interest applied per request.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Amount (RF)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={remainingCapacity}
                      min={1}
                      placeholder={`Max available: ${remainingCapacity.toLocaleString()}`}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 
                                 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-sm"
                    />
                    {numAmount > remainingCapacity && (
                      <p className="text-red-500 text-xs mt-1">Amount exceeds remaining capacity</p>
                    )}
                  </div>

                  {numAmount > 0 && numAmount <= maxAmount && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-stone-50 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Amount requested</span>
                        <span className="font-semibold">{formatRF(numAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Interest (5%)</span>
                        <span className="font-semibold text-red-600">+ {formatRF(Math.round(interest))}</span>
                      </div>
                      <div className="border-t border-amber-200 pt-2 flex justify-between text-sm font-bold">
                        <span>Total to repay</span>
                        <span className="text-amber-700">{formatRF(Math.round(totalRepay))}</span>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Reason (optional)</label>
                    <textarea
                      value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="Brief reason for request..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 
                                 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 
                                 text-sm resize-none"
                    />
                  </div>

                  <motion.button
                    onClick={handleSubmit}
                    disabled={!isValid || loading}
                    className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} />Submitting...</> : "Submit Request"}
                  </motion.button>
                </div>
              </>
            )}

            {open && isBlocked && !submitted && (
              <div className="absolute inset-x-0 bottom-0 top-[88px] bg-white/95 backdrop-blur-sm z-20 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-stone-900 mb-2 leading-tight">
                  Institutional Limit Reached
                </h3>
                <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                  You have utilizing your full emergency capital capacity of <span className="text-red-600 font-black">{formatRF(maxAmount)}</span>.
                  <br /><br />
                  Please settle your outstanding active exposure of <span className="text-red-600 font-black">{formatRF(activeExposure)}</span> to unlock additional liquidity.
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={handleClose}
                    className="flex-1 py-4 rounded-2xl bg-stone-50 text-stone-900 font-bold text-xs uppercase tracking-widest border border-stone-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

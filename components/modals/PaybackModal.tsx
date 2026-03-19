"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Wallet, Smartphone, ShieldCheck, 
  Info, CheckCircle2 
} from "lucide-react";
import { repayEmergency, repayShortfallPenalty } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { formatRF } from "@/lib/utils/format";

interface PaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  interestOwed: number;
  principalOwed: number;
  shortfallPenaltyOwed: number;
}

export function PaybackModal({ isOpen, onClose, uid, interestOwed, principalOwed, shortfallPenaltyOwed }: PaybackModalProps) {
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState<"MTN" | "Airtel">("MTN");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payType, setPayType] = useState<"emergency" | "shortfall">("emergency");

  const totalDebt = interestOwed + principalOwed + shortfallPenaltyOwed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      if (payType === "emergency") {
        await repayEmergency(uid, Number(amount), provider, interestOwed, principalOwed);
      } else {
        await repayShortfallPenalty(uid, Number(amount), provider);
      }
      setSuccess(true);
      toast.success("Repayment successful!");
      setTimeout(() => {
        setSuccess(false);
        setAmount("");
        setPhone("");
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to process repayment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {success ? (
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-black text-stone-900">Repayment Received</h2>
                <p className="text-stone-500 text-xs font-medium">Your debt records have been updated immediately.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-black text-stone-900 uppercase tracking-tight">Debt Repayment</h3>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 hover:bg-stone-50 rounded-full transition-colors">
                    <X size={18} className="text-stone-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Outstanding Debt</p>
                      <p className="text-lg font-black text-stone-900 leading-none">{formatRF(totalDebt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Hierarchy</p>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">P: {formatRF(principalOwed)}</span>
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded">Int: {formatRF(interestOwed)}</span>
                        <span className="text-[9px] font-bold text-red-600 bg-red-100/50 px-1.5 py-0.5 rounded">Pen: {formatRF(shortfallPenaltyOwed)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayType("emergency")}
                      className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${payType === 'emergency' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100'}`}
                    >
                      Emergency Debt
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayType("shortfall")}
                      className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${payType === 'shortfall' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-400 border-stone-100'}`}
                    >
                      Savings Penalty
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Amount</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="078..."
                        className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Network</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setProvider("MTN")}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all font-black text-[10px] ${
                          provider === "MTN" 
                          ? "bg-yellow-50 border-yellow-400 text-yellow-700 font-black" 
                          : "bg-white border-stone-100 text-stone-400 font-bold"
                        }`}
                      >
                         MTN MOMO
                      </button>
                      <button
                        type="button"
                        onClick={() => setProvider("Airtel")}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all font-black text-[10px] ${
                          provider === "Airtel" 
                          ? "bg-red-50 border-red-400 text-red-700 font-black" 
                          : "bg-white border-stone-100 text-stone-400 font-bold"
                        }`}
                      >
                         AIRTEL MONEY
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-700">
                    <Info size={14} className="shrink-0" />
                    <p className="text-[9px] font-bold leading-tight">Payments are instant. Check your phone for the prompt.</p>
                  </div>

                  <button
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-stone-900 text-white font-black text-xs shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Confirm Payback <ShieldCheck size={16} /></>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

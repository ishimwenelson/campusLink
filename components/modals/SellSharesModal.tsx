"use client";
import { useState } from "react";
import { Plus, X, AlertCircle, Info, ShieldCheck, Briefcase, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createShareListing } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { formatRF } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { getSystemSettings } from "@/lib/firebase/firestore";
import { useEffect } from "react";

interface SellSharesModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  userName: string;
  currentPaid: number;
}

export function SellSharesModal({ isOpen, onClose, uid, userName, currentPaid }: SellSharesModalProps) {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("1000");
  const [isLiquidation, setIsLiquidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharePrice, setSharePrice] = useState(1000);

  useEffect(() => {
    if (isOpen) {
      getSystemSettings().then(s => {
        const p = s.shareUnitPrice || 1000;
        setSharePrice(p);
        setPrice(p.toString());
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shareAmount = Number(amount);
    const pricePerShare = Number(price);

    if (shareAmount <= 0) return toast.error("Please enter a valid amount of shares.");
    if (pricePerShare <= 0) return toast.error("Please enter a valid price.");

    setLoading(true);
    try {
      await createShareListing(uid, userName, shareAmount, pricePerShare, isLiquidation);
      toast.success("Shares listed successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to list shares");
    } finally {
      setLoading(false);
    }
  };

  const amountInRF = Number(amount) * sharePrice;
  const remaining = currentPaid - amountInRF;
  const isRuleViolation = !isLiquidation && (currentPaid > 0 && Number(amount) > 0) && remaining < 400000;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-stone-100 overflow-hidden"
          >
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-stone-900 tracking-tight italic">List <span className="text-amber-500">Shares</span></h2>
                  <p className="text-stone-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Market Order Configuration</p>
                </div>
                <button onClick={onClose} className="p-3 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-colors">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Liquidation Toggle */}
                <div className="p-6 rounded-[2rem] bg-stone-50 border border-stone-100 flex items-center justify-between group cursor-pointer"
                  onClick={() => {
                    const next = !isLiquidation;
                    setIsLiquidation(next);
                    if (next) setAmount((currentPaid / sharePrice).toString());
                  }}>
                  <div className="flex gap-4">
                    <div className={cn("p-3 rounded-xl transition-all", isLiquidation ? "bg-red-500 text-white" : "bg-white text-stone-400 shadow-sm")}>
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-900 uppercase tracking-widest">Leaving Campus Link</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter mt-0.5">Full Liquidation Settlement</p>
                    </div>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full p-1 transition-all duration-300", isLiquidation ? "bg-red-500" : "bg-stone-200")}>
                    <motion.div
                      animate={{ x: isLiquidation ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Limit (Shares)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLiquidation}
                        placeholder="e.g. 50"
                        className="w-full px-5 py-4 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-amber-500/20 transition-all font-black text-stone-900"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300">SHRS</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Price (RF/Share)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        readOnly
                        placeholder="1000"
                        className="w-full px-5 py-4 rounded-2xl bg-stone-100 border-none focus:ring-0 transition-all font-black text-stone-500 cursor-not-allowed"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300">SYSTEM RATE</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all duration-500",
                    isRuleViolation ? "bg-red-50 border-red-100" : "bg-amber-500/5 border-amber-500/10"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {isRuleViolation ? <AlertCircle size={18} className="text-red-500" /> : <ShieldCheck size={18} className="text-amber-500" />}
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isRuleViolation ? "text-red-600" : "text-amber-600")}>
                      {isRuleViolation ? "Rule Violation" : "Compliance Check"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Total Value</p>
                      <p className="text-lg font-black text-stone-900">{formatRF(Number(amount) * Number(price))}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Remaining</p>
                      <p className={cn("text-lg font-black", isRuleViolation ? "text-red-600" : "text-stone-900")}>
                        {isLiquidation ? "0 SHRS" : `${Math.round(remaining / sharePrice).toLocaleString()} SHRS`}
                      </p>
                    </div>
                  </div>

                  {isRuleViolation && (
                    <p className="mt-4 text-[9px] font-bold text-red-500 leading-relaxed uppercase tracking-wide">
                      Error: You must maintain at least 400 shares (400,000 RF) unless you select "Leaving Campus Link".
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || isRuleViolation || !amount || !price}
                  className="w-full py-5 rounded-[1.8rem] bg-stone-900 text-white font-black hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {loading ? "Processing Order..." : (
                    <>
                      Confirm Listing <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

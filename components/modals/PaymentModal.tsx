"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Loader2, CheckCircle, Wallet, CreditCard } from "lucide-react";
import { formatRF } from "@/lib/utils/format";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, increment, collection, addDoc, getDoc } from "firebase/firestore";
import { getAnnualTarget, calculateYearlyPayments } from "@/lib/types";
import type { Payment } from "@/lib/types";
import { useEffect } from "react";

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export function PaymentModal({ open, onClose, userId, userName }: PaymentModalProps) {
    const [amount, setAmount] = useState("");
    const [provider, setProvider] = useState<"MTN" | "Airtel">("MTN");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const numAmount = Number(amount) || 0;
    const isValid = numAmount >= 500 && phone.length >= 10;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        try {
            
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                paidSoFar: increment(numAmount)
            });

            
            const paymentData = {
                amount: numAmount,
                date: new Date().toISOString(),
                year: new Date().getFullYear(),
                provider,
                phone,
                status: "completed",
                note: `Savings via ${provider} MoMo`
            };
            await addDoc(collection(db, "users", userId, "payments"), paymentData);

            setSubmitted(true);
            toast.success("Payment successful! Your savings have been updated.");
        } catch (err) {
            console.error(err);
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount("");
        setPhone("");
        setSubmitted(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-stone-950/60 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />
                    <motion.div
                        className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden z-10"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        {submitted ? (
                            <div className="text-center py-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20"
                                >
                                    <CheckCircle className="text-white" size={40} />
                                </motion.div>
                                <h3 className="text-2xl font-black text-stone-900 mb-2">Payment Received!</h3>
                                <p className="text-stone-500 text-sm mb-8 font-medium">
                                    We've successfully processed your contribution of <span className="text-stone-900 font-bold">{formatRF(numAmount)}</span>.
                                </p>
                                <button
                                    onClick={handleClose}
                                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all active:scale-95"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-stone-900 tracking-tight">Save Now</h3>
                                        <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Mobile Money Payment</p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 rounded-xl bg-stone-50 text-stone-400 hover:bg-stone-100 transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block px-1">Amount (RF)</label>
                                            <div className="relative group">
                                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                                                <input
                                                    required
                                                    type="number"
                                                    min="500"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="Min: 500"
                                                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-3 text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block px-1">Mobile Number</label>
                                            <div className="relative group">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                                                <input
                                                    required
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="07X XXX XXXX"
                                                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-3 text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block px-1">Choose Network</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setProvider("MTN")}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${provider === "MTN"
                                                        ? "border-amber-500 bg-amber-50/50"
                                                        : "border-stone-100 bg-stone-50/30 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[#FFCC00] flex items-center justify-center font-black text-[10px] shrink-0">MTN</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">MTN MoMo</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProvider("Airtel")}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${provider === "Airtel"
                                                        ? "border-red-500 bg-red-50/50"
                                                        : "border-stone-100 bg-stone-50/30 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[#ED1C24] flex items-center justify-center font-black text-[10px] text-white shrink-0">Airtel</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">Airtel Money</span>
                                            </button>
                                        </div>
                                    </div>

                                    
                                    {numAmount > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-stone-50/80 p-4 rounded-2xl border border-stone-100 space-y-1"
                                        >
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">To be saved</span>
                                                <span className="text-xs font-black text-stone-900">{formatRF(numAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Network Fee</span>
                                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Free</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button
                                        disabled={!isValid || loading}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-stone-900/20 hover:bg-stone-800 transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                <CreditCard size={16} />
                                                Confirm Payment
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                                        Secure 256-bit encrypted transaction
                                    </p>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

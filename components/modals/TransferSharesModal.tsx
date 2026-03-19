"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User, ArrowRight, Shield, AlertCircle, Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { searchUserByNationalID, transferShares, getSystemSettings } from "@/lib/firebase/firestore";
import { formatRF } from "@/lib/utils/format";
import { toast } from "sonner";
import type { CampusUser } from "@/lib/types";

interface TransferSharesModalProps {
    isOpen: boolean;
    onClose: () => void;
    sender: CampusUser;
}

export function TransferSharesModal({ isOpen, onClose, sender }: TransferSharesModalProps) {
    const [nationalID, setNationalID] = useState("");
    const [recipient, setRecipient] = useState<CampusUser | null>(null);
    const [searching, setSearching] = useState(false);
    const [shareCount, setShareCount] = useState<number>(0);
    const [transferring, setTransferring] = useState(false);
    const [sharePrice, setSharePrice] = useState(1000);
    const [step, setStep] = useState<"lookup" | "amount" | "confirm">("lookup");

    useEffect(() => {
        if (isOpen) {
            getSystemSettings().then(settings => {
                if (settings?.shareUnitPrice) setSharePrice(settings.shareUnitPrice);
            });
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!nationalID.trim()) return;
        setSearching(true);
        try {
            const user = await searchUserByNationalID(nationalID.trim());
            if (user) {
                if (user.uid === sender.uid) {
                    toast.error("You cannot transfer shares to yourself.");
                } else {
                    setRecipient(user);
                    setStep("amount");
                }
            } else {
                toast.error("User not found. Please verify the National ID.");
            }
        } catch (err) {
            toast.error("Error searching for recipient.");
        } finally {
            setSearching(false);
        }
    };

    const totalRF = shareCount * sharePrice;

    const handleTransfer = async () => {
        if (!recipient) return;
        setTransferring(true);
        try {
            await transferShares(sender.uid, recipient.uid, totalRF);
            toast.success("Shares transferred successfully! ");
            onClose();
            
            setStep("lookup");
            setRecipient(null);
            setShareCount(0);
            setNationalID("");
        } catch (err: any) {
            toast.error(err.message || "Failed to complete transfer.");
        } finally {
            setTransferring(false);
        }
    };

    const canTransfer = sender.paidSoFar >= 400000;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-[40px] overflow-hidden shadow-2xl"
                >
                    {}
                    <div className="absolute top-0 left-0 h-1 bg-stone-800 w-full">
                        <motion.div 
                            className="h-full bg-amber-500"
                            animate={{ width: step === "lookup" ? "33%" : step === "amount" ? "66%" : "100%" }}
                        />
                    </div>

                    <div className="p-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">Share <span className="text-amber-500">Transfer</span></h2>
                                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">Institutional Equity Reallocation</p>
                            </div>
                            <button onClick={onClose} className="p-3 rounded-2xl bg-stone-800 text-stone-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {!canTransfer ? (
                            <div className="p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                                    <Shield size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Threshold Not Met</h3>
                                <p className="text-stone-400 text-sm leading-relaxed">
                                    Strategic reallocation requires a minimum portfolio value of <span className="text-white font-black">{formatRF(400000)}</span>. You currently have <span className="text-amber-500 font-black">{formatRF(sender.paidSoFar)}</span>.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {step === "lookup" && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                        <div className="space-y-6">
                                            <div className="p-6 rounded-[2rem] bg-stone-800/30 border border-stone-800">
                                                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 italic">Step 1: Locate Recipient Member</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text"
                                                        value={nationalID}
                                                        onChange={(e) => setNationalID(e.target.value)}
                                                        placeholder="Enter National ID (16 digits)"
                                                        className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 pr-14 font-mono tracking-widest"
                                                    />
                                                    <button 
                                                        onClick={handleSearch}
                                                        disabled={searching || !nationalID}
                                                        className="absolute right-2 top-2 bottom-2 aspect-square bg-amber-500 text-stone-900 rounded-xl flex items-center justify-center hover:bg-amber-400 disabled:opacity-50 transition-all shadow-lg"
                                                    >
                                                        {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 italic text-[11px] font-bold text-amber-200/60 leading-snug">
                                                <TrendingUp className="shrink-0 text-amber-500" size={18} />
                                                Security Note: Shares can only be transferred to existing members verified on the platform.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === "amount" && recipient && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-stone-800/30 border border-stone-800">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <User size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Target Member</p>
                                                <p className="font-black text-white text-lg">{recipient.fullName}</p>
                                                <p className="text-[10px] font-bold text-amber-500/70">{recipient.nationalID}</p>
                                            </div>
                                            <button onClick={() => setStep("lookup")} className="p-3 text-stone-500 hover:text-white transition-colors">
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="p-8 rounded-[2.5rem] bg-[#09090b] border border-stone-800">
                                            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 italic text-center">Shares to Reallocate (Units)</label>
                                            <input 
                                                type="number"
                                                value={shareCount || ""}
                                                onChange={(e) => setShareCount(Number(e.target.value))}
                                                placeholder="Enter Share Count"
                                                className="w-full bg-transparent text-center text-5xl font-black text-amber-500 focus:outline-none placeholder:text-stone-800"
                                            />
                                            <div className="mt-8 flex items-center justify-between px-4">
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Available Value</p>
                                                    <p className="text-xs font-bold text-white font-mono">{formatRF(sender.paidSoFar)}</p>
                                                </div>
                                                <div className="w-px h-10 bg-stone-800" />
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Total RF Impact</p>
                                                    <p className="text-sm font-black text-amber-500 font-mono">{formatRF(totalRF)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setStep("confirm")}
                                            disabled={shareCount <= 0 || totalRF > sender.paidSoFar}
                                            className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-amber-500 text-stone-900 font-black text-sm hover:bg-amber-400 disabled:opacity-30 transition-all shadow-xl shadow-amber-500/10 uppercase tracking-widest"
                                        >
                                            Review Allocation <ArrowRight size={20} />
                                        </button>
                                    </motion.div>
                                )}

                                {step === "confirm" && recipient && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-4">
                                                <Shield size={32} />
                                            </div>
                                            <h3 className="text-2xl font-black text-white">Final Authorization</h3>
                                            <p className="text-stone-500 text-sm font-medium">Please confirm this permanent reallocation of equity.</p>
                                        </div>

                                        <div className="grid grid-cols-5 items-center gap-2">
                                            <div className="col-span-2 text-center p-4 rounded-3xl bg-stone-800/30 border border-stone-800">
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2">From (You)</p>
                                                <p className="font-bold text-white text-xs truncate">You</p>
                                            </div>
                                            <div className="flex justify-center">
                                                <ArrowRight className="text-amber-500" size={24} />
                                            </div>
                                            <div className="col-span-2 text-center p-4 rounded-3xl bg-stone-800/30 border border-stone-800">
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2">To recipient</p>
                                                <p className="font-bold text-white text-xs truncate">{recipient.fullName}</p>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-center">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Impact (Shares × Value)</p>
                                            <p className="text-3xl font-black text-white">{shareCount} Units = {formatRF(totalRF)}</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setStep("amount")}
                                                className="flex-1 py-4 rounded-2xl bg-stone-800 text-white font-bold text-sm hover:bg-stone-700 transition-all"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={handleTransfer}
                                                disabled={transferring}
                                                className="flex-[2] py-4 rounded-2xl bg-amber-500 text-stone-900 font-black text-sm hover:bg-amber-400 disabled:opacity-50 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                                            >
                                                {transferring ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                Authorize Reallocation
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

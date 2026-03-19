"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Search, User, ArrowRight, ShieldCheck, Banknote, 
  Loader2, CheckCircle2, History, AlertCircle
} from "lucide-react";
import { searchUserByNationalID, recordTreasurerEmergencyPayback, getAllUsers } from "@/lib/firebase/firestore";
import { formatRF } from "@/lib/utils/format";
import { toast } from "sonner";
import type { CampusUser } from "@/lib/types";

interface AdminPaybackModalProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedUser?: CampusUser | null;
}

export function AdminPaybackModal({ isOpen, onClose, preSelectedUser }: AdminPaybackModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [recipient, setRecipient] = useState<CampusUser | null>(null);
    const [searching, setSearching] = useState(false);
    const [amount, setAmount] = useState<number>(0);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<"search" | "amount" | "confirm">("search");
    const [allMembers, setAllMembers] = useState<CampusUser[]>([]);

    useEffect(() => {
        if (isOpen) {
            getAllUsers().then(setAllMembers);
            if (preSelectedUser) {
                setRecipient(preSelectedUser);
                setStep("amount");
            } else {
                setStep("search");
                setRecipient(null);
            }
            setAmount(0);
            setNote("");
            setSearchTerm("");
        }
    }, [isOpen, preSelectedUser]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const byId = await searchUserByNationalID(searchTerm.trim());
            if (byId) {
                setRecipient(byId);
                setStep("amount");
            } else {
                const byName = allMembers.find(m => 
                    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.nationalID.includes(searchTerm)
                );
                if (byName) {
                    setRecipient(byName);
                    setStep("amount");
                } else {
                    toast.error("No member found with these details.");
                }
            }
        } catch (err) {
            toast.error("Search failed.");
        } finally {
            setSearching(false);
        }
    };

    const handleRecordPayback = async () => {
        if (!recipient) return;
        setSaving(true);
        try {
            await recordTreasurerEmergencyPayback(
                recipient.uid, 
                amount, 
                note, 
                recipient.interestOwed || 0, 
                recipient.emergencyTaken || 0
            );
            toast.success(`Payback of ${formatRF(amount)} recorded for ${recipient.fullName}!`);
            
            // Optionally update the local recipient state for visual confirmation, though the modal closes usually.
            
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to record payback.");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setStep("search");
        setRecipient(null);
        setAmount(0);
        setNote("");
        setSearchTerm("");
        onClose();
    };

    if (!isOpen) return null;

    const totalDebt = recipient ? (recipient.emergencyTaken || 0) + (recipient.interestOwed || 0) : 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-[30px] sm:rounded-[40px] overflow-hidden shadow-2xl"
                >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-stone-800 w-full">
                        <motion.div 
                            className="h-full bg-amber-500"
                            animate={{ width: step === "search" ? "33%" : step === "amount" ? "66%" : "100%" }}
                        />
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Emergency <span className="text-amber-500">Payback</span></h2>
                                <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Administrative Debt Settlement</p>
                            </div>
                            <button onClick={handleClose} className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {step === "search" && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-[1.5rem] bg-stone-800/30 border border-stone-800">
                                            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 italic">Step 1: Locate Target Member</label>
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Search by Name or National ID"
                                                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 pr-12 font-medium"
                                                />
                                                <button 
                                                    onClick={handleSearch}
                                                    disabled={searching || !searchTerm}
                                                    className="absolute right-2 top-2 bottom-2 aspect-square bg-amber-500 text-stone-900 rounded-xl flex items-center justify-center hover:bg-amber-400 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
                                                >
                                                    {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 italic text-[11px] font-bold text-amber-200/60 leading-snug">
                                            <ShieldCheck className="shrink-0 text-amber-500" size={18} />
                                            Verification: This action records manual (cash/bank) repayments. The system will automatically reconcile interest first, then principal.
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === "amount" && recipient && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-800/30 border border-stone-800">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                            <User size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest leading-none mb-1">Settling debt for</p>
                                            <p className="font-black text-white text-base leading-none">{recipient.fullName}</p>
                                            <p className="text-[9px] font-bold text-stone-600 leading-none mt-1">{recipient.nationalID}</p>
                                        </div>
                                        <button onClick={() => setStep("search")} className="p-2 text-stone-500 hover:text-white transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {totalDebt === 0 ? (
                                        <div className="p-4 sm:p-6 rounded-[2rem] bg-[#09090b] border border-stone-800 text-center space-y-2">
                                            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <h3 className="text-xl font-black text-white">No Active Debt</h3>
                                            <p className="text-stone-500 text-sm">This member does not have any outstanding emergency loans or interest.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-3 rounded-2xl bg-stone-800/30 border border-stone-800">
                                                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Principal</p>
                                                    <p className="text-base font-black text-stone-300">{formatRF(recipient.emergencyTaken || 0)}</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-stone-800/30 border border-stone-800">
                                                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Interest</p>
                                                    <p className="text-base font-black text-amber-500">{formatRF(recipient.interestOwed || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-[1.25rem] bg-[#09090b] border border-stone-800">
                                                <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2 italic text-center">Repayment (RF)</label>
                                                <input 
                                                    type="number"
                                                    value={amount || ""}
                                                    onChange={(e) => setAmount(Number(e.target.value))}
                                                    placeholder="Enter Amount"
                                                    max={totalDebt}
                                                    className="w-full bg-transparent text-center text-3xl font-black text-amber-500 focus:outline-none placeholder:text-stone-800"
                                                />
                                                {amount > totalDebt && (
                                                    <p className="text-red-500 text-[10px] text-center mt-1 font-bold">Exceeds total debt ({formatRF(totalDebt)})</p>
                                                )}
                                                
                                                <div className="mt-4">
                                                    <label className="block text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1.5 px-1">Internal Note / Reference</label>
                                                    <input 
                                                        type="text"
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                        placeholder="e.g. Bank slip ID or Cash receipt"
                                                        className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setStep("confirm")}
                                                disabled={amount <= 0 || amount > totalDebt}
                                                className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.5rem] bg-amber-500 text-stone-900 font-black text-[13px] hover:bg-amber-400 disabled:opacity-30 transition-all shadow-xl shadow-amber-500/10 uppercase tracking-widest"
                                            >
                                                Review Entry <ArrowRight size={18} />
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {step === "confirm" && recipient && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-2">
                                            <Banknote size={24} />
                                        </div>
                                        <h3 className="text-xl font-black text-white">Debt Settlement Authorization</h3>
                                        <p className="text-stone-500 text-[11px] font-medium">Please confirm this manual ledger adjustment.</p>
                                    </div>

                                    <div className="p-4 rounded-[1.25rem] bg-[#0c0c0e] border border-stone-800 divide-y divide-stone-800/50">
                                        <div className="pb-3 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Recipient Member</span>
                                            <span className="text-xs font-bold text-white">{recipient.fullName}</span>
                                        </div>
                                        <div className="py-3 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Repayment Amount</span>
                                            <span className="text-base font-black text-amber-500">{formatRF(amount)}</span>
                                        </div>
                                        <div className="pt-3 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Official Reference</span>
                                            <span className="text-[10px] font-medium text-stone-300 italic">{note || "Treasurer Manual Settlement"}</span>
                                        </div>
                                    </div>

                                    {/* Breakdown Info */}
                                    <div className="flex gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 italic text-[10px] font-bold text-blue-200/60 leading-snug">
                                        <AlertCircle className="shrink-0 text-blue-500" size={16} />
                                        System allocates {formatRF(Math.min(amount, recipient.interestOwed || 0))} to interest and {formatRF(Math.max(0, amount - (recipient.interestOwed || 0)))} to principal.
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setStep("amount")}
                                            className="flex-1 py-4 rounded-2xl bg-stone-800 text-white font-bold text-sm hover:bg-stone-700 transition-all"
                                        >
                                            Modify
                                        </button>
                                        <button 
                                            onClick={handleRecordPayback}
                                            disabled={saving}
                                            className="flex-[2] py-4 rounded-2xl bg-amber-500 text-stone-900 font-black text-sm hover:bg-amber-400 disabled:opacity-50 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                                        >
                                            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                            Commit to Ledger
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

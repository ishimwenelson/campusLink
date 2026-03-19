"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Send, Loader2 } from "lucide-react";

interface RejectionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    loading?: boolean;
}

export function RejectionReasonModal({ isOpen, onClose, onConfirm, loading = false }: RejectionReasonModalProps) {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onConfirm(reason.trim());
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-stone-950/60 backdrop-blur-md"
                    onClick={!loading ? onClose : undefined}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100"
                >
                    <div className="h-2 bg-amber-500" />

                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-xl shadow-amber-500/10">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">
                                    Rejection <span className="text-amber-500">Notice</span>
                                </h3>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Provide a reason for the member</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-1">Reason for Rejection</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Insufficient current asset liquidity or documents missing..."
                                rows={4}
                                className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-100 text-[11px] font-bold text-stone-900 placeholder:text-stone-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none italic"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !reason.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-stone-800 disabled:opacity-50 transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                Confirm Rejection
                            </button>
                            
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="w-full bg-stone-50 hover:bg-stone-100 text-stone-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                            >
                                Abort
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="absolute top-6 right-6 p-2 text-stone-300 hover:text-stone-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

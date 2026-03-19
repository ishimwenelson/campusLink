"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    loading = false
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-stone-950/60 backdrop-blur-md"
                    onClick={!loading ? onClose : undefined}
                />

                {}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100"
                >
                    {}
                    <div className="h-2 bg-red-500" />

                    <div className="p-8 space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
                                <AlertCircle size={32} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">
                                {title}
                            </h3>
                            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 transition-all",
                                    loading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Confirm Termination
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="w-full bg-stone-50 hover:bg-stone-100 text-stone-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                            >
                                Abort Mission
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

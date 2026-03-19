"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { addMeetingComment } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import type { Meeting } from "@/lib/types";

interface MeetingCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | null;
}

export function MeetingCommentModal({ isOpen, onClose, meeting }: MeetingCommentModalProps) {
    const { profile } = useAuth();
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meeting || !profile || !text.trim()) return;

        setSubmitting(true);
        try {
            await addMeetingComment(meeting.id, {
                uid: profile.uid,
                name: profile.fullName,
                role: profile.role,
                text: text.trim(),
                createdAt: new Date().toISOString(),
            });

            toast.success("Comment added successfully!");
            setText("");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !meeting) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 overflow-hidden"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Meeting Comment</h3>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Pre-Session Submission</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-lg transition-colors">
                                <X size={18} className="text-stone-400" />
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Session Target</p>
                            <p className="text-xs font-bold text-stone-900 line-clamp-1">{meeting.title}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Your Comment / Suggestion</label>
                                <textarea
                                    required
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type your strategic input or concerns here..."
                                    rows={4}
                                    className="w-full p-5 rounded-2xl bg-stone-50 border border-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-xs font-bold text-stone-900 placeholder:text-stone-300 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !text.trim()}
                                className="w-full py-4 rounded-xl bg-stone-950 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                            >
                                {submitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        Broadcast Input
                                        <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

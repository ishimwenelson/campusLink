"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getMeetingComments, getMeetings } from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import { 
    MessageSquare, Calendar, User, Clock, 
    ArrowLeft, Shield, Paperclip, Download,
    ChevronLeft, MessageCircle, Loader2
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { Meeting, MeetingComment } from "@/lib/types";
import { toast } from "sonner";

function CommentContainer() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useAuth();
    const meetingId = searchParams.get("id");

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [comments, setComments] = useState<MeetingComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile && profile.role !== 'president') {
            toast.error("Access Restricted: Presidential Authorization Required");
            router.push("/board/meetings");
            return;
        }

        if (meetingId) {
            fetchData();
        }
    }, [meetingId, profile]);

    const fetchData = async () => {
        try {
            const [allMeetings, allComments] = await Promise.all([
                getMeetings(),
                getMeetingComments(meetingId!)
            ]);
            
            const currentMeeting = allMeetings.find(m => m.id === meetingId);
            setMeeting(currentMeeting || null);
            setComments(allComments);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load strategic intelligence");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Decrypting Intel...</p>
            </div>
        </div>
    );

    if (!meeting) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
            <div className="text-center space-y-4">
                <Shield size={48} className="mx-auto text-stone-200" />
                <h2 className="text-xl font-black text-stone-900 uppercase">Session Invalid</h2>
                <button onClick={() => router.push("/board/meetings")} className="text-amber-500 font-bold text-sm">Return to Command Center</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 pb-32">
            {/* Header section - Presidential Command Style */}
            <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-8">
                        <button 
                            onClick={() => router.push("/board/meetings")}
                            className="flex items-center gap-3 px-4 py-2 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200/50 transition-all group"
                        >
                            <ChevronLeft size={16} className="text-stone-400 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">Command Center</span>
                        </button>

                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                <Shield size={14} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-900">Presidential Access</span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* Meeting Metadata Panel */}
                        <div className="lg:w-1/3 space-y-6">


                            <div className="bg-stone-50 rounded-[1.5rem] border border-stone-100 p-4 space-y-3">
                                <div>
                                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Session Identifier</p>
                                    <h2 className="text-sm font-black text-stone-800 uppercase leading-snug">{meeting.title}</h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Temporal Log</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-amber-500" />
                                            <span className="text-[10px] font-bold text-stone-600">{formatDate(meeting.date)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Session Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-stone-600 uppercase">{meeting.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Agenda Protocol</p>
                                    <p className="text-[11px] font-medium text-stone-500 leading-relaxed italic border-l-2 border-stone-200 pl-4">
                                        "{meeting.agenda}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex-1 flex flex-col justify-end gap-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="px-5 py-3 bg-stone-900 rounded-[1.25rem] border border-stone-800 shadow-xl shadow-stone-900/10 flex items-center gap-5 group hover:scale-[1.02] transition-all">
                                    <div>
                                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Total Intelligence Units</p>
                                        <p className="text-2xl font-black text-amber-500 leading-none">{comments.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center text-white scale-90">
                                        <MessageCircle size={22} />
                                    </div>
                                </div>
                                <div className="px-5 py-3 bg-white border border-stone-100 rounded-[1.25rem] flex items-center gap-4 shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Duration Focus</p>
                                        <p className="text-xs font-black text-stone-900">{meeting.durationHours} HOURS SYNC</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content list - Scrollable Intelligence Archive */}
            <div className="max-w-6xl mx-auto px-6 mt-10">
                <div className="flex items-center gap-4 mb-6">
                    <span className="h-px bg-stone-200 flex-1" />
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.4em]">Member Input Archive</span>
                    <span className="h-px bg-stone-200 flex-1" />
                </div>

                {comments.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[2rem] border border-dashed border-stone-200">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100 transition-transform hover:rotate-12">
                             <MessageSquare className="text-stone-300" size={28} />
                        </div>
                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.3em]">Quiet Protocol: No Pre-Session Intel Reported</p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                            {comments.map((c, idx) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white p-5 rounded-[1.5rem] border border-stone-100 shadow-xl shadow-stone-900/5 flex flex-col group hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] text-stone-900 pointer-events-none group-hover:text-amber-500 transition-all">
                                        <User size={60} />
                                    </div>

                                    <div className="flex items-center gap-3 mb-4 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-500 shadow-lg text-base font-black uppercase ring-4 ring-amber-500/10">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-stone-900 text-[11px] uppercase tracking-tight">{c.name}</h4>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{c.role}</span>
                                                <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock size={8} />
                                                    {formatDate(c.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 rounded-[1.25rem] bg-stone-50/50 border border-stone-100/50 text-[10px] font-bold text-stone-600 leading-relaxed italic relative group-hover:bg-white transition-colors duration-300">
                                        "{c.text}"
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                body {
                    background: #fcfcfb;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e5e5;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d4d4d4;
                }
            `}</style>
        </div>
    );
}

export default function MeetingCommentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                 <Loader2 className="animate-spin text-amber-500" />
            </div>
        }>
            <CommentContainer />
        </Suspense>
    );
}


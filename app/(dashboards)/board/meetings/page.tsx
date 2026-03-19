"use client";
import { useState, useEffect } from "react";
import { getMeetings, createMeeting, createNotification } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, Plus, Clock, MapPin,
    ChevronRight, Search, X, Users,
    CheckCircle2, AlertCircle, Loader2,
    ArrowRight, Filter, MoreVertical, Share2, Link
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { Meeting } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMeeting } from "@/lib/firebase/firestore";
import { MeetingCommentModal } from "@/components/modals/MeetingCommentModal";
import { MessageSquarePlus, Eye } from "lucide-react";

export default function MeetingsPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [creating, setCreating] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // New Meeting Form State
    const [newMeeting, setNewMeeting] = useState({
        title: "",
        date: "",
        agenda: "",
        durationHours: 1,
        invitedRoles: ["boardMember", "president"] as any[],
    });

    useEffect(() => {
        fetchMeetings();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchMeetings = async () => {
        try {
            const data = await getMeetings();
            setMeetings(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load meetings");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setCreating(true);

        try {
            const meetingData: Omit<Meeting, "id"> = {
                ...newMeeting,
                status: "planned",
                minutes: "",
                createdBy: profile.uid,
                attendees: [],
            };

            await createMeeting(meetingData);

            // Send notifications to all invited roles
            await Promise.all(newMeeting.invitedRoles.map(role => 
                createNotification({
                    userId: role, // Assuming backend handles role-based userId or we send to a topic
                    title: "New Meeting scheduled",
                    message: `${newMeeting.title} has been scheduled for ${formatDate(newMeeting.date)}`,
                    type: "meeting_invite",
                    read: false,
                    createdAt: new Date().toISOString()
                })
            ));

            toast.success("Meeting scheduled successfully");
            setIsModalOpen(false);
            setNewMeeting({ title: "", date: "", agenda: "", durationHours: 1, invitedRoles: ["boardMember", "president"] });
            fetchMeetings();
        } catch (err) {
            console.error(err);
            toast.error("Failed to schedule meeting");
        } finally {
            setCreating(false);
        }
    };

    const copyMeetingLink = (id: string) => {
        const url = window.location.origin + `/board/meetings/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Meeting link copied to clipboard");
    };

    const filtered = meetings.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
                             m.agenda.toLowerCase().includes(search.toLowerCase());
        const isInvited = m.invitedRoles?.includes(profile?.role as any);
        const isCreator = m.createdBy === profile?.uid;
        return matchesSearch && (isInvited || isCreator);
    });

    // Auto-expiration check
    useEffect(() => {
        const checkExpirations = async () => {
            const now = currentTime.getTime();
            let changed = false;

            for (const m of meetings) {
                if (m.status === "planned") {
                    const startTime = new Date(m.date).getTime();
                    const endTime = startTime + (m.durationHours * 3600000);
                    
                    if (now > endTime) {
                        try {
                            await updateMeeting(m.id, { status: "expired" });
                            changed = true;
                        } catch (err) {
                            console.error(`Failed to expire meeting ${m.id}:`, err);
                        }
                    }
                }
            }

            if (changed) fetchMeetings();
        };

        const interval = setInterval(checkExpirations, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [meetings, currentTime]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Strategy Hub...</p>
        </div>
    );

    function Countdown({ date }: { date: string }) {
        const start = new Date(date).getTime();
        const diff = start - currentTime.getTime();

        if (diff <= 0) return null;

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-amber-500 rounded-lg border border-stone-800 shadow-sm animate-pulse">
                <Clock size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest font-mono">
                    Starts in {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
                </span>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
            {/* Imperial Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.3em]">Institutional Repository</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tighter leading-none">
                        Strategy <span className="text-amber-500">Syncs</span>
                    </h1>
                    <p className="text-stone-400 font-bold text-[10px] mt-3 uppercase tracking-widest leading-none">Historical Records & Legislative Sessions</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end mr-6">
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Global Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black text-stone-900">ENCRYPTED</span>
                        </div>
                    </div>
                    {(profile?.role === 'boardMember' || profile?.role === 'president') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-stone-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-600 transition-all shadow-xl shadow-stone-900/10 group active:scale-95"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            Initiate Session
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Advanced Search & Control Bar */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="IDENTIFY SESSION BY TITLE OR AGENDA..."
                        className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border border-stone-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-black text-[10px] uppercase tracking-widest text-stone-900 placeholder:text-stone-300"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-full px-6 bg-white border border-stone-100 rounded-2xl flex items-center gap-3 hover:bg-stone-50 transition-all">
                        <Filter size={16} className="text-stone-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">Archive Filter</span>
                    </button>
                    <div className="h-full w-[1px] bg-stone-100 mx-2" />
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Total: <span className="text-stone-900">{filtered.length} Sessions</span></p>
                </div>
            </div>

            {/* Meeting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.length === 0 && !loading ? (
                    <div className="col-span-full py-32 text-center bg-stone-50/50 rounded-[3rem] border border-dashed border-stone-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-100 shadow-sm transition-transform hover:scale-110 duration-500">
                             <Calendar className="text-stone-200" size={32} />
                        </div>
                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.3em]">Archival Vacuum: No Strategy Syncs Detected</p>
                    </div>
                ) : (
                    filtered.map((m, idx) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => router.push(`/board/meetings/${m.id}`)}
                            className="bg-white p-7 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-900/5 group hover:border-amber-500/30 hover:scale-[1.02] transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col justify-between"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-stone-900 pointer-events-none group-hover:text-amber-500 group-hover:opacity-[0.05] transition-all duration-700">
                                <Calendar size={120} />
                            </div>

                            <div>
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col items-center justify-center text-stone-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-sm">
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                            {new Date(m.date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-2xl font-black leading-none mt-0.5">
                                            {new Date(m.date).getDate()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm transition-colors duration-500 ${
                                            m.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            m.status === 'ongoing' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' : 
                                            m.status === 'expired' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {m.status}
                                        </div>
                                        {m.status === 'planned' && <Countdown date={m.date} />}
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Strategy Sync</p>
                                        <div className="flex gap-2">
                                            {profile?.role === 'president' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/board/meetings/comment?id=${m.id}`); }}
                                                    className="p-2 rounded-lg bg-stone-50 text-stone-400 hover:bg-stone-950 hover:text-amber-500 transition-all"
                                                    title="View Comments"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedMeeting(m); setCommentModalOpen(true); }}
                                                className="p-2 rounded-lg bg-stone-50 text-stone-400 hover:bg-stone-950 hover:text-amber-500 transition-all"
                                                title="Add Pre-Meeting Comment"
                                            >
                                                <MessageSquarePlus size={12} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); copyMeetingLink(m.id); }}
                                                className="p-2 rounded-lg bg-stone-50 text-stone-400 hover:bg-amber-500 hover:text-white transition-all"
                                            >
                                                <Share2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-stone-900 tracking-tight leading-tight uppercase line-clamp-2 min-h-[2.5rem]">
                                        {m.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 pt-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-100/50">
                                            <Clock size={10} className="text-amber-500" />
                                            <span className="text-[9px] font-black text-stone-600 uppercase tracking-widest">
                                                {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-100/50">
                                            <Users size={10} className="text-stone-400" />
                                            <span className="text-[9px] font-black text-stone-600 uppercase tracking-widest">
                                                {m.attendees?.length || 0} ARCHIVED
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-50 flex items-center justify-between group/btn">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1">Agenda Focus</span>
                                    <p className="text-[10px] text-stone-500 font-bold truncate max-w-[150px]">{m.agenda}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-950 group-hover:text-amber-500 transition-all duration-500 shadow-sm translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Imperial Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-stone-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                           <div className="w-1 h-3 bg-amber-500 rounded-full" />
                                           <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em]">Strategy Configuration</span>
                                        </div>
                                        <h2 className="text-xl font-black text-stone-900 tracking-tighter uppercase leading-none">Initiate Session</h2>
                                    </div>
                                    <button 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 rounded-full transition-colors text-stone-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Session Title</label>
                                            <input
                                                required
                                                value={newMeeting.title}
                                                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                                placeholder="DEFINTIVE TITLE..."
                                                className="w-full px-5 py-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-black text-[10px] uppercase tracking-widest text-stone-900"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Timeline</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={newMeeting.date}
                                                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                                                className="w-full px-5 py-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-black text-[10px] uppercase tracking-widest text-stone-900"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Duration (Hours)</label>
                                            <input
                                                required
                                                type="number"
                                                min="0.5"
                                                step="0.5"
                                                value={newMeeting.durationHours}
                                                onChange={(e) => setNewMeeting({ ...newMeeting, durationHours: parseFloat(e.target.value) })}
                                                className="w-full px-5 py-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-black text-[10px] uppercase tracking-widest text-stone-900"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Invited Roles</label>
                                            <div className="flex flex-wrap gap-2 p-2 bg-stone-50/50 rounded-2xl border border-stone-100">
                                                {["member", "investor", "president", "treasurer", "secretary", "boardMember"].map((role) => (
                                                    <label key={role} className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={newMeeting.invitedRoles.includes(role)}
                                                            onChange={(e) => {
                                                                const roles = e.target.checked 
                                                                    ? [...newMeeting.invitedRoles, role]
                                                                    : newMeeting.invitedRoles.filter(r => r !== role);
                                                                setNewMeeting({ ...newMeeting, invitedRoles: roles });
                                                            }}
                                                            className="accent-amber-500"
                                                        />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-600">{role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Legislative Agenda</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={newMeeting.agenda}
                                                onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                                                placeholder="OUTLINE CORE OBJECTIVES..."
                                                className="w-full px-5 py-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-black text-[10px] uppercase tracking-widest text-stone-900 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={creating}
                                        className="w-full py-5 rounded-2xl bg-stone-950 text-white font-black uppercase tracking-[0.3em] text-[10px] hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4 shadow-xl shadow-stone-900/10 active:scale-95"
                                    >
                                        {creating ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                <CheckCircle2 size={16} />
                                                Finalize Archive Entry
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <MeetingCommentModal 
                isOpen={commentModalOpen}
                onClose={() => {
                    setCommentModalOpen(false);
                    setSelectedMeeting(null);
                }}
                meeting={selectedMeeting}
            />

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}

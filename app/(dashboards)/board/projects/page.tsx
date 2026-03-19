"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Filter, FolderGit2, Calendar, 
    ChevronRight, ArrowRight, Loader2, MessageCircle,
    Shield, ClipboardList, AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getProjectDrafts } from "@/lib/firebase/firestore";
import { ProjectDraftModal } from "@/components/modals/ProjectDraftModal";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import type { ProjectDraft } from "@/lib/types";

export default function BoardProjectsPage() {
    const { profile } = useAuth();
    const [drafts, setDrafts] = useState<ProjectDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedDraft, setSelectedDraft] = useState<ProjectDraft | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDrafts = async () => {
        if (!profile) return;
        try {
            const data = await getProjectDrafts(profile.role, profile.uid);
            setDrafts(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load strategic intelligence");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, [profile]);

    const filteredDrafts = drafts.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             d.createdByName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Accessing Intelligence Feed...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-amber-500 shadow-xl border border-stone-800">
                            <Shield size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Strategic Review Command</span>
                    </div>
                    <h1 className="text-4xl font-black text-stone-900 uppercase tracking-tighter leading-none">
                        Project <span className="text-amber-500">Reviews</span>
                    </h1>
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest italic">Review Incoming Proposals and Provide Executive Feedback</p>
                </div>
            </div>

            {}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-2 rounded-3xl bg-white shadow-sm border border-stone-100">
                <div className="flex-1 flex items-center gap-3 px-4 w-full">
                    <Search size={18} className="text-stone-400" />
                    <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="FILTER BY TITLE OR INVESTOR..."
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-full text-stone-600 placeholder:text-stone-300"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-stone-50 rounded-2xl w-full lg:w-auto">
                    {['all', 'submitted', 'under_review', 'feedback_given'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === status 
                                ? 'bg-white text-stone-900 shadow-sm border border-stone-200' 
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrafts.map((draft) => (
                    <motion.div 
                        key={draft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        onClick={() => { setSelectedDraft(draft); setIsModalOpen(true); }}
                        className="group relative bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all cursor-pointer overflow-hidden"
                    >
                        {}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${
                            draft.status === 'submitted' ? 'bg-blue-500 animate-pulse' :
                            draft.status === 'under_review' ? 'bg-indigo-500' :
                            draft.status === 'feedback_given' ? 'bg-amber-500' :
                            'bg-stone-900'
                        }`} />

                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
                                        {draft.createdByName.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-tight text-stone-900">{draft.createdByName}</span>
                                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-400">Investor</span>
                                    </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                    draft.status === 'submitted' ? 'bg-blue-50 text-blue-600' :
                                    draft.status === 'under_review' ? 'bg-indigo-50 text-indigo-600' :
                                    'bg-amber-50 text-amber-600'
                                }`}>
                                    {draft.status.replace('_', ' ')}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                                    {draft.title}
                                </h3>
                                <p className="text-[11px] font-medium text-stone-400 line-clamp-2 italic leading-relaxed">
                                    {draft.description || "No strategic overview provided yet..."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                                    <p className="text-[7px] font-black text-stone-400 uppercase tracking-widest">Readiness</p>
                                    <p className="text-[10px] font-bold text-stone-600">
                                        {draft.todos?.filter(t => t.completed).length}/{draft.todos?.length || 0} STEPS
                                    </p>
                                </div>
                                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                                    <p className="text-[7px] font-black text-stone-400 uppercase tracking-widest">Feedback</p>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-stone-600">
                                        <MessageCircle size={10} /> {draft.comments?.length || 0} ENTRIES
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-[8px] font-black text-stone-300 uppercase tracking-widest">
                                    <Calendar size={10} /> SUBMITTED {formatDate(draft.updatedAt)}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-500">
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {filteredDrafts.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-stone-100 rounded-[3rem]">
                        <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200">
                            <FolderGit2 size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-stone-900 uppercase tracking-widest">No strategic proposals</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Pending review requests will appear here</p>
                        </div>
                    </div>
                )}
            </div>

            <ProjectDraftModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                draft={selectedDraft}
                onUpdate={fetchDrafts}
            />
        </div>
    );
}

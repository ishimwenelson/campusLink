"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, Search, Filter, FolderGit2, Calendar, 
    ChevronRight, ArrowRight, Loader2, MessageCircle,
    ClipboardList, AlertCircle, Trash2
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getProjectDrafts, createProjectDraft, deleteProjectDraft } from "@/lib/firebase/firestore";
import { ProjectDraftModal } from "@/components/modals/ProjectDraftModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import type { ProjectDraft } from "@/lib/types";

export default function InvestorProjectsPage() {
    const { profile } = useAuth();
    const [drafts, setDrafts] = useState<ProjectDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedDraft, setSelectedDraft] = useState<ProjectDraft | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDrafts = async () => {
        if (!profile) return;
        try {
            const data = await getProjectDrafts(profile.role, profile.uid);
            setDrafts(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load intelligence feed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, [profile]);

    const handleCreateDraft = async () => {
        if (!profile) return;
        setIsCreating(true);
        try {
            const newDraft: Omit<ProjectDraft, 'id'> = {
                title: "New Strategic Project",
                description: "",
                category: 'investment',
                status: 'draft',
                createdBy: profile.uid,
                createdByName: profile.fullName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                todos: [],
                comments: []
            };
            const id = await createProjectDraft(newDraft);
            toast.success("New draft initialized");
            await fetchDrafts();
            
            const created = await getProjectDrafts(profile.role, profile.uid);
            const draft = created.find(d => d.id === id);
            if (draft) {
                setSelectedDraft(draft);
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error(err);
            toast.error("Initialization failed");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDraftToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!draftToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProjectDraft(draftToDelete);
            toast.success("Intelligence draft terminated");
            setIsDeleteModalOpen(false);
            setDraftToDelete(null);
            fetchDrafts();
        } catch (err) {
            console.error(err);
            toast.error("Termination failed");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredDrafts = drafts.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             d.description.toLowerCase().includes(searchTerm.toLowerCase());
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
                            <FolderGit2 size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Project Operations</span>
                    </div>
                    <h1 className="text-4xl font-black text-stone-900 uppercase tracking-tighter leading-none">
                        Project <span className="text-amber-500">Drafts</span>
                    </h1>
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest italic">Draft, Collaborate, and Push Strategic Initiatives</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleCreateDraft}
                        disabled={isCreating}
                        className="flex items-center gap-2 bg-stone-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-stone-800 transition-all border border-stone-800 group"
                    >
                        {isCreating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} className="group-hover:rotate-90 transition-transform" />}
                        New Project Initiative
                    </button>
                </div>
            </div>

            {}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-2 rounded-3xl bg-white shadow-sm border border-stone-100">
                <div className="flex-1 flex items-center gap-3 px-4 w-full">
                    <Search size={18} className="text-stone-400" />
                    <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="SEARCH INTELLIGENCE..."
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-full text-stone-600 placeholder:text-stone-300"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-stone-50 rounded-2xl w-full lg:w-auto">
                    {['all', 'draft', 'submitted', 'feedback_given'].map((status) => (
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
                            draft.status === 'draft' ? 'bg-stone-100' :
                            draft.status === 'submitted' ? 'bg-blue-500' :
                            draft.status === 'feedback_given' ? 'bg-amber-500' :
                            'bg-stone-900'
                        }`} />

                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-stone-50 text-stone-400 group-hover:text-amber-500 transition-colors">
                                        <ClipboardList size={16} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{draft.category}</span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${
                                    draft.status === 'draft' ? 'bg-stone-300' :
                                    draft.status === 'submitted' ? 'bg-blue-500 animate-pulse' :
                                    'bg-amber-500'
                                }`} />
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
                                    <p className="text-[7px] font-black text-stone-400 uppercase tracking-widest">Roadmap</p>
                                    <p className="text-[10px] font-bold text-stone-600">
                                        {draft.todos?.filter(t => t.completed).length}/{draft.todos?.length || 0} COMPLETED
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
                                    <Calendar size={10} /> {formatDate(draft.updatedAt)}
                                </div>
                                <div className="flex items-center gap-2">
                                    {(draft.status === 'draft' || draft.status === 'feedback_given') && (
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, draft.id)}
                                            className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-500">
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {filteredDrafts.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-stone-100 rounded-[3rem]">
                        <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200">
                            <AlertCircle size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-stone-900 uppercase tracking-widest">No intelligence found</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Initialize a new project to begin</p>
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

            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Terminate Draft?"
                message="Are you sure you want to permanently delete this strategic intelligence draft? This process cannot be reversed."
                loading={isDeleting}
            />
        </div>
    );
}


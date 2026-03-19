"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Plus, CheckCircle2, Circle, MessageSquare, 
    Send, Save, Loader2, Trash2, ClipboardList,
    ChevronRight, Info
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateProjectDraft, addDraftComment } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import type { ProjectDraft, DraftTodo, ProposalComment } from "@/lib/types";

interface ProjectDraftModalProps {
    isOpen: boolean;
    onClose: () => void;
    draft: ProjectDraft | null;
    onUpdate: () => void;
}

export function ProjectDraftModal({ isOpen, onClose, draft, onUpdate }: ProjectDraftModalProps) {
    const { profile } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [todos, setTodos] = useState<DraftTodo[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'todos' | 'comments'>('content');

    useEffect(() => {
        if (draft) {
            setTitle(draft.title);
            setDescription(draft.description);
            setTodos(draft.todos || []);
        } else {
            setTitle("");
            setDescription("");
            setTodos([]);
        }
    }, [draft]);

    const isOwner = draft?.createdBy === profile?.uid;
    const isBoard = profile?.role === 'boardMember' || profile?.role === 'president';
    const canEdit = isOwner && (draft?.status === 'draft' || draft?.status === 'feedback_given');

    const handleSave = async (submit = false) => {
        if (!draft || !profile) return;
        setLoading(true);
        try {
            const updates: Partial<ProjectDraft> = {
                title,
                description,
                todos,
                status: submit ? 'submitted' : draft.status
            };
            await updateProjectDraft(draft.id, updates);
            toast.success(submit ? "Project submitted to Board" : "Draft saved successfully");
            onUpdate();
            if (submit) onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to sync intelligence");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTodo = () => {
        if (!newTodo.trim()) return;
        const todo: DraftTodo = {
            id: Math.random().toString(36).substr(2, 9),
            task: newTodo.trim(),
            completed: false
        };
        setTodos([...todos, todo]);
        setNewTodo("");
    };

    const toggleTodo = (id: string) => {
        if (!canEdit) return;
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = (id: string) => {
        if (!canEdit) return;
        setTodos(todos.filter(t => t.id !== id));
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !draft || !profile) return;
        setLoading(true);
        try {
            const comment: ProposalComment = {
                userId: profile.uid,
                userName: profile.fullName,
                text: commentText.trim(),
                timestamp: new Date().toISOString()
            };
            await addDraftComment(draft.id, comment);
            
            // If board member comments, mark as feedback_given or under_review
            if (isBoard && draft.status === 'submitted') {
                await updateProjectDraft(draft.id, { status: 'feedback_given' });
            }

            setCommentText("");
            toast.success("Feedback recorded");
            onUpdate();
        } catch (err) {
            console.error(err);
            toast.error("Transmission failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
                >
                    {/* Left Panel: Sidebar info */}
                    <div className="lg:w-1/3 bg-stone-900 p-8 text-white flex flex-col">
                        <div className="flex-1 space-y-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-stone-900 shadow-lg shadow-amber-500/20">
                                        <ClipboardList size={16} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Draft Protocol</span>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">
                                    Project <span className="text-amber-500">Draft</span>
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-stone-800/50 border border-stone-700/50 space-y-3">
                                    <div>
                                        <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Status Level</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                                draft?.status === 'draft' ? 'bg-stone-400' :
                                                draft?.status === 'submitted' ? 'bg-blue-500' :
                                                'bg-amber-500'
                                            }`} />
                                            <span className="text-[10px] font-black uppercase text-stone-300">{draft?.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Temporal Log</p>
                                        <p className="text-[10px] font-bold text-stone-400">{draft ? formatDate(draft.createdAt) : '--'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {['content', 'todos', 'comments'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                                activeTab === tab 
                                                ? 'bg-amber-500 text-stone-900 font-black' 
                                                : 'text-stone-500 hover:text-white hover:bg-stone-800'
                                            }`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tab}</span>
                                            <ChevronRight size={14} className={activeTab === tab ? 'opacity-100' : 'opacity-0'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {canEdit && (
                            <div className="pt-8 space-y-3">
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-stone-700 transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    Save Progress
                                </button>
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                    Push to Board
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Content */}
                    <div className="flex-1 bg-white p-8 overflow-y-auto min-h-[400px]">
                        <div className="flex justify-end mb-6">
                            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                                <X size={20} />
                            </button>
                        </div>

                        {activeTab === 'content' && (
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Project Narrative</p>
                                    {canEdit ? (
                                        <input 
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Mission Title..."
                                            className="w-full text-2xl font-black text-stone-900 uppercase border-b-2 border-stone-100 focus:border-amber-500 outline-none pb-2 transition-colors"
                                        />
                                    ) : (
                                        <h3 className="text-2xl font-black text-stone-900 uppercase">{title}</h3>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={12} /> Detailed Strategic Overview
                                    </p>
                                    {canEdit ? (
                                        <textarea 
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Define the scope, objectives, and impact..."
                                            rows={8}
                                            className="w-full p-6 rounded-3xl bg-stone-50 border border-stone-100 text-sm font-medium text-stone-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none transition-all italic"
                                        />
                                    ) : (
                                        <div className="p-6 rounded-3xl bg-stone-50 border border-stone-100 text-sm font-medium text-stone-600 italic leading-relaxed whitespace-pre-wrap">
                                            {description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'todos' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Execution Roadmap</p>
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded">
                                        {todos.filter(t => t.completed).length}/{todos.length} UNITS
                                    </span>
                                </div>

                                {canEdit && (
                                    <div className="flex gap-2">
                                        <input 
                                            value={newTodo}
                                            onChange={(e) => setNewTodo(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                                            placeholder="Add tactical step..."
                                            className="flex-1 px-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-[11px] font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                        <button 
                                            onClick={handleAddTodo}
                                            className="p-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-all"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {todos.map((todo) => (
                                        <div 
                                            key={todo.id}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                todo.completed ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-white border-stone-100 shadow-sm'
                                            }`}
                                        >
                                            <button 
                                                onClick={() => toggleTodo(todo.id)}
                                                className={`transition-colors ${todo.completed ? 'text-emerald-500' : 'text-stone-300 hover:text-amber-500'}`}
                                            >
                                                {todo.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                            </button>
                                            <span className={`text-[11px] font-bold flex-1 ${todo.completed ? 'line-through text-emerald-900' : 'text-stone-700'}`}>
                                                {todo.task}
                                            </span>
                                            {canEdit && (
                                                <button onClick={() => deleteTodo(todo.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {todos.length === 0 && (
                                        <div className="py-12 text-center border-2 border-dashed border-stone-100 rounded-[2rem]">
                                            <p className="text-[10px] font-black text-stone-300 uppercase italic">No tactical steps defined</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="flex flex-col h-full space-y-6">
                                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Strategic Feedback Thread</p>
                                
                                <div className="flex-1 space-y-4">
                                    {draft?.comments.map((c, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-[10px] font-black uppercase text-stone-400">
                                                {c.userName.charAt(0)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-stone-900 uppercase">{c.userName}</span>
                                                    <span className="text-[8px] font-bold text-stone-400 font-mono">{formatDate(c.timestamp)}</span>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-[11px] font-medium text-stone-600 italic">
                                                    "{c.text}"
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!draft?.comments || draft.comments.length === 0) && (
                                        <div className="py-12 text-center">
                                             <MessageSquare className="mx-auto text-stone-100 mb-2" size={32} />
                                             <p className="text-[10px] font-black text-stone-300 uppercase italic">No intelligence reported yet</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-stone-100 flex gap-2">
                                    <textarea 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add feedback or strategic info..."
                                        rows={2}
                                        className="flex-1 px-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-[11px] font-medium outline-none focus:ring-2 focus:ring-amber-500 resize-none italic"
                                    />
                                    <button 
                                        onClick={handleAddComment}
                                        disabled={loading || !commentText.trim()}
                                        className="px-6 rounded-xl bg-stone-900 text-amber-500 hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center justify-center"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

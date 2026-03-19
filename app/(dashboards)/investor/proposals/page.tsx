"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Vote, Plus, MessageSquare, CheckCircle2, X,
    Search, ChevronRight, User, Send, Loader2,
    ThumbsUp, ThumbsDown, Calendar, AlertCircle, BarChart3,
    Paperclip, FileText, ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    subscribeToProposals, createProposal,
    voteOnProposal, addProposalComment, getAllUsers
} from "@/lib/firebase/firestore";
import type { Proposal, ProposalComment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatDate } from "@/lib/utils/format";

export default function ProposalsPage() {
    const { profile } = useAuth();
    const [proposals, setProposals]       = useState<Proposal[]>([]);
    const [loading, setLoading]           = useState(true);
    const [activeTab, setActiveTab]       = useState<"all" | "active" | "approved" | "rejected">("all");
    const [searchQuery, setSearchQuery]   = useState("");
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [voterCount, setVoterCount]     = useState(0);
    const [newTitle, setNewTitle]         = useState("");
    const [newDesc, setNewDesc]           = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [propFile, setPropFile]         = useState<File | null>(null);
    const [commentText, setCommentText]   = useState("");

    useEffect(() => {
        const unsub = subscribeToProposals((data) => {
            setProposals(data);
            setLoading(false);
        });
        getAllUsers().then(users => {
            setVoterCount(users.filter(u => ["investor", "boardMember", "president"].includes(u.role)).length);
        });

        
        const params = new URLSearchParams(window.location.search);
        if (params.get("new") === "true" && ["president", "boardMember"].includes(profile?.role || "")) {
            setIsModalOpen(true);
        }

        return () => unsub();
    }, [profile]);

    const handleCreateProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSubmitting(true);
        try {
            let attachmentUrl = "";
            if (propFile) {
                const formData = new FormData();
                formData.append("file", propFile);
                formData.append("folder", "proposals");
                formData.append("userId", profile.uid);

                const res = await fetch("/api/upload/github", { method: "POST", body: formData });
                if (!res.ok) throw new Error("Document upload failed");
                const data = await res.json();
                attachmentUrl = data.url;
            }

            await createProposal({
                title: newTitle, description: newDesc,
                proposedBy: profile.uid, proposedByName: profile.fullName,
                proposedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                category: "other", requiredPercentage: 70, status: "under_review",
                votes: { yes: 0, no: 0, totalVoters: voterCount, voters: {} }, comments: [],
                ...(attachmentUrl ? { attachmentUrl } : {})
            });
            toast.success("Proposal submitted! ");
            setIsModalOpen(false); setNewTitle(""); setNewDesc(""); setPropFile(null);
        } catch (err: any) { 
            console.error(err);
            toast.error(err.message || "Failed to submit proposal"); 
        }
        finally { setIsSubmitting(false); }
    };

    const handleVote = async (proposalId: string, vote: "yes" | "no") => {
        if (!profile) return;
        try {
            await voteOnProposal(proposalId, profile.uid, vote, voterCount);
            toast.success(`Vote "${vote}" registered!`);
        } catch { toast.error("Failed to register vote"); }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !selectedProposal || !commentText.trim()) return;
        try {
            await addProposalComment(selectedProposal.id, {
                userId: profile.uid, userName: profile.fullName,
                text: commentText, timestamp: new Date().toISOString()
            } as ProposalComment);
            setCommentText("");
        } catch { toast.error("Failed to add comment"); }
    };

    const filtered = proposals.filter(p => {
        
        if (p.status === "under_review" && p.proposedBy !== profile?.uid) return false;
        
        const matchTab    = activeTab === "all" || p.status === activeTab;
        const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    const openCount     = proposals.filter(p => p.status === "active" || p.status === "pending").length;
    const approvedCount = proposals.filter(p => p.status === "approved").length;
    const rejectedCount = proposals.filter(p => p.status === "rejected").length;
    const myVoted       = proposals.filter(p => profile && p.votes.voters?.[profile.uid]).length;

    if (loading) return (
        <div className="flex items-center justify-center h-screen -mt-20">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-amber-500" size={40} />
                <p className="text-xs text-stone-400 font-black uppercase tracking-widest animate-pulse">Loading Governance Hub…</p>
            </div>
        </div>
    );

    const canSubmit = ["president", "boardMember"].includes(profile?.role || "");

    return (
        <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-20 max-w-[1500px] mx-auto space-y-8">

            {}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="tracking-tight text-3xl font-black text-stone-900 leading-none">
                        Strategic <span className="text-amber-500">Decisions</span>
                    </h1>
                    <p className="text-stone-500 font-medium text-xs mt-2 max-w-xl">
                        Community proposals for collective governance and institutional investment direction.
                    </p>
                </div>
                {canSubmit && (
                    <motion.button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-amber-600 transition-all shadow-xl"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    >
                        <Plus size={16} /> New Proposal
                    </motion.button>
                )}
            </div>

            {}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="All Proposals"    value={proposals.length}      icon={Vote}        color="gold"   delay={0} />
                <StatCard title="Active Votes"     value={`${openCount} open`}   icon={BarChart3}   color="blue"   delay={0.05} />
                <StatCard title="Passed"           value={approvedCount}          icon={CheckCircle2} color="green" delay={0.1} />
                <StatCard title="My Participation" value={`${myVoted} votes`}    icon={User}        color="purple" delay={0.15} />
            </div>

            {}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-2 rounded-[2rem] border border-stone-100 shadow-sm">
                <div className="flex items-center p-1 bg-stone-50 rounded-[1.5rem] gap-1">
                    {(["all", "active", "approved", "rejected"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab
                                    ? "bg-white text-stone-900 shadow-sm border border-stone-100"
                                    : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            {tab} {tab === "all" ? `(${proposals.length})` : tab === "active" ? `(${openCount})` : tab === "approved" ? `(${approvedCount})` : `(${rejectedCount})`}
                        </button>
                    ))}
                </div>
                <div className="relative group w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" size={15} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search proposals…"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-[11px] font-medium text-stone-700 placeholder:text-stone-300 transition-all"
                    />
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                    {filtered.map((proposal, i) => (
                        <ProposalCard
                            key={proposal.id}
                            proposal={proposal}
                            index={i}
                            onView={() => setSelectedProposal(proposal)}
                            onVote={handleVote}
                            currentUserRole={profile?.role || ""}
                            currentUserId={profile?.uid || ""}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-stone-100 shadow-xl">
                    <Vote className="mx-auto mb-4 text-stone-200" size={40} />
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">No proposals match your criteria</p>
                </div>
            )}

            {}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-stone-950/50 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden z-10 shadow-2xl"
                        >
                            <div className="bg-stone-950 p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-white text-base tracking-tight uppercase leading-none">Submit Proposal</h3>
                                    <p className="text-stone-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Draft a new strategic initiative</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateProposal} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">Proposal Title</label>
                                    <input required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Clear and impactful title…"
                                        className="w-full px-5 py-3 rounded-xl border border-stone-100 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all text-sm font-bold placeholder:text-stone-300" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Detailed Description</label>
                                    <textarea required rows={4} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                                        placeholder="Outline the benefits, costs, and strategic value…"
                                        className="w-full px-5 py-3 rounded-xl border border-stone-100 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all text-sm font-medium placeholder:text-stone-300 resize-none leading-relaxed" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Supporting Document (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={e => setPropFile(e.target.files?.[0] || null)}
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={cn(
                                            "flex items-center justify-between w-full px-5 py-3 rounded-xl border transition-all",
                                            propFile ? "bg-amber-50/50 border-amber-200 text-amber-900" : "bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <Paperclip size={16} className={propFile ? "text-amber-500" : "text-stone-400"} />
                                                <span className="text-sm font-medium truncate max-w-[200px]">
                                                    {propFile ? propFile.name : "Attach proposal document..."}
                                                </span>
                                            </div>
                                            {propFile && <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-lg shadow-sm">Selected</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                                    <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                        Submitted proposals will be placed <span className="font-bold">under review</span> for Presidential authorization before becoming available for member voting.
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-stone-500 hover:bg-stone-50 transition-all border border-stone-100">
                                        Cancel
                                    </button>
                                    <motion.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.98 }}
                                        className="flex-[2] py-3.5 bg-stone-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 transition-all shadow-xl disabled:opacity-50">
                                        {isSubmitting ? <><Loader2 className="animate-spin" size={14} /> Submitting…</> : <><Plus size={14} /> Submit Proposal</>}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {}
            <AnimatePresence>
                {selectedProposal && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedProposal(null)}
                            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
                        >
                            {}
                            <div className="bg-stone-950 p-6 flex-shrink-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest mb-2",
                                            (selectedProposal.status === "active" || selectedProposal.status === "pending")
                                                ? "bg-amber-500/20 text-amber-400"
                                                : selectedProposal.status === "approved"
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-red-500/20 text-red-400"
                                        )}>{selectedProposal.status}</span>
                                        <h2 className="font-black text-white text-base tracking-tight leading-tight line-clamp-2">{selectedProposal.title}</h2>
                                        <div className="flex items-center gap-2 mt-2 text-stone-500">
                                            <User size={11} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{selectedProposal.proposedByName} · {formatDate(selectedProposal.proposedAt)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 flex-shrink-0">
                                        {selectedProposal.attachmentUrl && (
                                            <a 
                                                href={selectedProposal.attachmentUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 text-stone-300 hover:text-white transition-all border border-white/5"
                                                title="View Document"
                                            >
                                                <FileText size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Doc</span>
                                            </a>
                                        )}
                                        <button onClick={() => setSelectedProposal(null)}
                                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="grid grid-cols-3 divide-x divide-stone-100 border-b border-stone-100 flex-shrink-0">
                                {[
                                    { label: "Affirm", value: selectedProposal.votes.yes, color: "text-green-600" },
                                    { label: "Oppose", value: selectedProposal.votes.no, color: "text-red-500" },
                                    { label: "Quorum", value: `${Math.round((selectedProposal.votes.yes / Math.max(selectedProposal.votes.totalVoters * 0.7, 1)) * 100)}%`, color: "text-amber-600" },
                                ].map(s => (
                                    <div key={s.label} className="p-4 text-center">
                                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className={cn("text-lg font-black tracking-tighter", s.color)}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {}
                                <section>
                                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3">Proposal Details</h3>
                                    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                                        <p className="text-[11px] text-stone-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedProposal.description}</p>
                                    </div>
                                </section>

                                {}
                                <section>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Consensus Progress</h3>
                                        <span className="text-[9px] font-black text-stone-900">
                                            {selectedProposal.votes.yes} / {Math.ceil(selectedProposal.votes.totalVoters * 0.7)} needed
                                        </span>
                                    </div>
                                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-amber-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((selectedProposal.votes.yes / Math.max(selectedProposal.votes.totalVoters * 0.7, 1)) * 100, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <p className="text-[8px] text-stone-400 font-bold mt-1">70% quorum required out of {selectedProposal.votes.totalVoters} eligible voters</p>
                                </section>

                                {}
                                <section>
                                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3">Discussion ({selectedProposal.comments.length})</h3>
                                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
                                        {selectedProposal.comments.length === 0 ? (
                                            <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                                                <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">Start the conversation</p>
                                            </div>
                                        ) : selectedProposal.comments.map((c, ci) => (
                                            <div key={ci} className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-white hover:border-amber-100 transition-all">
                                                <div className="w-7 h-7 rounded-xl bg-stone-900 flex items-center justify-center text-[9px] font-black text-white flex-shrink-0">
                                                    {c.userName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-[9px] font-black text-stone-900 uppercase tracking-tight">{c.userName}</p>
                                                        <p className="text-[8px] text-stone-400 font-bold">{new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                                                    </div>
                                                    <p className="text-[11px] text-stone-600 font-medium leading-snug">{c.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleAddComment} className="flex gap-3 p-3 rounded-2xl border border-stone-100 bg-stone-50 focus-within:border-amber-400/30 focus-within:bg-white transition-all">
                                        <input
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Add your strategic thought…"
                                            className="flex-1 bg-transparent border-none text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-0 text-xs font-medium"
                                        />
                                        <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 transition-all">
                                            <Send size={11} /> Send
                                        </button>
                                    </form>
                                </section>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ProposalCard({ proposal, index, onView, onVote, currentUserRole, currentUserId }: any) {
    const hasVoted       = proposal.votes.voters[currentUserId] !== undefined;
    const myVote         = proposal.votes.voters[currentUserId];
    const yesCount       = proposal.votes.yes || 0;
    const threshold      = Math.ceil(proposal.votes.totalVoters * 0.7);
    const progressPct    = Math.min((yesCount / Math.max(threshold, 1)) * 100, 100);
    const yesPercent     = proposal.votes.totalVoters > 0 ? (yesCount / proposal.votes.totalVoters) * 100 : 0;
    const isOpen         = proposal.status === "active" || proposal.status === "pending";
    const canVote        = ["investor", "boardMember", "president"].includes(currentUserRole) && isOpen && !hasVoted;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onView()}
            className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl hover:border-amber-500/20 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col cursor-pointer group/card"
        >
            {}
            <div className="p-5 border-b border-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                        isOpen ? "bg-amber-50 text-amber-700 border-amber-100"
                        : proposal.status === "approved" ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    )}>
                        {isOpen ? "Active" : proposal.status}
                    </span>
                    {yesPercent >= 70 && isOpen && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                             Quorum
                        </span>
                    )}
                    {hasVoted && (
                        <span className="px-2 py-0.5 bg-stone-50 text-stone-500 border border-stone-100 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            Voted {myVote === "yes" ? "" : ""}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-stone-400 text-[9px] font-bold">
                    <MessageSquare size={11} /> {proposal.comments.length}
                </div>
            </div>

            {}
            <div className="p-5 flex-1 space-y-4">
                <div>
                    <h3 className="font-black text-stone-900 text-sm leading-tight tracking-tight line-clamp-2 group-hover/card:text-amber-600 transition-colors uppercase">{proposal.title}</h3>
                    <p className="text-stone-500 text-[11px] leading-relaxed font-medium mt-2 line-clamp-2">{proposal.description}</p>
                </div>

                {}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-[9px] font-black text-white">
                            {proposal.proposedByName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">by {proposal.proposedByName.split(" ")[0]}</p>
                        </div>
                    </div>
                    {proposal.attachmentUrl && (
                        <a 
                            href={proposal.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-sm"
                            title="View document"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <FileText size={12} className="text-stone-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Doc</span>
                        </a>
                    )}
                    <span className="ml-auto text-[8px] text-stone-400 font-bold flex items-center gap-1">
                        <Calendar size={9} /> {new Date(proposal.proposedAt).toLocaleDateString()}
                    </span>
                </div>

                {}
                <div className="p-4 rounded-2xl bg-stone-950 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Consensus</span>
                        <span className="text-white font-black text-sm">{Math.round(yesPercent)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 rounded-xl bg-white/5">
                            <p className="text-[7px] font-black text-green-400 uppercase tracking-widest">Affirm</p>
                            <p className="text-white font-black text-base">{proposal.votes.yes}</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-white/5">
                            <p className="text-[7px] font-black text-red-400 uppercase tracking-widest">Oppose</p>
                            <p className="text-white font-black text-base">{proposal.votes.no}</p>
                        </div>
                    </div>
                </div>

                {}
                {canVote ? (
                    <div className="flex gap-2">
                        <motion.button
                            onClick={e => { e.stopPropagation(); onVote(proposal.id, "yes"); }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all"
                        >
                            <ThumbsUp size={12} /> Affirm
                        </motion.button>
                        <motion.button
                            onClick={e => { e.stopPropagation(); onVote(proposal.id, "no"); }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-stone-200"
                        >
                            <ThumbsDown size={12} /> Oppose
                        </motion.button>
                    </div>
                ) : hasVoted ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                        <CheckCircle2 size={12} className="text-amber-500" />
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Participation Confirmed</span>
                    </div>
                ) : null}
            </div>

            {}
            <div className="px-5 py-3.5 border-t border-stone-50 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400 group-hover/card:text-amber-600 transition-all">
                <span>Engage Discussion</span>
                <ChevronRight size={14} className="group-hover/card:translate-x-1 transition-transform" />
            </div>
        </motion.div>
    );
}

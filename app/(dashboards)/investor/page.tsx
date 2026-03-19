"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getProposals, createProposal, voteOnProposal, addProposalComment, getAllUsers } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Vote, Plus, ThumbsUp, ThumbsDown, MessageCircle, X, Loader2,
    TrendingUp, Shield, DollarSign, CheckCircle, AlertCircle, Send,
    Users, BarChart3, Clock, Calendar, Paperclip, FileText, ExternalLink
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatDate, formatRF } from "@/lib/utils/format";
import type { Proposal, CampusUser } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export default function InvestorDashboard() {
    const { profile } = useAuth();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVoters, setTotalVoters] = useState(10);
    const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
    const [totalFund, setTotalFund] = useState(0);

    useEffect(() => {
        Promise.all([getProposals(), getAllUsers()]).then(([p, u]) => {
            setProposals(p);
            setTotalVoters(u.filter(u => ["investor", "president", "boardMember"].includes(u.role)).length || 10);
            setTotalFund(u.reduce((sum, user) => sum + (user.paidSoFar || 0), 0));
            setLoading(false);
        });
    }, []);

    const handleVote = async (proposal: Proposal, vote: "yes" | "no") => {
        if (!profile) return;
        if (proposal.votes.voters?.[profile.uid]) {
            toast.error("You've already voted on this proposal");
            return;
        }
        await voteOnProposal(proposal.id, profile.uid, vote, totalVoters);
        const updated = await getProposals();
        setProposals(updated);
        toast.success(`Vote cast: ${vote === "yes" ? " Yes" : " No"}`);
    };

    const handleComment = async (proposalId: string) => {
        if (!profile || !commentTexts[proposalId]?.trim()) return;
        await addProposalComment(proposalId, {
            userId: profile.uid,
            userName: profile.fullName,
            text: commentTexts[proposalId],
            timestamp: new Date().toISOString(),
        });
        setCommentTexts(prev => ({ ...prev, [proposalId]: "" }));
        const updated = await getProposals();
        setProposals(updated);
    };


    if (loading) return (
        <div className="flex items-center justify-center h-screen -mt-20">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-amber-500" size={40} />
                <p className="text-xs text-stone-400 font-black uppercase tracking-widest animate-pulse">Loading Investment Hub...</p>
            </div>
        </div>
    );

    const openCount     = proposals.filter(p => p.status === "active" || p.status === "pending").length;
    const approvedCount = proposals.filter(p => p.status === "approved").length;
    const myVotedCount  = proposals.filter(p => profile && p.votes.voters?.[profile.uid]).length;

    return (
        <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-20 max-w-[1500px] mx-auto space-y-8">

            {}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="tracking-tight text-3xl font-black text-stone-900 leading-none">
                        Investor <span className="text-amber-500">Hub</span>
                    </h1>
                    <p className="text-stone-500 font-medium text-xs mt-2 max-w-xl">
                        Vote on strategic directives, participate in governance, and track institutional capital.
                    </p>
                </div>
            </div>

            {}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Institutional Fund"  value={formatRF(totalFund)}   icon={DollarSign}  color="gold"   delay={0}    trend={{ value: 12, label: "vs last quarter" }} />
                <StatCard title="Active Proposals"    value={`${openCount} open`}   icon={Vote}        color="blue"   delay={0.05} trend={{ value: openCount, label: "pending votes" }} />
                <StatCard title="Approved Directives" value={`${approvedCount}`}    icon={CheckCircle} color="green"  delay={0.1}  trend={{ value: approvedCount, label: "passed" }} />
                <StatCard title="My Participation"    value={`${myVotedCount} votes`} icon={BarChart3} color="purple" delay={0.15} />
            </div>

            {}
            <div className="space-y-6">
                {proposals.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] border border-stone-100 shadow-xl text-center">
                        <Vote className="mx-auto mb-6 text-stone-200" size={48} />
                        <h3 className="text-base font-black text-stone-900 mb-2 uppercase tracking-tight">No Active Proposals</h3>
                        <p className="text-stone-400 font-medium text-xs max-w-xs mx-auto">The ecosystem is currently quiet. Be the first to propose a strategic initiative.</p>
                    </div>
                ) : (
                    proposals.map((p, i) => {
                        const yesPercent = p.votes.totalVoters > 0 ? (p.votes.yes / p.votes.totalVoters) * 100 : 0;
                        const hasVoted   = profile && p.votes.voters?.[profile.uid];
                        const myVote     = profile && p.votes.voters?.[profile.uid];
                        const isOpen     = p.status === "active" || p.status === "pending";

                        return (
                            <motion.div
                                key={p.id}
                                className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden hover:border-amber-500/20 transition-all duration-500"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            >
                                {}
                                <div className="p-6 border-b border-stone-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {}
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border",
                                            p.status === "approved"
                                                ? "bg-green-50 text-green-700 border-green-100"
                                                : p.status === "rejected"
                                                ? "bg-red-50 text-red-700 border-red-100"
                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                        )}>
                                            {isOpen ? "Active Vote" : p.status === "approved" ? "Passed" : "Failed"}
                                        </span>
                                        {}
                                        {yesPercent >= 70 && isOpen && (
                                            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-xl text-[8px] font-black uppercase tracking-widest border border-green-100 animate-pulse">
                                                 Quorum Reached
                                            </span>
                                        )}
                                        {}
                                        {hasVoted && (
                                            <span className="px-2.5 py-1 bg-stone-50 text-stone-500 rounded-xl text-[8px] font-black uppercase tracking-widest border border-stone-100">
                                                Voted: {myVote === "yes" ? " Yes" : " No"}
                                            </span>
                                        )}
                                    </div>
                                    {}
                                    <div className="flex items-center gap-4 text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><Calendar size={11} /> {formatDate(p.proposedAt)}</span>
                                        <span className="flex items-center gap-1.5"><MessageCircle size={11} /> {p.comments.length} comments</span>
                                    </div>
                                </div>

                                {}
                                <div className="p-6 flex flex-col lg:flex-row gap-8">
                                    {}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="font-black text-stone-900 text-lg tracking-tight leading-tight">{p.title}</h3>
                                            <p className="text-stone-500 text-xs leading-relaxed font-medium mt-2 line-clamp-3">{p.description}</p>
                                        </div>

                                        {}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 w-fit">
                                                <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-black text-xs">
                                                    {p.proposedByName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Proposed By</p>
                                                    <p className="text-[11px] font-black text-stone-700 mt-0.5">{p.proposedByName}</p>
                                                </div>
                                            </div>
                                            
                                            {p.attachmentUrl && (
                                                <a 
                                                    href={p.attachmentUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-3 h-full rounded-2xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-sm"
                                                    title="View attached document"
                                                >
                                                    <FileText size={16} className="text-stone-400" />
                                                    <div className="flex flex-col justify-center">
                                                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Supporting Document</span>
                                                        <span className="text-[10px] font-bold mt-0.5 flex items-center gap-1">Open File <ExternalLink size={10} /></span>
                                                    </div>
                                                </a>
                                            )}
                                        </div>

                                        {}
                                        {isOpen && !hasVoted ? (
                                            <div className="flex gap-3 pt-2">
                                                <motion.button
                                                    onClick={() => handleVote(p, "yes")}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-stone-900/10"
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <ThumbsUp size={13} /> Affirm
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleVote(p, "no")}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-stone-200"
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <ThumbsDown size={13} /> Oppose
                                                </motion.button>
                                            </div>
                                        ) : !isOpen ? (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-50 border border-stone-100">
                                                <div className={cn("w-2 h-2 rounded-full", p.status === "approved" ? "bg-green-500" : "bg-red-400")} />
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                                                    {p.status === "approved" ? "Directive Passed" : "Directive Failed"}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100">
                                                <CheckCircle size={12} className="text-amber-600" />
                                                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Participation Confirmed</p>
                                            </div>
                                        )}
                                    </div>

                                    {}
                                    <div className="lg:w-72 shrink-0">
                                        <div className="bg-stone-950 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden h-full">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                                            <div className="relative space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Consensus Track</span>
                                                    <span className="text-white font-black text-2xl tracking-tighter">{Math.round(yesPercent)}%</span>
                                                </div>
                                                {}
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${yesPercent}%` }}
                                                        transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.04 }}
                                                    />
                                                </div>
                                                {}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-px h-3 bg-amber-500/50 mx-auto" style={{ marginLeft: "70%" }} />
                                                </div>
                                                {}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                                        <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-1">Affirm</p>
                                                        <p className="text-white font-black text-xl tracking-tight">{p.votes.yes}</p>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Oppose</p>
                                                        <p className="text-white font-black text-xl tracking-tight">{p.votes.no}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest">Quorum: 70%</span>
                                                    <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest">{p.votes.totalVoters} voters</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="px-6 pb-6 pt-2 border-t border-stone-50 mt-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                                            <MessageCircle size={13} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Discussion ({p.comments.length})</h4>
                                    </div>

                                    {}
                                    {p.comments.length > 0 && (
                                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                                            {p.comments.map((c, ci) => (
                                                <div key={ci} className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-white hover:border-amber-100 transition-all">
                                                    <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-[9px] font-black text-white flex-shrink-0">
                                                        {c.userName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">{c.userName}</p>
                                                        <p className="text-[11px] font-medium text-stone-600 mt-0.5 leading-snug">{c.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {}
                                    <div className="flex gap-3 p-3 rounded-2xl border border-stone-100 bg-stone-50/50 focus-within:border-amber-400/30 focus-within:bg-white transition-all">
                                        <input
                                            value={commentTexts[p.id] || ""}
                                            onChange={e => setCommentTexts(prev => ({ ...prev, [p.id]: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && handleComment(p.id)}
                                            placeholder="Add to the discussion…"
                                            className="flex-1 bg-transparent border-none text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-0 text-xs font-medium px-2"
                                        />
                                        <button
                                            onClick={() => handleComment(p.id)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 transition-all"
                                        >
                                            <Send size={11} /> Send
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

        </div>
    );
}

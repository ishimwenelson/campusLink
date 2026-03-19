"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getProposals, voteOnProposal, getCampusInfo, incrementCampusInfoViews, getAllUsers, subscribeToProposals, subscribeToCampusInfo } from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import { 
  Vote, FileText, Calendar, CheckCircle, XCircle, 
  Users, Eye, MessageSquare, TrendingUp, AlertCircle, Info,
  ThumbsUp, ThumbsDown, Loader2, Plus, Bell, Megaphone,
  Clock, Star, BarChart3
} from "lucide-react";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { Proposal, CampusInfo } from "@/lib/types";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";

export default function ProjectsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"proposals" | "campus">("proposals");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [campusInfo, setCampusInfo] = useState<CampusInfo[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'yes' | 'no' | null>>({});
  const [proposalFilter, setProposalFilter] = useState<'all' | 'approved' | 'active' | 'rejected'>('all');

  useEffect(() => {
    getAllUsers().then(users => setTotalUsers(users.length));

    const unsubProposals = subscribeToProposals((p) => {
      setProposals(p);
      setLoading(false);
    });

    const unsubCampus = subscribeToCampusInfo((c) => {
      setCampusInfo(c);
      setLoading(false);
    });

    return () => {
      unsubProposals();
      unsubCampus();
    };
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;
    
    
    const votes: Record<string, 'yes' | 'no' | null> = {};
    proposals.forEach(proposal => {
      votes[proposal.id] = proposal.votes.voters[profile.uid] || null;
    });
    setUserVotes(votes);
  }, [proposals, profile?.uid]);

  const handleVote = async (proposalId: string, vote: 'yes' | 'no') => {
    if (!profile?.uid) return;
    const existingVote = userVotes[proposalId];
    
    setVoting(proposalId);
    try {
      await voteOnProposal(proposalId, profile.uid, vote, totalUsers);
      toast.success(existingVote === vote ? "Vote removed" : "Vote updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update vote");
    } finally {
      setVoting(null);
    }
  };

  const handleViewCampusInfo = async (infoId: string) => {
    await incrementCampusInfoViews(infoId);
    setCampusInfo(prev => prev.map(info => 
      info.id === infoId ? { ...info, views: info.views + 1 } : info
    ));
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const filteredProposals = proposals.filter(p => {
    if (p.status === 'under_review') return false;
    if (proposalFilter === 'all') return true;
    if (proposalFilter === 'active') return p.status === 'active' || p.status === 'pending';
    return p.status === proposalFilter;
  });

  const getStatusColor = (status: Proposal['status'] | CampusInfo['status']) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'active': return 'text-blue-600';
      case 'published': return 'text-green-600';
      case 'pending': return 'text-amber-600';
      case 'expired': return 'text-gray-600';
      case 'draft': return 'text-gray-600';
      case 'archived': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: Proposal['status'] | CampusInfo['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-50 border-green-200';
      case 'rejected': return 'bg-red-50 border-red-200';
      case 'active': return 'bg-blue-50 border-blue-200';
      case 'published': return 'bg-green-50 border-green-200';
      case 'pending': return 'bg-amber-50 border-amber-200';
      case 'expired': return 'bg-gray-50 border-gray-200';
      case 'draft': return 'bg-gray-50 border-gray-200';
      case 'archived': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: CampusInfo['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
            News in <span className="text-amber-500">Campus</span>
          </h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">Vote on proposals and stay updated on notifications</p>
        </div>
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-1 p-1.5 bg-stone-100 rounded-xl w-fit"
      >
        <button
          onClick={() => setActiveTab("proposals")}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "proposals"
              ? "bg-white text-amber-600 shadow-md border border-stone-200/50"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Vote size={14} />
          <span className="hidden sm:inline">Proposals</span>
          {proposals.filter(p => p.status === 'active' || p.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md ml-1 shadow-sm shadow-amber-200">
              {proposals.filter(p => p.status === 'active' || p.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("campus")}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "campus"
              ? "bg-white text-blue-600 shadow-md border border-stone-200/50"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Info size={14} />
          <span className="hidden sm:inline">Campus Info</span>
          {campusInfo.filter(i => i.status === 'published').length > 0 && (
            <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-md ml-1 shadow-sm shadow-blue-200">
              {campusInfo.filter(i => i.status === 'published').length}
            </span>
          )}
        </button>
      </motion.div>

      {}
      {activeTab === "proposals" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard 
            title="Total Proposals" 
            value={proposals.length} 
            icon={FileText} 
            color="gold" 
            delay={0.1}
            onClick={() => setProposalFilter('all')}
            isActive={proposalFilter === 'all'}
          />
          <StatCard 
            title="Approved" 
            value={proposals.filter(p => p.status === 'approved').length} 
            icon={CheckCircle} 
            color="green" 
            delay={0.15}
            onClick={() => setProposalFilter(f => f === 'approved' ? 'all' : 'approved')}
            isActive={proposalFilter === 'approved'}
          />
          <StatCard 
            title="Active" 
            value={proposals.filter(p => p.status === 'active' || p.status === 'pending').length} 
            icon={Clock} 
            color="blue" 
            delay={0.2}
            onClick={() => setProposalFilter(f => f === 'active' ? 'all' : 'active')}
            isActive={proposalFilter === 'active'}
          />
          <StatCard 
            title="Rejected" 
            value={proposals.filter(p => p.status === 'rejected').length} 
            icon={XCircle} 
            color="red" 
            delay={0.25}
            onClick={() => setProposalFilter(f => f === 'rejected' ? 'all' : 'rejected')}
            isActive={proposalFilter === 'rejected'}
          />
        </motion.div>
      )}

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="min-h-[400px]"
      >
        {}
        {activeTab === "proposals" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredProposals.length === 0 ? (
              <div className="col-span-full bg-white rounded-[2rem] p-16 text-center border border-stone-100 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-amber-500" size={24} />
                </div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide mb-2">No {proposalFilter !== 'all' ? proposalFilter : ''} proposals found</h3>
                <p className="text-xs text-stone-400 font-medium max-w-sm mx-auto">There are no {proposalFilter !== 'all' ? proposalFilter : ''} proposals to display right now.</p>
              </div>
            ) : (
              filteredProposals.map((proposal, i) => {
                const userVote = userVotes[proposal.id];
                const isActive = proposal.status === 'active' || proposal.status === 'pending';
                const canInteract = !!profile?.uid;

                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                    className={`bg-white rounded-[2rem] p-6 border-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col ${
                      isActive ? 'border-amber-200 bg-amber-50/10' : 'border-stone-100'
                    }`}
                  >
                    {}
                    <div className="flex flex-col gap-1 mb-4">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-extrabold text-stone-900 text-lg lg:text-xl tracking-tight leading-tight">
                          {proposal.title}
                        </h3>
                        {}
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${getStatusBg(proposal.status)} ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      </div>
                      <p className="text-stone-500 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {proposal.description}
                      </p>
                    </div>
                    {}
                    <div className="flex flex-col gap-2.5">
                      {}
                      <div className="flex flex-col gap-1 w-full bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                        <div className="flex items-center justify-between px-1 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Vote Progress</span>
                          <span className="text-[10px] font-black tracking-widest text-stone-400">
                             {proposal.votes.totalVoters} / {totalUsers} MEMBERS
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-lg h-1.5 overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${(proposal.votes.yes / totalUsers) * 100}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${(proposal.votes.no / totalUsers) * 100}%` }}
                          />
                        </div>
                        <p className="text-[8px] text-stone-400 uppercase tracking-widest font-black mt-0.5 text-center">
                          {proposal.requiredPercentage || 70}% REQUIRED
                        </p>
                      </div>

                      {}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                           {}
                           <button
                             onClick={() => handleVote(proposal.id, 'yes')}
                             disabled={voting === proposal.id || !canInteract}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                               userVote === 'yes' 
                                 ? 'bg-green-100 text-green-700' 
                                 : canInteract 
                                    ? 'hover:bg-green-50 text-stone-500 hover:text-green-600'
                                    : 'text-stone-400 opacity-50'
                             }`}
                           >
                             {voting === proposal.id ? (
                               <Loader2 className="animate-spin" size={14} />
                             ) : (
                               <ThumbsUp size={14} className={userVote === 'yes' ? 'fill-current' : ''} />
                             )}
                             {proposal.votes.yes} YES
                           </button>

                           {}
                           <button
                             onClick={() => handleVote(proposal.id, 'no')}
                             disabled={voting === proposal.id || !canInteract}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                               userVote === 'no' 
                                 ? 'bg-red-100 text-red-700' 
                                 : canInteract 
                                    ? 'hover:bg-red-50 text-stone-500 hover:text-red-600'
                                    : 'text-stone-400 opacity-50'
                             }`}
                           >
                             {voting === proposal.id ? (
                               <Loader2 className="animate-spin" size={14} />
                             ) : (
                               <ThumbsDown size={14} className={userVote === 'no' ? 'fill-current' : ''} />
                             )}
                             {proposal.votes.no} NO
                           </button>
                        </div>

                        {}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                            {formatDate(proposal.proposedAt)}
                          </span>
                          {proposal.category && (
                            <span className="px-2 py-1 bg-stone-100 text-stone-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                              {proposal.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {}
        {activeTab === "campus" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusInfo.length === 0 ? (
              <div className="col-span-full bg-white rounded-[2rem] p-16 text-center border border-stone-100 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Bell className="text-blue-500" size={24} />
                </div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide mb-2">No updates yet</h3>
                <p className="text-xs text-stone-400 font-medium max-w-sm mx-auto">There are no campus notifications or news to display.</p>
              </div>
            ) : (
              campusInfo.map((info, i) => (
                <motion.div
                  key={info.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className={`bg-white rounded-3xl p-5 border-2 hover:shadow-xl transition-all cursor-pointer flex flex-col ${
                    info.status === 'published' ? 'border-sky-200 bg-sky-50/20' : 'border-stone-100'
                  }`}
                  onClick={() => info.status === 'published' && handleViewCampusInfo(info.id)}
                >
                  {}
                  <div className="flex items-start justify-between gap-3 mb-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-black text-stone-900 text-sm leading-tight">{info.title}</h3>
                        <div className="flex gap-1 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusBg(info.status)} ${getStatusColor(info.status)}`}>
                            {info.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(info.priority)} border-current opacity-70`}>
                            {info.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-stone-500 text-xs font-medium line-clamp-4 leading-relaxed whitespace-pre-wrap">{info.content}</p>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                        <div className="w-4 h-4 rounded bg-stone-100 flex items-center justify-center text-stone-500">
                           <Eye size={10} />
                        </div>
                        {info.views}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                        <div className="w-4 h-4 rounded bg-stone-100 flex items-center justify-center text-stone-500">
                           <Calendar size={10} />
                        </div>
                        {formatDate(info.createdAt)}
                      </span>
                    </div>
                    {info.status === 'published' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewCampusInfo(info.id); }}
                        className="w-6 h-6 rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-700 flex items-center justify-center transition-colors"
                        title="Mark as viewed"
                      >
                        <CheckCircle size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

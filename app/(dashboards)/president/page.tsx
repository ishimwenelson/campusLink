"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAllUsers, getAllPendingEmergencyRequests, approveEmergencyRequest, rejectEmergencyRequest, getProposals, updateProposalStatus } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Users, DollarSign, AlertCircle, TrendingUp, CheckCircle, XCircle, Loader2, FileText, Vote, ShieldCheck, FileSearch, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
// Removed PresidentDashboardCharts import
import { formatRF, currentYear, getPaymentsForYear, formatDate } from "@/lib/utils/format";
import type { CampusUser, EmergencyRequest, Proposal } from "@/lib/types";
import { toast } from "sonner";
import { RejectionReasonModal } from "@/components/modals/RejectionReasonModal";

export default function PresidentDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  
  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<any | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    Promise.all([getAllUsers(), getAllPendingEmergencyRequests(), getProposals()]).then(([u, r, p]) => {
      setUsers(u);
      setPendingReqs(r);
      setPendingProposals(p.filter(prop => prop.status === "under_review"));
      setLoading(false);
    });
  }, []);

  const totalFunds = users.reduce((s, u) => s + u.paidSoFar, 0);
  const totalTarget = users.reduce((s, u) => s + u.totalShareValue, 0);
  const completedCount = users.filter((u) => u.paidSoFar >= u.totalShareValue).length;

  // Trend Calculations (Basic logic: Compare counts vs items older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const prevUsers = users.filter(u => new Date(u.createdAt as string) < thirtyDaysAgo).length;
  const userTrend = prevUsers === 0 ? 100 : Math.round(((users.length - prevUsers) / prevUsers) * 100);

  const prevFunds = users.reduce((s, u) => {
    if (new Date(u.createdAt as string) < thirtyDaysAgo) return s + (u.paidSoFar || 0);
    return s;
  }, 0);
  const fundTrend = prevFunds === 0 ? 100 : Math.round(((totalFunds - prevFunds) / prevFunds) * 100);

  const prevPending = pendingReqs.filter(r => new Date(r.requestedAt) < thirtyDaysAgo).length;
  const pendingTrend = prevPending === 0 ? 0 : Math.round(((pendingReqs.length - prevPending) / prevPending) * 100);

  const prevCompleted = users.filter(u => u.paidSoFar >= u.totalShareValue && new Date(u.createdAt as string) < thirtyDaysAgo).length;
  const completedTrend = prevCompleted === 0 ? 100 : Math.round(((completedCount - prevCompleted) / prevCompleted) * 100);

  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    try {
      await approveEmergencyRequest(req.userId, req.id, profile!.uid);
      setPendingReqs((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`Emergency request of ${formatRF(req.amount)} approved ✅`);
    } catch { toast.error("Failed to approve request"); }
    finally { setProcessingId(null); }
  };

  const handleRejectClick = (req: any) => {
    setRequestToReject(req);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!requestToReject) return;
    setIsRejecting(true);
    try {
      await rejectEmergencyRequest(requestToReject.userId, requestToReject.id, reason);
      setPendingReqs((prev) => prev.filter((r) => r.id !== requestToReject.id));
      toast.error(`Request rejected with reason: ${reason}`);
      setIsRejectModalOpen(false);
      setRequestToReject(null);
    } catch { 
      toast.error("Failed to reject request"); 
    } finally { 
      setIsRejecting(false); 
    }
  };

  const handleAuthorizeProposal = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await updateProposalStatus(proposalId, "active");
      setPendingProposals(prev => prev.filter(p => p.id !== proposalId));
      toast.success("Strategic proposal authorized for voting ✅");
    } catch (e) { toast.error("Failed to authorize proposal"); }
    finally { setProcessingId(null); }
  };

  const handleDenyProposal = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await updateProposalStatus(proposalId, "rejected");
      setPendingProposals(prev => prev.filter(p => p.id !== proposalId));
      toast.error("Proposal denied.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to deny proposal.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (selectedProposal && !pendingProposals.find(p => p.id === selectedProposal.id)) {
      setSelectedProposal(null);
    }
  }, [pendingProposals, selectedProposal]);

  if (loading || !profile) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-[1500px] mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="tracking-tight">
             President <span className="text-amber-500">Dashboard</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs mt-1 max-w-xl">
             Executive oversight, system governance, and institutional capital liquidity control.
          </p>
        </div>
        <div className="flex gap-4">
           <span className="px-6 py-3 bg-stone-900 text-white rounded-[1.5rem] flex items-center gap-3 text-sm font-bold shadow-2xl shadow-stone-950">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            Imperial Authority
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Membership" value={users.length} icon={Users} color="gold" delay={0.1} trend={{ value: userTrend, label: "vs last month" }} />
        <StatCard title="Institutional Fund" value={formatRF(totalFunds)} subtitle="Collective capital" icon={DollarSign} color="green" delay={0.15} trend={{ value: fundTrend, label: "vs last month" }} />
        <StatCard title="Liquidity Needs" value={pendingReqs.length} subtitle="Pending approvals" icon={AlertCircle} color="red" delay={0.2} trend={{ value: pendingTrend, label: "new requests" }} />
        <StatCard title="Cycle Completion" value={completedCount} subtitle="Fulfilled accounts" icon={TrendingUp} color="blue" delay={0.25} trend={{ value: completedTrend, label: "growth" }} />
      </div>

      {/* Pending Emergency Requests */}
      <motion.div
        className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="flex items-center gap-3 tracking-tight">
              <AlertCircle className="text-amber-500" size={24} strokeWidth={2.5} />
              Capital Liquidity Requests
            </h2>
            <p className="text-stone-500 font-medium text-xs mt-1">Pending emergency withdrawals awaiting executive authorization</p>
          </div>
          {pendingReqs.length > 0 && (
            <span className="px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-500/20">
              {pendingReqs.length} Action Items
            </span>
          )}
        </div>

        {pendingReqs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle className="text-green-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Systems Clear</h3>
            <p className="text-stone-400 font-medium">No pending liquidity requests in the queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReqs.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[2rem] bg-white border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
              >
                {/* Left side: Avatar + Info */}
                <div className="flex items-start gap-4 flex-1">
                   <div className="w-12 h-12 shrink-0 rounded-[1rem] bg-stone-100 flex items-center justify-center text-stone-600 font-black text-lg group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    {req.userDoc?.fullName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="font-black text-stone-900 text-base tracking-tight truncate leading-none">{req.userDoc?.fullName || "Unknown Member"}</h4>
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 shrink-0">
                        {formatDate(req.requestedAt)}
                      </span>
                    </div>
                    {req.note ? (
                        <p className="text-xs text-stone-600 font-medium italic line-clamp-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">"{req.note}"</p>
                    ) : (
                        <p className="text-[10px] text-stone-400 font-medium">No reason provided</p>
                    )}
                  </div>
                </div>
                
                {/* Right side: Amount + Actions */}
                <div className="flex items-center gap-6 md:w-auto w-full justify-between md:justify-end border-t md:border-t-0 border-stone-100 pt-4 md:pt-0">
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Capital Amount</p>
                    <p className="font-black text-xl text-amber-600 tracking-tight">{formatRF(req.amount)}</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <motion.button
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 text-white 
                                 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all
                                 disabled:opacity-50 shadow-md"
                      whileTap={{ scale: 0.95 }}
                    >
                      {processingId === req.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                      Authorize
                    </motion.button>
                    <motion.button
                      onClick={() => handleRejectClick(req)}
                      disabled={processingId === req.id}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-red-500 
                                 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all
                                 disabled:opacity-50 border border-stone-200"
                      whileTap={{ scale: 0.95 }}
                    >
                      <XCircle size={14} /> Deny
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pending Proposals */}
      <motion.div
        className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="flex items-center gap-3 tracking-tight">
              <FileSearch className="text-amber-500" size={24} strokeWidth={2.5} />
              Strategic Proposals Review
            </h2>
            <p className="text-stone-500 font-medium text-xs mt-1">Newly submitted member proposals awaiting executive authorization before public voting</p>
          </div>
          {pendingProposals.length > 0 && (
            <span className="px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-500/20">
              {pendingProposals.length} Action Items
            </span>
          )}
        </div>

        {pendingProposals.length === 0 ? (
           <div className="py-20 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
               <ShieldCheck className="text-stone-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">No Pending Proposals</h3>
            <p className="text-stone-400 font-medium">There are no strategic proposals requiring authorization at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
            {pendingProposals.map((proposal, i) => (
              <motion.div
                key={proposal.id}
                layout
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedProposal(proposal)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-[2rem] bg-white border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 hover:bg-amber-50/10 cursor-pointer transition-all group"
              >
                <div className="flex items-start gap-4 flex-1">
                   <div className="w-12 h-12 shrink-0 rounded-[1rem] bg-stone-100 flex items-center justify-center text-stone-600 font-black text-lg group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    {proposal.proposedByName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                      <h4 className="font-black text-stone-900 text-base tracking-tight truncate leading-none group-hover:text-amber-600 transition-colors">{proposal.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded">Review</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 shrink-0">
                          {new Date(proposal.proposedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 font-medium line-clamp-1">{proposal.description}</p>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1.5">Proposed by {proposal.proposedByName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>


      <RejectionReasonModal 
        isOpen={isRejectModalOpen}
        onClose={() => { setIsRejectModalOpen(false); setRequestToReject(null); }}
        onConfirm={handleConfirmReject}
        loading={isRejecting}
      />

      {/* Slide-over Proposal Modal */}
      <AnimatePresence>
        {selectedProposal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProposal(null)}
              className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="relative w-full max-w-lg bg-stone-50 h-[100dvh] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-stone-950 p-6 flex flex-col gap-6 shrink-0 border-b border-stone-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-[0.2em] rounded">Pending Review</span>
                       <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle size={10} />
                          {new Date(selectedProposal.proposedAt).toLocaleDateString()}
                       </span>
                    </div>
                    <h2 className="font-display font-black text-white text-2xl tracking-tight leading-tight mb-4">{selectedProposal.title}</h2>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-black text-white">
                            {selectedProposal.proposedByName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest leading-none mb-1">Proposed By</p>
                            <p className="text-xs font-bold text-stone-300">{selectedProposal.proposedByName}</p>
                        </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProposal(null)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all shrink-0">
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-amber-500" /> Executive Standard Pitch
                  </h3>
                  <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm">
                    <p className="text-sm font-medium leading-relaxed text-stone-700 whitespace-pre-wrap">{selectedProposal.description}</p>
                  </div>
                </div>

                {selectedProposal.attachmentUrl && (
                  <div>
                    <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-amber-500" /> Supporting Documentation
                    </h3>
                    <a 
                      href={selectedProposal.attachmentUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                           <FileText size={20} />
                         </div>
                         <div>
                           <p className="text-xs font-black text-stone-900 group-hover:text-amber-700 transition-colors">Attached Pitch Deck / Doc</p>
                           <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Click to preview secure asset</p>
                         </div>
                      </div>
                      <ChevronRight size={18} className="text-stone-300 group-hover:text-amber-500 transition-colors" />
                    </a>
                  </div>
                )}

                <div className="pt-8 border-t border-stone-200 mt-8">
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => handleAuthorizeProposal(selectedProposal.id)}
                      disabled={processingId === selectedProposal.id}
                      className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-stone-900 text-white 
                                 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all
                                 disabled:opacity-50"
                      whileTap={{ scale: 0.95 }}
                    >
                      {processingId === selectedProposal.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Authorize for Voting
                    </motion.button>
                    <motion.button
                      onClick={() => handleDenyProposal(selectedProposal.id)}
                      disabled={processingId === selectedProposal.id}
                      className="flex-none flex items-center justify-center px-6 py-4 bg-white text-red-500 
                                 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-700 transition-all
                                 disabled:opacity-50 border border-stone-200 hover:border-red-200"
                      whileTap={{ scale: 0.95 }}
                    >
                      {processingId === selectedProposal.id ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />} 
                      Deny
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

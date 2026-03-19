"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserDividendSummary, claimDividend } from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import { 
  TrendingUp, CheckCircle, Clock, 
  Briefcase, Loader2, Download, Award
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { UserDividendSummary } from "@/lib/types";
import { toast } from "sonner";

export default function MemberDividends() {
  const { profile } = useAuth();
  const [dividendSummary, setDividendSummary] = useState<UserDividendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    
    getUserDividendSummary(profile.uid).then((summary) => {
      setDividendSummary(summary);
      setLoading(false);
    });
  }, [profile?.uid]);

  const handleClaimDividend = async (projectId: string) => {
    if (!profile?.uid) return;
    
    setClaiming(projectId);
    try {
      const projectDividends = dividendSummary?.projects.filter(p => p.projectId === projectId && p.status === 'distributed') || [];
      
      for (const dividend of projectDividends) {
        await claimDividend(profile.uid, dividend.projectId);
      }
      
      toast.success("Dividend claimed successfully!");
      
      getUserDividendSummary(profile.uid).then(setDividendSummary);
    } catch (error) {
      toast.error("Failed to claim dividend");
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!dividendSummary) return (
    <div className="flex items-center justify-center h-64 text-center">
      <div>
        <Award className="mx-auto mb-3 text-stone-200" size={32} />
        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">No dividend data available</p>
      </div>
    </div>
  );

  const pendingProjects = dividendSummary.projects.filter(p => p.status === 'distributed');
  const claimedProjects = dividendSummary.projects.filter(p => p.status === 'claimed');

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
            My <span className="text-amber-500">Dividends</span>
          </h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">Track and claim your investment returns</p>
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Dividends" value={formatRF(dividendSummary.totalDividends)} icon={TrendingUp} color="gold" delay={0.1} />
        <StatCard title="Claimed" value={formatRF(dividendSummary.claimedDividends)} icon={CheckCircle} color="green" delay={0.15} />
        <StatCard title="Pending" value={formatRF(dividendSummary.pendingDividends)} icon={Clock} color="purple" delay={0.2} />
        <StatCard title="Projects Joined" value={dividendSummary.projects.length} icon={Briefcase} color="blue" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        {pendingProjects.length > 0 && (
          <motion.div
            className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-amber-50/30">
              <h2 className="text-sm font-black text-stone-900 flex items-center gap-2 uppercase tracking-wide">
                <Clock className="text-amber-500" size={16} />
                Available to Claim
              </h2>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-100 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                {pendingProjects.length} pending
              </span>
            </div>

            <div className="divide-y divide-stone-50">
              {pendingProjects.map((project, i) => (
                <motion.div
                  key={project.projectId}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 shadow-inner">
                        <Briefcase size={18} />
                     </div>
                    <div>
                      <h3 className="text-xs font-black text-stone-900 uppercase">{project.projectName}</h3>
                      <p className="text-[10px] font-medium text-stone-400">Distributed: {formatDate(project.distributionDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Amount</p>
                      <p className="text-sm font-black text-green-600">{formatRF(project.dividendAmount)}</p>
                    </div>
                    <button
                      onClick={() => handleClaimDividend(project.projectId)}
                      disabled={claiming === project.projectId}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50"
                    >
                      {claiming === project.projectId ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Claim
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {}
        {claimedProjects.length > 0 && (
          <motion.div
            className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-sm font-black text-stone-900 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle className="text-green-500" size={16} />
                Claim History
              </h2>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[10px] font-black text-stone-500 uppercase tracking-widest">
                {claimedProjects.length} claimed
              </span>
            </div>

            <div className="divide-y divide-stone-50">
              {claimedProjects.map((project, i) => (
                <motion.div
                  key={project.projectId}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-stone-500 shadow-inner">
                        <CheckCircle size={18} />
                     </div>
                    <div>
                      <h3 className="text-xs font-black text-stone-900 uppercase">{project.projectName}</h3>
                      <p className="text-[10px] font-medium text-stone-400">Claimed: {formatDate(project.distributionDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Amount</p>
                      <p className="text-sm font-black text-stone-600">{formatRF(project.dividendAmount)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircle size={12} className="stroke-[3]" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Done</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {}
      {dividendSummary.projects.length === 0 && (
        <motion.div
          className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden text-center py-16"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
             <Award className="text-amber-500" size={24} />
          </div>
          <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide mb-2">No Dividends Yet</h3>
          <p className="text-xs text-stone-400 font-medium max-w-sm mx-auto leading-relaxed">
            Dividends will be distributed when investment projects generate profits. 
            Check back later for updates.
          </p>
        </motion.div>
      )}
    </div>
  );
}

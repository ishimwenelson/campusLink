"use client";
import { useState, useEffect } from "react";
import { getAllUsers, getMeetings, getProposals } from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import {
  LogOut, Shield, Calendar, Vote, Users, TrendingUp,
  ArrowRight, Clock, CheckCircle2, AlertCircle,
  BarChart3, Plus
} from "lucide-react";
import { formatRF } from "@/lib/utils/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { BoardMemberDashboardCharts } from "@/components/charts/DashboardCharts";
import type { CampusUser, Meeting, Proposal } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function BoardDashboard() {
  const router = useRouter();
  const [members, setMembers] = useState<CampusUser[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllUsers(),
      getMeetings(),
      getProposals()
    ]).then(([u, m, p]) => {
      setMembers(u);
      setMeetings(m);
      setProposals(p);
      setLoading(false);
    });
  }, []);

  
  const totalFund = members.reduce((s, m) => s + (m.paidSoFar || 0), 0);
  const totalEmergencyTaken = members.reduce((s, m) => s + (m.emergencyTaken || 0), 0);
  const cashOnHand = totalFund - totalEmergencyTaken;

  
  const activeProposals = proposals.filter(p => p.status === "active" || p.status === "pending").length;
  const underReviewCount = proposals.filter(p => p.status === "under_review").length;
  const upcomingMeetings = meetings.filter(m => m.status === "planned").length;

  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setMonth(thirtyDaysAgo.getMonth() - 1);

  const prevMembers = members.filter(m => new Date(m.createdAt as string) < thirtyDaysAgo);
  const prevFund = prevMembers.reduce((s, m) => s + (m.paidSoFar || 0), 0);
  
  const fundTrend = prevFund === 0 ? 100 : Number(((totalFund - prevFund) / prevFund * 100).toFixed(1));
  const memberTrend = prevMembers.length === 0 ? 100 : Number(((members.length - prevMembers.length) / prevMembers.length * 100).toFixed(1));
  
  const prevActiveProposals = proposals.filter(p => 
    (p.status === "active" || p.status === "pending") && 
    new Date(p.proposedAt) < thirtyDaysAgo
  ).length;
  const proposalTrend = prevActiveProposals === 0 ? (activeProposals > 0 ? 100 : 0) : Number(((activeProposals - prevActiveProposals) / prevActiveProposals * 100).toFixed(1));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] animate-pulse">Initializing Board Intelligence...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8 pb-20">
      {}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.3em]">Imperial Governance</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tighter leading-none">
            Board <span className="text-amber-500">Analytics</span>
          </h1>
          <p className="text-stone-400 font-bold text-[10px] mt-2 uppercase tracking-widest leading-none">Central Command & Collective Oversight</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end mr-4">
             <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">System Status</p>
             <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-stone-900">OPERATIONAL</span>
             </div>
          </div>
          <button
            onClick={() => router.push("/investor/proposals?new=true")}
            className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-600 transition-all shadow-xl shadow-amber-900/10 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            Submit Proposal
          </button>
          <button
            onClick={() => router.push("/board/meetings")}
            className="flex items-center gap-3 px-8 py-4 bg-stone-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 group"
          >
            <Calendar size={16} className="group-hover:rotate-12 transition-transform" />
            Strategy Sessions
          </button>
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Portfolio" 
          value={formatRF(totalFund)} 
          subtitle="Capital Under Management" 
          icon={TrendingUp} 
          color="gold" 
          delay={0.1} 
          trend={{ value: fundTrend, label: "growth" }} 
        />
        <StatCard 
          title="Active Proposals" 
          value={activeProposals.toString()} 
          subtitle="Governance in Progress" 
          icon={Vote} 
          color="blue" 
          delay={0.15} 
          trend={{ value: proposalTrend, label: "momentum" }} 
        />
        <StatCard 
          title="Strategy Syncs" 
          value={upcomingMeetings.toString()} 
          subtitle="Upcoming Planned Sessions" 
          icon={Calendar} 
          color="purple" 
          delay={0.2} 
        />
        <StatCard 
          title="Shareholders" 
          value={members.length.toString()} 
          subtitle="Validated Members" 
          icon={Users} 
          color="green" 
          delay={0.25} 
          trend={{ value: memberTrend, label: "retention" }} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {}
        <div className="lg:col-span-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-stone-100 shadow-2xl relative overflow-hidden h-full"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Calendar size={200} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Strategy Calendar</h2>
                <p className="text-stone-500 font-medium text-[9px] mt-0.5 uppercase tracking-widest">Upcoming legislative governance meetings</p>
              </div>
              <button
                onClick={() => router.push("/board/meetings")}
                className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-stone-50 text-stone-900 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-stone-900 hover:text-white transition-all border border-stone-200"
              >
                Full Archive <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid gap-3 relative z-10">
              {meetings.filter(m => m.status === "planned").slice(0, 4).map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between p-5 rounded-2xl bg-stone-50/50 border border-stone-100 group hover:border-amber-500/30 hover:bg-white hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-white border border-stone-100 flex flex-col items-center justify-center text-stone-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                        {new Date(m.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black leading-none">
                        {new Date(m.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 text-sm tracking-tight leading-tight group-hover:text-amber-600 transition-colors uppercase">{m.title}</h3>
                      <div className="flex items-center gap-2.5 mt-1">
                         <div className="flex items-center gap-1.5 text-stone-400 font-black text-[8px] uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg border border-stone-100">
                            <Clock size={8} className="text-amber-500" /> {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                         <div className="w-0.5 h-0.5 rounded-full bg-stone-200" />
                         <span className="text-stone-400 font-bold text-[9px] uppercase tracking-wider line-clamp-1">{m.agenda}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/board/meetings/${m.id}`)}
                    className="w-10 h-10 rounded-lg bg-white border border-stone-100 text-stone-400 flex items-center justify-center group-hover:bg-stone-950 group-hover:text-amber-500 transition-all shadow-sm"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
              {meetings.filter(m => m.status === "planned").length === 0 && (
                <div className="text-center py-16 bg-stone-50/50 rounded-3xl border border-dashed border-stone-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100 shadow-sm">
                    <Calendar className="text-stone-300" size={24} />
                  </div>
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">No Strategy Syncs Scheduled</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {}
        <div className="lg:col-span-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="bg-stone-950 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl group border-t border-white/10"
          >
            <Shield className="absolute -bottom-10 -right-10 text-white/5 group-hover:text-amber-500/10 group-hover:scale-125 transition-all duration-1000" size={240} />
            <div className="relative z-10">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-amber-500/50 transition-colors">
                  <Shield size={28} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-black tracking-tight mb-3">Institutional Audit</h3>
                <p className="text-stone-400 font-medium text-[11px] mb-6 leading-relaxed">
                    Verify system-wide consensus and financial holdings.
                </p>
                <button 
                  onClick={() => router.push("/treasurer/financials")}
                  className="w-full py-4 rounded-xl bg-white text-stone-950 hover:bg-amber-500 transition-all duration-500 font-black text-[9px] uppercase tracking-[0.2em]"
                >
                  Initiate Global Audit
                </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
            className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100/30"
          >
             <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4">Governance Pipeline</h4>
             <div className="flex items-center justify-between pb-4">
                <div className="flex flex-col">
                   <div className="text-3xl font-black text-stone-900 tracking-tighter">{underReviewCount}</div>
                   <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">In Review</div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-3xl font-black text-stone-900 tracking-tighter">{activeProposals}</div>
                   <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Awaiting Decision</div>
                </div>
             </div>
             <button 
                onClick={() => router.push("/investor/proposals")}
                className="w-full mt-2 py-3.5 bg-white border border-amber-200 text-amber-700 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 hover:text-white transition-all shadow-sm"
              >
                Access Review Chamber
             </button>
          </motion.div>
        </div>
      </div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="pt-8 border-t border-stone-100"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">Governance Intelligence</h2>
            <p className="text-stone-500 font-medium text-[9px] mt-0.5 uppercase tracking-widest">Decision velocity and voting distribution</p>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-lg">
             <div className="px-3 py-1 bg-white rounded-md shadow-sm text-[8px] font-black uppercase tracking-widest text-stone-900">Performance</div>
             <div className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-stone-400 cursor-pointer hover:text-stone-600">Volume</div>
          </div>
        </div>
        <BoardMemberDashboardCharts boardData={{ members, meetings, proposals }} />
      </motion.div>
    </div>
  );
}

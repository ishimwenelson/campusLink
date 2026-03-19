"use client";
import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Users, UserPlus, FileText, CheckCircle,
  AlertCircle, ArrowRight, TrendingUp, Calendar
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { currentYear, formatRF } from "@/lib/utils/format";
import type { CampusUser } from "@/lib/types";
import { useRouter } from "next/navigation";
import RegisterMemberModal from "@/components/dashboard/RegisterMemberModal";
import { MemberGrowthChart } from "@/components/dashboard/MemberGrowthChart";
import { DocumentStatsChart } from "@/components/dashboard/DocumentStatsChart";

export default function SecretaryOverview() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<CampusUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (profile?.role === 'secretary') {
      getAllUsers()
        .then((u) => {
          setMembers(u);
          setDataLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
          setDataLoading(false);
        });
    }
  }, [profile]);

  if (loading || dataLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeCount = members.filter((m) => m.isActive).length;
  const pendingDocs = members.filter(m => !m.documentsUploaded).length;
  const totalFund = members.reduce((sum, m) => sum + (m.paidSoFar || 0), 0);

  // Trend Calculations (Basic logic: Compare counts vs items older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const prevMembers = members.filter(m => new Date(m.createdAt as string) < thirtyDaysAgo).length;
  const memberTrend = prevMembers === 0 ? 100 : Math.round(((members.length - prevMembers) / prevMembers) * 100);

  const prevActive = members.filter(m => m.isActive && new Date(m.createdAt as string) < thirtyDaysAgo).length;
  const activeTrend = prevActive === 0 ? 0 : Math.round(((activeCount - prevActive) / prevActive) * 100);

  const prevPending = members.filter(m => !m.documentsUploaded && new Date(m.createdAt as string) < thirtyDaysAgo).length;
  const pendingTrend = prevPending === 0 ? 0 : Math.round(((pendingDocs - prevPending) / prevPending) * 100);

  const prevFund = members.reduce((sum, m) => {
    if (new Date(m.createdAt as string) < thirtyDaysAgo) return sum + (m.paidSoFar || 0);
    return sum;
  }, 0);
  const fundTrend = prevFund === 0 ? 100 : Math.round(((totalFund - prevFund) / prevFund) * 100);

  return (
    <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-6 max-w-[1500px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="tracking-tight">
            Secretary <span className="text-amber-500">Dashboard</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs mt-1 max-w-xl">
            Real-time administrative control panel and member analytic insights.
          </p>
        </div>
        <div className="flex gap-4">
          <motion.button
            onClick={() => setShowRegister(true)}
            className="btn-gold flex items-center gap-2.5 px-5 py-3"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <UserPlus size={18} />
            <span className="font-bold">Register Member</span>
          </motion.button>
        </div>
      </motion.div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Membership" value={members.length} icon={Users} color="gold" delay={0.1} 
          trend={{ value: memberTrend, label: "vs last month" }}
        />
        <StatCard 
          title="Collective Fund" value={formatRF(totalFund)} subtitle="Total savings" icon={TrendingUp} color="green" delay={0.15} 
          trend={{ value: fundTrend, label: "vs last month" }}
        />
        <StatCard 
          title="Documents Verified" value={members.length - pendingDocs} subtitle="Verification status" icon={CheckCircle} color="blue" delay={0.2} 
          trend={{ value: pendingTrend, label: "new docs" }}
        />
        <StatCard 
          title="Active Members" value={activeCount} subtitle="System growth" icon={TrendingUp} color="purple" delay={0.25} 
          trend={{ value: activeTrend, label: "activity" }}
        />
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <MemberGrowthChart members={members} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <DocumentStatsChart members={members} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        {/* Administrative Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-5 h-full">
            <div className="mb-4">
              <h2 className="text-sm font-black text-stone-900 tracking-tight">Administrative Actions</h2>
              <p className="text-[10px] text-stone-400 mt-0.5">Quick management shortcuts</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Members", icon: Users, color: "bg-amber-500 shadow-amber-200", route: "/secretary/members" },
                { title: "Reports", icon: FileText, color: "bg-blue-500 shadow-blue-200", route: "/secretary/reports" },
                { title: "Meetings", icon: Calendar, color: "bg-purple-500 shadow-purple-200", route: "/board/meetings" },
                { title: "Register", icon: UserPlus, color: "bg-emerald-500 shadow-emerald-200", onClick: () => setShowRegister(true) },
              ].map(({ title, icon: Icon, color, route, onClick }) => (
                <motion.button
                  key={title}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={onClick ?? (() => router.push(route!))}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-all border border-stone-100 group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">{title}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Latest Registrations — modern table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden"
        >
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-50">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black text-stone-900 tracking-tight">Latest Registrations</h2>
              <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
                {members.length} total
              </span>
            </div>
            <button
              onClick={() => router.push("/secretary/members")}
              className="flex items-center gap-1.5 text-[10px] font-black text-stone-400 hover:text-amber-500 transition-colors uppercase tracking-widest"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50/60">
                  {["Member", "Joined", "Document", "Fund Paid", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[...members]
                  .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
                  .slice(0, 5)
                  .map((m, i) => (
                    <motion.tr
                      key={m.uid}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                      className="hover:bg-stone-50/60 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 flex items-center justify-center text-white font-black text-xs group-hover:from-amber-500 group-hover:to-amber-600 transition-all duration-300">
                            {m.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-stone-900 leading-tight">{m.fullName}</p>
                            <p className="text-[10px] text-stone-400 font-medium">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-stone-400 whitespace-nowrap">
                        {new Date(m.createdAt as string).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                          m.documentsUploaded
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          {m.documentsUploaded ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-black text-stone-700">
                        {formatRF(m.paidSoFar)}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => router.push(`/secretary/members?search=${m.fullName}`)}
                          className="p-1.5 rounded-lg bg-stone-100 text-stone-400 hover:bg-amber-500 hover:text-white transition-all"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="text-center py-10">
                <Users size={32} className="mx-auto text-stone-200 mb-2" />
                <p className="text-xs text-stone-400">No members registered yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <RegisterMemberModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => {
          setShowRegister(false);
          getAllUsers().then(setMembers);
        }}
      />
    </div>
  );
}



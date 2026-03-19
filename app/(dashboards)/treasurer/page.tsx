"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { getAllUsers, getUserPayments, getSystemSettings, updateSystemSettings } from "@/lib/firebase/firestore";
import { DollarSign, TrendingUp, AlertCircle, Users, FileDown, Loader2, ArrowRight, Calendar, Shield, Wallet, Settings, Save, Banknote } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AdminSavingModal } from "@/components/modals/AdminSavingModal";
import { AdminPaybackModal } from "@/components/modals/AdminPaybackModal";
import { TreasurerDashboardCharts, ShareDistributionChart } from "@/components/charts/DashboardCharts";
import { formatRF, currentYear, getPaymentsForYear } from "@/lib/utils/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { CampusUser, Payment } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MemberFinancial = CampusUser & { payments: Payment[]; paidThisYear: number };

export default function TreasurerDashboard() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [paybackModalOpen, setPaybackModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllUsers(),
      getSystemSettings()
    ]).then(async ([users, sysSettings]) => {
      setSettings(sysSettings);
      const enriched = await Promise.all(
        users.map(async (u) => {
          const payments = await getUserPayments(u.uid);
          return { ...u, payments, paidThisYear: getPaymentsForYear(payments, currentYear()) };
        })
      );
      setMembers(enriched);
      setLoading(false);
    });
  }, []);

  const handleUpdateSettings = async () => {
    setSavingSettings(true);
    try {
      await updateSystemSettings(settings);
      toast.success("System configuration updated successfully");
    } catch (err) {
      toast.error("Failed to update system configuration");
    } finally {
      setSavingSettings(false);
    }
  };

  const totalPaid = members.reduce((s, m) => s + m.paidSoFar, 0);
  const totalTarget = members.reduce((s, m) => s + m.totalShareValue, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const prevPaid = members.reduce((s, m) => {
    if (new Date(m.createdAt as string) < thirtyDaysAgo) return s + (m.paidSoFar || 0);
    return s;
  }, 0);
  const fundTrend = prevPaid === 0 ? 100 : Math.round(((totalPaid - prevPaid) / prevPaid) * 100);

  const activeReqs = members.filter(m => !m.documentsUploaded).length;
  const prevActiveReqs = members.filter(m => !m.documentsUploaded && new Date(m.createdAt as string) < thirtyDaysAgo).length;
  const reqTrend = prevActiveReqs === 0 ? 0 : Math.round(((activeReqs - prevActiveReqs) / prevActiveReqs) * 100);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-10 max-w-[1500px] mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="tracking-tight">
            Treasurer <span className="text-amber-500">Dashboard</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs mt-1 max-w-xl">
             Strategic capital management, real-time accounting, and institutional oversight.
          </p>
        </div>
        <div className="flex gap-4">
          <motion.button
            onClick={() => router.push("/treasurer/financials")}
            className="btn-gold flex items-center gap-2.5 px-5 py-3"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <FileDown size={18} />
            <span className="font-bold">Fiscal Statement</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Strategic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-1">
        <StatCard 
          title="Institutional Fund" value={formatRF(totalPaid)} subtitle="Collective capital" icon={DollarSign} color="gold" delay={0.1} 
          trend={{ value: fundTrend, label: "vs last month" }}
        />
        <StatCard 
          title="Monthly Yield" value={formatRF(totalPaid * 0.04)} subtitle="Projected growth" icon={TrendingUp} color="green" delay={0.15} 
          trend={{ value: fundTrend, label: "yield" }}
        />
        <StatCard 
          title="Active Requests" value={activeReqs} subtitle="Pending documents" icon={AlertCircle} color="red" delay={0.2} 
          trend={{ value: reqTrend, label: "urgent" }}
        />
        <StatCard 
          title="System Reserves" value={formatRF(totalPaid * 0.15)} subtitle="Liquidity floor" icon={Shield} color="blue" delay={0.25} 
          trend={{ value: 100, label: "stability" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Controls - Compact Grid */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col h-full"
        >
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-5 h-full">
            <div className="mb-4">
              <h2 className="text-sm font-black text-stone-900 tracking-tight">Financial Controls</h2>
              <p className="text-[10px] text-stone-400 mt-0.5">Quick management shortcuts</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Reports", icon: FileDown, color: "bg-amber-500 shadow-amber-200", route: "/treasurer/financials" },
                { title: "Ledger", icon: Users, color: "bg-blue-500 shadow-blue-200", route: "/treasurer/shareholders" },
                { title: "Manual Save", icon: Banknote, color: "bg-emerald-500 shadow-emerald-200", action: () => setSavingModalOpen(true) },
                { title: "Payback", icon: DollarSign, color: "bg-red-500 shadow-red-200", action: () => setPaybackModalOpen(true) },
                { title: "Audit", icon: Shield, color: "bg-stone-500 shadow-stone-200", route: "/treasurer/audit" },
                { title: "Portfolio", icon: Wallet, color: "bg-stone-700 shadow-stone-200", route: "/member" },
              ].map(({ title, icon: Icon, color, route, action }) => (
                <motion.button
                  key={title}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={action || (() => router.push(route!))}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-all border border-stone-100 group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">{title}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Financial Analytics - Institutional Flow */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="h-full flex flex-col"
        >
          <TreasurerDashboardCharts treasurerData={{ members }} />
          
          {/* System Settings Section */}
          <div className="mt-8 bg-[#09090b] text-white rounded-[2.5rem] border border-stone-800 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black tracking-tight">System Configuration</h3>
                <p className="text-xs text-stone-500 font-medium">Global parameters for institutional logic</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Settings size={20} className="animate-spin-slow" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-[2rem] bg-stone-900/50 border border-stone-800">
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">One Share Value (RF)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={settings?.shareUnitPrice || 1000}
                    onChange={(e) => setSettings({ ...settings, shareUnitPrice: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-5 py-4 text-xl font-black text-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-600 font-black text-xs">RWF / UNIT</div>
                </div>
              </div>

              <button
                onClick={handleUpdateSettings}
                disabled={savingSettings}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-black text-sm transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Deploy System Updates
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full Width Share Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ShareDistributionChart members={members} />
      </motion.div>

      <AdminSavingModal
        isOpen={savingModalOpen}
        onClose={() => setSavingModalOpen(false)}
      />

      <AdminPaybackModal
        isOpen={paybackModalOpen}
        onClose={() => setPaybackModalOpen(false)}
      />
    </div>
  );
}

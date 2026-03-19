"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserPayments, getUserEmergencyRequests, getSystemSettings, checkOverdueEmergencies, checkAnnualShortfallPenalties } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, AlertCircle, FileDown, Clock, Target, CheckCircle2, Calendar,
  ArrowUpRight, Info, PieChart, History, ChevronRight, Calculator, DollarSign
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressCircle } from "@/components/dashboard/ProgressCircle";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { PaymentTable } from "@/components/dashboard/PaymentTable";
import { Confetti } from "@/components/dashboard/Confetti";
import { EmergencyModal } from "@/components/modals/EmergencyModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { PaybackModal } from "@/components/modals/PaybackModal";
import { TransferSharesModal } from "@/components/modals/TransferSharesModal";
import { EmergencyHistory } from "@/components/dashboard/EmergencyHistory";
import { formatRF, currentYear, getPaymentsForYear, formatDate } from "@/lib/utils/format";
import {
  getProgressPercent, getAnnualTarget, getMaxEmergencyCash,
  isPaymentComplete, BUSINESS_RULES, calculateYearlyPayments, type YearlyPayment,
} from "@/lib/types";
import type { Payment, EmergencyRequest } from "@/lib/types";
import { toast } from "sonner";

export default function MemberDashboard() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [paybackOpen, setPaybackOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "emergency">("overview");
  const [completedYear, setCompletedYear] = useState<number | null>(null);
  const [completedYears, setCompletedYears] = useState<Set<number>>(new Set());
  const [sharePrice, setSharePrice] = useState(1000);

  useEffect(() => {
    if (!profile?.uid) return;
    
    // First check for and apply any overdue penalties
    Promise.all([
      checkOverdueEmergencies(profile.uid),
      checkAnnualShortfallPenalties(profile.uid)
    ]).then(() => {
      // Then fetch the latest data
      return Promise.all([
        getUserPayments(profile.uid),
        getUserEmergencyRequests(profile.uid),
        getSystemSettings()
      ]);
    }).then(([p, e, s]) => {
      setPayments(p);
      setEmergencies(e);
      if (s?.shareUnitPrice) setSharePrice(s.shareUnitPrice);
      setLoading(false);
    });
  }, [profile?.uid]);

  if (!profile) return null;

  const progressPercent = getProgressPercent(profile.paidSoFar, profile.totalShareValue);
  const annualTarget = getAnnualTarget(profile.totalShareValue);
  const paidThisYear = getPaymentsForYear(payments, currentYear());
  const yearProgress = Math.min((paidThisYear / annualTarget) * 100, 100);
  const remaining = profile.totalShareValue - profile.paidSoFar;
  const maxEmergency = getMaxEmergencyCash(profile.paidSoFar);
  const completed = isPaymentComplete(profile.paidSoFar, profile.totalShareValue);

  const startYear = new Date(profile.createdAt as string).getFullYear();
  const yearlySchedule = useMemo(() =>
    calculateYearlyPayments(payments, profile.totalShareValue, startYear),
    [payments, profile.totalShareValue, startYear]
  );
  const allYearsCompleted = yearlySchedule.every(year => year.isCompleted);

  // Check for newly completed years and trigger confetti
  useEffect(() => {
    if (loading) return;

    // Check if any year just became completed
    yearlySchedule.forEach((yr, index) => {
      if (yr.isCompleted && !completedYears.has(index)) {
        setCompletedYear(index);
        setCompletedYears(prev => new Set(prev).add(index));
        // Show toast notification
        toast.success(`🎉 Congratulations! Year ${index + 1} completed!`);
        // Reset after animation
        setTimeout(() => setCompletedYear(null), 5000);
      }
    });
  }, [yearlySchedule, loading, completedYears]);

  const activeExposure = emergencies
    .filter(r => ['pending', 'approved', 'disbursed'].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);
  const remainingCapacity = Math.max(0, maxEmergency - activeExposure);

  const totalHistoricalDisbursed = emergencies
    .filter(r => ['disbursed', 'paid'].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-2 lg:p-4 max-w-[1400px] mx-auto space-y-8">
      <Confetti trigger={completed || completedYear !== null} />

      {/* Header - Standardized heart */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-100 pb-8"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
            Savings <span className="text-amber-500">Center</span>
          </h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">Manage your portfolio, track progress, and access emergency funds.</p>
        </div>
        <div className="flex bg-stone-100 p-1.5 rounded-[20px] w-fit self-start md:self-auto">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'reports', label: 'Statements', icon: FileDown },
            { id: 'emergency', label: 'Emergency', icon: AlertCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500 ${activeTab === tab.id
                ? "bg-white text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                : "text-stone-400 hover:text-stone-600"
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Welcome hero */}
            <div className="relative overflow-hidden rounded-[3rem] bg-[#09090b] p-10 lg:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-stone-800">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full -mr-300 -mt-300 blur-[120px]" />
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="text-center lg:text-left">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                    Member Account Active
                  </span>
                  <h1 className="font-display text-5xl lg:text-7xl text-white font-black mb-6 tracking-tight">
                    {profile.fullName.split(' ')[0]}<span className="text-amber-500">.</span>
                  </h1>
                  <p className="text-stone-400 text-xl max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
                    {allYearsCompleted ? "Investment cycle completed successfully." :
                      `Currently on Year ${yearlySchedule.findIndex(y => y.isCurrent) + 1} of your investment journey.`}
                  </p>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-12">
                    <button
                      onClick={() => setPaymentOpen(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-[1.5rem] bg-amber-500 text-stone-900 font-bold text-xs hover:-translate-y-1 transition-all duration-300 shadow-[0_20px_40px_rgba(245,158,11,0.25)] group"
                    >
                      <Wallet size={18} className="group-hover:rotate-12 transition-transform" />
                      <span>Boost Portfolio</span>
                    </button>
                    <button
                      onClick={() => setTransferOpen(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-[1.5rem] bg-white text-stone-900 font-bold text-xs hover:-translate-y-1 transition-all duration-300 shadow-xl border border-stone-200"
                    >
                      <ArrowUpRight size={18} className="text-amber-500" />
                      <span>Transfer Shares</span>
                    </button>
                    <div className="px-6 py-4 rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Portfolio Value</p>
                      <p className="text-2xl font-black text-white">{formatRF(profile.paidSoFar)}</p>
                    </div>
                  </div>
                </div>

                <div className="relative shrink-0 scale-110 lg:scale-125">
                  <div className="absolute inset-0 bg-amber-500/10 blur-[60px] rounded-full" />
                  <ProgressCircle
                    percent={progressPercent}
                    size={220}
                    label="Growth Status"
                    sublabel={`${Math.round(progressPercent)}%`}
                    emoji={completed ? "🏁" : "✨"}
                  />
                </div>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Savings" value={formatRF(profile.paidSoFar)} subtitle="Accumulated equity" icon={TrendingUp} color="gold" delay={0.1}
                trend={{ value: 12.5, label: "growth" }}
              />
              <StatCard
                title="Target Value" value={formatRF(profile.totalShareValue)} subtitle="Portfolio goal" icon={Target} color="blue" delay={0.15}
                trend={{ value: 25, label: "fulfilled" }}
              />
              <StatCard
                title="Penalty Owed" value={formatRF(profile.shortfallPenaltyOwed || 0)} subtitle="Annual Shortfall" icon={AlertCircle} color="red" delay={0.2}
                trend={{ value: 50, label: "penalty rate" }}
              />
              <StatCard
                title="Cycle Progress" value={`${Math.round(progressPercent)}%`} subtitle="Fulfillment rate" icon={CheckCircle2} color="green" delay={0.25}
                trend={{ value: Math.round(progressPercent), label: "progress" }}
              />
              <StatCard
                title="Dividends" value={formatRF(profile.paidSoFar * 0.05)} subtitle="Accrued growth" icon={DollarSign} color="purple" delay={0.3}
                trend={{ value: 5, label: "yield" }}
              />
            </div>

            <div className="space-y-12">
              {/* Year Breakdown - Full Width heart */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl text-stone-900 font-bold">5-Year Growth Map</h2>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400">
                    <Info size={14} /> Tracking {startYear} - {startYear + BUSINESS_RULES.PAYMENT_YEARS - 1}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                  {yearlySchedule.map((yr, i) => {
                    const pct = Math.min((yr.paid / yr.target) * 100, 100);
                    const isCurrent = yr.isCurrent;
                    return (
                      <div key={yr.year} className={`relative rounded-[2rem] p-6 border-2 transition-all duration-500 overflow-hidden group ${isCurrent ? 'border-amber-500 bg-amber-500/5 shadow-[0_20px_40px_rgba(245,158,11,0.1)]' : yr.isCompleted ? 'border-green-500 bg-green-500/5' : 'border-stone-100 bg-white shadow-sm hover:border-stone-200'}`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-stone-100/50" />
                        <p className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-[0.2em]">Year {i + 1}</p>
                        <p className="text-xl font-black text-stone-900 mb-6">{yr.year}</p>

                        <div className="h-2 w-full bg-stone-100/50 rounded-full overflow-hidden mb-4">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                          />
                        </div>

                        <p className="text-sm font-black text-stone-900 mb-1">{formatRF(yr.paid)}</p>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Target {formatRF(yr.target)}</p>

                        {yr.isCompleted && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200 scale-90">
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Certificate Button */}
                {allYearsCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <motion.button
                      onClick={() => window.open('/member/certificate', '_blank')}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckCircle2 size={20} />
                      Get Your Certificate
                    </motion.button>
                    <p className="text-xs text-stone-500 mt-2">🎉 Congratulations! You've completed your 5-year commitment.</p>
                  </motion.div>
                )}
              </div>

              {/* Current Status - Full Width Bottom heart */}
              <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-stone-100 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h3 className="font-display text-3xl text-stone-900 font-black tracking-tight">Portfolio Status</h3>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setPaymentOpen(true)}
                      className="flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] bg-amber-500 text-stone-900 font-bold text-xs hover:-translate-y-1 transition-all duration-300 shadow-[0_20px_40px_rgba(245,158,11,0.25)] group"
                    >
                      <Wallet size={18} className="group-hover:rotate-12 transition-transform" />
                      <span>One-Click Saving</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-stone-50 text-stone-900 font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all border border-stone-200/50"
                    >
                      Review Statements <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatusItem icon={Wallet} label="Shares Acquired" value={`${Math.floor(profile.totalShareValue / sharePrice)} Units`} />
                  <StatusItem icon={Calculator} label="Interest Owed" value={formatRF(profile.interestOwed)} />
                  <StatusItem icon={History} label="Last Payment" value={payments[0] ? formatDate(payments[0].date) : 'N/A'} />
                  <StatusItem icon={CheckCircle2} label="Commitment" value={`${yearlySchedule.filter(y => y.isCompleted).length} / 5 Years`} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-stone-900">Savings Statements</h2>
                <p className="text-stone-500 text-sm mt-1">Detailed history of all transactions and contributions</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] border-2 border-stone-200 font-bold text-stone-700 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
              >
                <FileDown size={20} /> Print Official Report
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Contributions" value={formatRF(profile.paidSoFar)} 
                icon={TrendingUp} color="gold" delay={0.1}
              />
              <StatCard 
                title="Shares Fulfilled" value={`${Math.round(progressPercent)}%`} 
                icon={Target} color="blue" delay={0.15}
              />
              <StatCard 
                title="Total Disbursed (All Time)" value={formatRF(totalHistoricalDisbursed)} 
                icon={AlertCircle} color="red" delay={0.2}
              />
              <StatCard 
                title="Interest Owed" value={formatRF(profile.interestOwed)} 
                icon={Calculator} color="purple" delay={0.25}
              />
            </div>

            <PaymentTable payments={payments} showExport title="Transaction History" />
          </motion.div>
        )}

        {activeTab === 'emergency' && (
          <motion.div
            key="emergency"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* High-Density Emergency Stats heart */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Historically Disbursed"
                subtitle="All time emergency loans"
                value={formatRF(totalHistoricalDisbursed)}
                icon={History}
                color="blue"
                delay={0.1}
              />
              <StatCard
                title="Outstanding Debt"
                subtitle="Principal + Interest"
                value={formatRF((profile.emergencyTaken || 0) + (profile.interestOwed || 0))}
                icon={Calculator}
                color="red"
                delay={0.2}
              />
              <StatCard
                title="Available to Request"
                subtitle={`Out of ${formatRF(maxEmergency)} limit`}
                value={formatRF(remainingCapacity)}
                icon={TrendingUp}
                color="gold"
                delay={0.3}
              />
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                  
                  <div className="relative z-10 space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-black text-stone-900 leading-tight">Collective Support heart</h2>
                      <p className="text-stone-500 text-sm mt-2 font-medium">
                        Need temporary assistance? You can access up to <span className="text-amber-600 font-black">40%</span> of your contributions with a transparent <span className="text-amber-600 font-black">5%</span> interest rate heart.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setEmergencyOpen(true)}
                        disabled={profile.paidSoFar === 0}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[1.8rem] bg-amber-500 text-white font-black text-sm hover:bg-amber-600 transition-all shadow-xl shadow-amber-200/50 disabled:opacity-50"
                      >
                        New Emergency Request <ArrowUpRight size={20} />
                      </button>
                      
                      <button
                        onClick={() => setPaybackOpen(true)}
                        disabled={profile.emergencyTaken === 0 && profile.interestOwed === 0 && (profile.shortfallPenaltyOwed || 0) === 0}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[1.8rem] bg-stone-900 text-white font-black text-sm hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 disabled:opacity-50"
                      >
                        Payback Funds <Wallet size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-3xl bg-amber-50/50 border border-amber-100 italic text-[11px] font-bold text-amber-800 leading-snug">
                  <Info className="shrink-0 text-amber-600" size={18} />
                  Official Note: All requests require digital verification and approval from the Cooperative Board of Directors.
                </div>
              </div>

              <div className="lg:col-span-3">
                <EmergencyHistory requests={emergencies} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Modal */}
      <EmergencyModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        maxAmount={maxEmergency}
        userId={profile.uid}
        userName={profile.fullName}
        paidSoFar={profile.paidSoFar}
        emergencyTaken={profile.emergencyTaken}
        interestOwed={profile.interestOwed}
        activeExposure={activeExposure}
        remainingCapacity={remainingCapacity}
      />

      <PaybackModal
        isOpen={paybackOpen}
        onClose={() => setPaybackOpen(false)}
        uid={profile.uid}
        interestOwed={profile.interestOwed}
        principalOwed={profile.emergencyTaken}
        shortfallPenaltyOwed={profile.shortfallPenaltyOwed || 0}
      />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        userId={profile.uid}
        userName={profile.fullName}
      />

      <TransferSharesModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        sender={profile}
      />

      {/* Official Print Layout heart */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-12">
        <div className="flex justify-between items-start border-b-2 border-stone-900 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center overflow-hidden">
              <img src="/assets/icon.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-stone-900">COMPASLINK INVESTMENT A</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Official Member Secretariat</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-stone-900">Saving History</h2>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-1 italic">Verified Official Document</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Account Holder</p>
              <p className="text-lg font-black text-stone-900">{profile.fullName}</p>
              <p className="text-xs font-bold text-stone-600">{profile.nationalID}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Contact Information</p>
              <p className="text-xs font-bold text-stone-600">{profile.phone}</p>
              <p className="text-xs font-bold text-stone-600">{profile.email}</p>
            </div>
          </div>
          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Portfolio Status</span>
              <span className="px-3 py-1 bg-stone-900 text-white text-[9px] font-black rounded-full uppercase">Verified heart</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Total Saved</p>
                <p className="text-xl font-black text-stone-900">{formatRF(profile.paidSoFar)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Shares Done</p>
                <p className="text-xl font-black text-stone-900">{Math.round(getProgressPercent(profile.paidSoFar, profile.totalShareValue))}%</p>
              </div>
            </div>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-12">
          <thead>
            <tr className="border-b-2 border-stone-900">
              <th className="py-4 text-[10px] font-black text-stone-900 uppercase tracking-widest">Date</th>
              <th className="py-4 text-[10px] font-black text-stone-900 uppercase tracking-widest">Ref Year</th>
              <th className="py-4 text-[10px] font-black text-stone-900 uppercase tracking-widest">Type</th>
              <th className="py-4 text-right text-[10px] font-black text-stone-900 uppercase tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm">
            {payments.map(p => (
              <tr key={p.id}>
                <td className="py-3 font-bold text-stone-800">{formatDate(p.date)}</td>
                <td className="py-3 font-black text-stone-500">FY {p.year}</td>
                <td className="py-3 font-medium text-stone-600 truncate max-w-[200px]">{p.note || "Cooperative Contribution"}</td>
                <td className="py-3 text-right font-black text-stone-900">{formatRF(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-auto pt-12 border-t border-stone-200">
          <div className="flex justify-between items-end">
            <div className="space-y-8">
              <div className="w-48 h-px bg-stone-300 relative">
                <p className="absolute top-2 left-0 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Member Signature</p>
              </div>
              <div className="w-48 h-px bg-stone-300 relative">
                <p className="absolute top-2 left-0 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Cooperative Secretariat</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Generated On</p>
              <p className="text-xs font-bold text-stone-900">{formatDate(new Date().toISOString())}</p>
              <div className="mt-4 flex items-center justify-end gap-2 text-stone-400">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-[9px] font-black uppercase tracking-widest">Secure 256-bit Digital Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all border border-stone-100">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-stone-800">{value}</p>
      </div>
      <ChevronRight size={14} className="ml-auto text-stone-200 group-hover:text-amber-400 transition-all" />
    </div>
  );
}

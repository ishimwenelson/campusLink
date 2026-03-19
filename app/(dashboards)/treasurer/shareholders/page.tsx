"use client";
import { useState, useEffect } from "react";
import { getAllUsers, getUserPayments, getUserEmergencyRequests } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Search, ChevronRight, Wallet, AlertCircle,
    History, CreditCard, ArrowLeft, Loader2,
    CheckCircle2, X, TrendingUp, Shield, DollarSign, BarChart3
} from "lucide-react";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { CampusUser, Payment, EmergencyRequest } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { AdminPaybackModal } from "@/components/modals/AdminPaybackModal";
import { cn } from "@/lib/utils/cn";

export default function ShareholdersLedger() {
    const [members, setMembers] = useState<CampusUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState<CampusUser | null>(null);
    const [memberHistory, setMemberHistory] = useState<{ payments: Payment[], emergencies: EmergencyRequest[] } | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [paybackModalOpen, setPaybackModalOpen] = useState(false);

    useEffect(() => {
        getAllUsers().then((u) => {
            setMembers(u);
            setLoading(false);
        });
    }, []);

    const fetchHistory = async (user: CampusUser) => {
        setSelectedMember(user);
        setHistoryLoading(true);
        setMemberHistory(null);
        try {
            const [p, e] = await Promise.all([
                getUserPayments(user.uid),
                getUserEmergencyRequests(user.uid)
            ]);
            setMemberHistory({ payments: p, emergencies: e });
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const filtered = members.filter(m =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.nationalID?.includes(search) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    // Summary stats
    const totalEquity    = members.reduce((s, m) => s + (m.paidSoFar || 0), 0);
    const totalLoans     = members.reduce((s, m) => s + (m.emergencyTaken || 0), 0);
    const totalInterest  = members.reduce((s, m) => s + (m.interestOwed || 0), 0);
    const avgCompletion  = members.length
        ? Math.round(members.reduce((s, m) => s + Math.min((m.paidSoFar / m.totalShareValue) * 100, 100), 0) / members.length)
        : 0;

    if (loading) return (
        <div className="flex items-center justify-center h-screen -mt-20">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-amber-500" size={40} />
                <p className="text-xs text-stone-400 font-black uppercase tracking-widest animate-pulse">Loading Ledger...</p>
            </div>
        </div>
    );

    return (
        <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-20 max-w-[1500px] mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="tracking-tight text-3xl font-black text-stone-900 leading-none">
                        Shareholders <span className="text-amber-500">Ledger</span>
                    </h1>
                    <p className="text-stone-500 font-medium text-xs mt-2">Institutional record of member equity, contributions, and capital activity.</p>
                </div>
                {/* Search */}
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search member, ID or email…"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm font-medium text-stone-700 placeholder:text-stone-300 transition-all"
                    />
                </div>
            </div>

            {/* Stat Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Shareholders" value={`${members.length} members`} icon={Users}    color="gold"  delay={0} />
                <StatCard title="Total Equity Pool"  value={formatRF(totalEquity)}       icon={DollarSign} color="green" delay={0.05} />
                <StatCard title="Total Loans Out"    value={formatRF(totalLoans)}        icon={AlertCircle} color="red"  delay={0.1} />
                <StatCard title="Avg. Completion"    value={`${avgCompletion}%`}         icon={BarChart3}  color="blue" delay={0.15} />
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-stone-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-950 flex items-center justify-center text-white shadow-lg">
                            <Users size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-stone-900 tracking-tight uppercase">Member Equity Registry</h2>
                            <p className="text-[10px] text-stone-400 font-bold mt-0.5 uppercase tracking-widest">{filtered.length} shareholders · Click any row for full history</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50/60 border-b border-stone-100">
                                {["Shareholder", "Shares", "Equity Paid", "Completion", "Account", ""].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {filtered.map((m, i) => {
                                const totalUnits = Math.floor(m.totalShareValue / 1000);
                                const pct = Math.min((m.paidSoFar / m.totalShareValue) * 100, 100);
                                return (
                                    <motion.tr
                                        key={m.uid}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                                        onClick={() => fetchHistory(m)}
                                        className="group hover:bg-amber-50/20 transition-colors cursor-pointer"
                                    >
                                        {/* Name */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-stone-950 flex items-center justify-center text-white font-black text-sm group-hover:bg-amber-500 transition-colors duration-300 flex-shrink-0">
                                                    {m.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-stone-900 uppercase tracking-tight leading-none">{m.fullName}</p>
                                                    <p className="text-[9px] text-stone-400 font-bold mt-0.5 uppercase tracking-widest">{m.nationalID || "No ID"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Shares */}
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-black text-stone-900">{totalUnits} <span className="text-stone-400 font-bold">shares</span></p>
                                            <p className="text-[9px] text-stone-400 font-bold mt-0.5">Target: {formatRF(m.totalShareValue)}</p>
                                        </td>
                                        {/* Equity */}
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-black text-stone-900">{formatRF(m.paidSoFar)}</p>
                                            <p className="text-[9px] text-emerald-600 font-black mt-0.5">{Math.round(pct)}% fulfilled</p>
                                        </td>
                                        {/* Progress bar */}
                                        <td className="px-6 py-4 w-36">
                                            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-[8px] text-stone-400 font-bold mt-1">{Math.round(pct)}%</p>
                                        </td>
                                        {/* Account */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500">
                                                <CreditCard size={11} className="text-stone-300" />
                                                {m.accountUsedWhileSaving || "—"}
                                            </div>
                                        </td>
                                        {/* CTA */}
                                        <td className="px-6 py-4">
                                            <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
                                                <ChevronRight size={16} />
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest">
                                        No shareholders match your search
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History Slide-over */}
            <AnimatePresence>
                {selectedMember && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedMember(null)}
                            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Panel Header */}
                            <div className="bg-stone-950 p-6 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-900/30">
                                        {selectedMember.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="font-black text-white text-base tracking-tight leading-none">{selectedMember.fullName}</h2>
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1">Shareholder Record</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedMember(null)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Summary Strip */}
                            <div className="grid grid-cols-2 divide-x divide-stone-100 border-b border-stone-100 flex-shrink-0">
                                <div className="p-5">
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Paid</p>
                                    <p className="text-xl font-black text-stone-900 tracking-tighter">{formatRF(selectedMember.paidSoFar)}</p>
                                    <p className="text-[9px] text-emerald-600 font-black mt-1">
                                        {Math.round(Math.min((selectedMember.paidSoFar / selectedMember.totalShareValue) * 100, 100))}% of target
                                    </p>
                                </div>
                                <div className="p-5">
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Loans Taken</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xl font-black text-red-600 tracking-tighter">{formatRF(selectedMember.emergencyTaken)}</p>
                                        {selectedMember.emergencyTaken > 0 || selectedMember.interestOwed > 0 ? (
                                            <button 
                                                onClick={() => setPaybackModalOpen(true)}
                                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
                                            >
                                                Record Payback
                                            </button>
                                        ) : null}
                                    </div>
                                    <p className="text-[9px] text-amber-600 font-black mt-1">+{formatRF(selectedMember.interestOwed)} interest</p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {historyLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                                        <Loader2 className="animate-spin text-amber-500" size={36} />
                                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest animate-pulse">Loading records…</p>
                                    </div>
                                ) : memberHistory && (
                                    <>
                                        {/* Contribution History */}
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                                    <Wallet size={15} />
                                                </div>
                                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">Contribution History</h3>
                                            </div>
                                            {memberHistory.payments.length === 0 ? (
                                                <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest py-4 text-center">No payments recorded yet</p>
                                            ) : memberHistory.payments.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                            <CheckCircle2 size={15} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-stone-900 uppercase">{p.year} Installment</p>
                                                            <p className="text-[9px] text-stone-400 font-bold">{formatDate(p.date)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-stone-900 text-sm">{formatRF(p.amount)}</p>
                                                </div>
                                            ))}
                                        </section>

                                        {/* Emergency Disbursements */}
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
                                                    <AlertCircle size={15} />
                                                </div>
                                                <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">Emergency Disbursements</h3>
                                            </div>
                                            {memberHistory.emergencies.length === 0 ? (
                                                <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest py-4 text-center">No emergency requests found</p>
                                            ) : memberHistory.emergencies.map((e) => (
                                                <div key={e.id} className="p-4 rounded-2xl border border-stone-100 hover:border-red-100 hover:bg-red-50/10 transition-all space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                                            (e.status as string) === "approved" || (e.status as string) === "disbursed"
                                                                ? "bg-green-50 text-green-700 border border-green-100"
                                                                : (e.status as string) === "pending"
                                                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                                                : "bg-stone-50 text-stone-500 border border-stone-100"
                                                        )}>{e.status}</span>
                                                        <span className="text-[9px] text-stone-400 font-bold">{formatDate(e.requestedAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">Principal</p>
                                                            <p className="text-lg font-black text-stone-900 tracking-tighter">{formatRF(e.amount)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">Interest (5%)</p>
                                                            <p className="text-sm font-black text-red-600">+{formatRF(e.interestAmount)}</p>
                                                        </div>
                                                    </div>
                                                    {e.note && (
                                                        <p className="text-[10px] text-stone-500 bg-stone-50 p-3 rounded-xl italic border border-stone-100">"{e.note}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </section>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AdminPaybackModal
                isOpen={paybackModalOpen}
                onClose={() => setPaybackModalOpen(false)}
                preSelectedUser={selectedMember}
            />
        </div>
    );
}

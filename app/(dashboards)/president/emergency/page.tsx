"use client";
import { useState, useEffect } from "react";
import { getAllEmergencyRequests, approveEmergencyRequest, rejectEmergencyRequest } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
    AlertCircle, TrendingUp, Users, Search, 
    Download, ShieldCheck, ArrowRight,
    CheckCircle, XCircle, Clock, CreditCard,
    Filter, Loader2
} from "lucide-react";
import { formatRF, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { RejectionReasonModal } from "@/components/modals/RejectionReasonModal";

export default function PresidentEmergencyPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [processingId, setProcessingId] = useState<string | null>(null);

    
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [requestToReject, setRequestToReject] = useState<any | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        setLoading(true);
        try {
            const data = await getAllEmergencyRequests();
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load emergency ledger");
        } finally {
            setLoading(false);
        }
    }

    const filteredRequests = requests.filter(req => {
        const matchesSearch = 
            req.userDoc?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.userDoc?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    
    const totalRequested = requests.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDisbursed = requests.filter(r => r.status === 'disbursed' || r.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const totalInterestAccumulated = requests.reduce((acc, curr) => acc + (curr.interestAmount || 0), 0);

    const handleApprove = async (req: any) => {
        setProcessingId(req.id);
        try {
            await approveEmergencyRequest(req.userId, req.id, profile!.uid);
            
            setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
            toast.success(`Liquidity request for ${req.userDoc?.fullName} approved `);
        } catch { toast.error("Failed to authorize request"); }
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
            setRequests(prev => prev.map(r => r.id === requestToReject.id ? { ...r, status: 'rejected', rejectionReason: reason } : r));
            toast.error(`Request denied: ${reason}`);
            setIsRejectModalOpen(false);
            setRequestToReject(null);
        } catch { 
            toast.error("Failed to deny request"); 
        } finally { 
            setIsRejecting(false); 
        }
    };

    return (
        <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-20 max-w-[1500px] mx-auto space-y-8">
            {}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="tracking-tight text-3xl font-black text-stone-900 leading-none">
                        Emergency <span className="text-amber-500">Ledger</span>
                    </h1>
                    <p className="text-stone-500 font-medium text-xs mt-2 max-w-xl">
                        Executive oversight and institutional capital liquidity audit log.
                    </p>
                </div>
                <div className="flex gap-3">
                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm"
                        onClick={() => toast.info("Generating liquidity audit report...")}
                    >
                        <Download size={14} /> Export PDF
                    </motion.button>
                </div>
            </motion.div>

            {}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Requested" 
                    value={formatRF(totalRequested)} 
                    subtitle="Gross capital intent"
                    icon={TrendingUp} 
                    color="gold" 
                    delay={0.1} 
                />
                <StatCard 
                    title="Total Disbursed" 
                    value={formatRF(totalDisbursed)} 
                    subtitle="Active institutional outflow"
                    icon={CreditCard} 
                    color="blue" 
                    delay={0.15} 
                />
                <StatCard 
                    title="Interest Yield" 
                    value={formatRF(totalInterestAccumulated)} 
                    subtitle="Projected revenue"
                    icon={TrendingUp} 
                    color="green" 
                    delay={0.2} 
                />
                <StatCard 
                    title="Pending Needs" 
                    value={pendingCount.toString()} 
                    subtitle="Requests awaiting review"
                    icon={AlertCircle} 
                    color="purple" 
                    delay={0.25} 
                />
            </div>

            {}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden"
            >
                {}
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-5 gap-4 border-b border-stone-50">
                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search by member identity..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50/50 border border-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all text-xs font-bold text-stone-700 placeholder:text-stone-300"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                        <Filter size={14} className="text-stone-300 mr-2 hidden md:block" />
                        {['all', 'pending', 'approved', 'disbursed', 'paid', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                    statusFilter === status 
                                        ? "bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-200" 
                                        : "bg-white text-stone-400 border-stone-100 hover:bg-stone-50"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-stone-50/60">
                                {["Member Identity", "Principal", "Interest", "Lifecycle", "Timeline", "Actions"].map((h, i) => (
                                    <th key={h} className={cn(
                                        "px-6 py-3 text-left text-[9px] font-black text-stone-400 uppercase tracking-widest",
                                        i === 5 && "text-right"
                                    )}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-amber-500" size={32} />
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest animate-pulse">Scanning Institutional Ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <ShieldCheck size={40} className="text-stone-200" />
                                            <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">No matching records found in audit logs</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req, i) => (
                                    <motion.tr 
                                        key={req.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                                        className="hover:bg-stone-50/50 transition-all group"
                                    >
                                        <td className="px-6 py-2.5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center text-white text-[10px] font-black group-hover:bg-amber-500 transition-colors">
                                                    {req.userDoc?.fullName?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-stone-900 leading-none">{req.userDoc?.fullName}</span>
                                                    <span className="text-[9px] text-stone-400 font-medium">{req.userDoc?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-stone-900 tracking-tight">{formatRF(req.amount)}</span>
                                                <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Principal Asset</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-emerald-600 italic">+{formatRF(req.interestAmount)}</span>
                                                <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Yield ({Math.round(req.interestRate * 100)}%)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                req.status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                                                req.status === 'approved' && "bg-blue-50 text-blue-600 border-blue-100",
                                                req.status === 'disbursed' && "bg-purple-50 text-purple-600 border-purple-100",
                                                req.status === 'paid' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                                req.status === 'rejected' && "bg-red-50 text-red-600 border-red-100",
                                            )}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-stone-500 uppercase">{formatDate(req.requestedAt)}</span>
                                                <span className="text-[8px] font-bold text-stone-300 uppercase italic">Mature: {formatDate(req.dueDate)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleApprove(req); }}
                                                            disabled={processingId === req.id}
                                                            className="p-2 rounded-xl bg-stone-900 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-stone-200 disabled:opacity-50"
                                                            title="Authorize Disbursement"
                                                        >
                                                            {processingId === req.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRejectClick(req); }}
                                                            disabled={processingId === req.id}
                                                            className="p-2 rounded-xl bg-white border border-stone-100 text-stone-300 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                                                            title="Deny Request"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    className="p-2 rounded-xl bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-all"
                                                    title="View Full Identity"
                                                >
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                className="flex items-start gap-5 p-6 rounded-[2.5rem] bg-stone-950 text-white shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                    <ShieldCheck size={120} />
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-amber-500 flex-shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-sm font-black tracking-tight mb-2 italic">Institutional Outflow Auditing</h3>
                    <p className="text-[11px] text-stone-400 font-medium leading-relaxed max-w-4xl">
                        This ledger provides a canonical record of all emergency capital liquidity events. All disbursements represent formal institutional loans subject to prescribed interest rates and maturity dates. Executive oversight ensures capital preservation and risk management alignment.
                    </p>
                </div>
            </motion.div>

            <RejectionReasonModal 
                isOpen={isRejectModalOpen}
                onClose={() => { setIsRejectModalOpen(false); setRequestToReject(null); }}
                onConfirm={handleConfirmReject}
                loading={isRejecting}
            />
        </div>
    );
}

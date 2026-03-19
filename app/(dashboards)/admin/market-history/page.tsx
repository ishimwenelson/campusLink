"use client";
import { useState, useEffect } from "react";
import { getMarketHistory } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
    History, TrendingUp, Users, Search, 
    Download, ShieldCheck, ArrowRight,
    ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { formatRF } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";

export default function MarketHistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchHistory();
    }, []);

    async function fetchHistory() {
        setLoading(true);
        try {
            const data = await getMarketHistory();
            setHistory(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load market history");
        } finally {
            setLoading(false);
        }
    }

    const filteredHistory = history.filter(h => 
        h.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.buyerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalVolume = history.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalSharesTraded = history.reduce((acc, curr) => acc + curr.shares, 0);

    return (
        <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-20 max-w-[1500px] mx-auto space-y-8">
            {}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="tracking-tight text-3xl font-black text-stone-900 leading-none">
                        Market <span className="text-amber-500">History</span>
                    </h1>
                    <p className="text-stone-500 font-medium text-xs mt-2 max-w-xl">
                        Comprehensive institutional audit logs for global equity transfers and settlement history.
                    </p>
                </div>
                <div className="flex gap-3">
                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm"
                        onClick={() => toast.info("Generating security audit report...")}
                    >
                        <Download size={14} /> Export Audit
                    </motion.button>
                </div>
            </motion.div>

            {}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Cumulative Volume" 
                    value={formatRF(totalVolume)} 
                    subtitle="Total capital movement"
                    icon={TrendingUp} 
                    color="gold" 
                    delay={0.1} 
                />
                <StatCard 
                    title="Shares Traded" 
                    value={totalSharesTraded.toLocaleString()} 
                    subtitle="Liquidity volume"
                    icon={Users} 
                    color="blue" 
                    delay={0.15} 
                />
                <StatCard 
                    title="Executed Deals" 
                    value={history.length.toString()} 
                    subtitle="Successful logs"
                    icon={History} 
                    color="green" 
                    delay={0.2} 
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
                            placeholder="Search by counterparties..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50/50 border border-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all text-xs font-bold text-stone-700 placeholder:text-stone-300"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-100/50 italic animate-pulse">
                            ● Ledger Sync: Active
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-stone-50/60">
                                {["Counterparties", "Shares", "Rate", "Settlement", "Execution Data"].map((h, i) => (
                                    <th key={h} className={cn(
                                        "px-6 py-3 text-left text-[9px] font-black text-stone-400 uppercase tracking-widest",
                                        i === 4 && "text-right"
                                    )}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest animate-pulse">Scanning Ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">No historical records found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((record, i) => (
                                    <motion.tr 
                                        key={record.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                                        className="hover:bg-stone-50/50 transition-all group"
                                    >
                                        <td className="px-6 py-2.5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-2">
                                                    <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-white text-[9px] font-black ring-2 ring-white" title={`Seller: ${record.sellerName}`}>
                                                        {record.sellerName?.charAt(0)}
                                                    </div>
                                                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white text-[9px] font-black ring-2 ring-white" title={`Buyer: ${record.buyerName}`}>
                                                        {record.buyerName?.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[11px] font-black text-stone-900 leading-none">{record.sellerName}</span>
                                                        <ArrowRight size={10} className="text-stone-300" />
                                                        <span className="text-[11px] font-black text-amber-600 leading-none">{record.buyerName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="px-2 py-0.5 bg-stone-50 border border-stone-100 rounded-md text-[9px] font-black text-stone-600">
                                                    {record.shares.toLocaleString()}
                                                </div>
                                                <span className="text-[8px] font-black text-stone-300 uppercase">Shares</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <span className="text-[10px] font-black text-stone-500 italic">{formatRF(record.pricePerShare)}</span>
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <span className="text-sm font-black text-stone-900 tracking-tighter">{formatRF(record.totalPrice)}</span>
                                        </td>
                                        <td className="px-6 py-2.5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-stone-500 uppercase">{new Date(record.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[8px] font-bold text-stone-300 uppercase tracking-tighter">{new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                    <h3 className="text-sm font-black tracking-tight mb-2 italic">Institutional Compliance Finality</h3>
                    <p className="text-[11px] text-stone-400 font-medium leading-relaxed max-w-4xl">
                        This ledger provides a canonical, high-fidelity record of all equity transfers finalized between counterparties. Recorded transactions represent legal ownership shifts and are immutable signatures of institutional liquidation or accumulation events.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

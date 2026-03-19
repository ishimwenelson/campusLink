"use client";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { EmergencyRequest } from "@/lib/types";
import { motion } from "framer-motion";
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Props {
    requests: EmergencyRequest[];
}

export function EmergencyHistory({ requests }: Props) {
    if (requests.length === 0) return null;

    return (
        <div className="card-gold p-6 rounded-2xl border border-stone-100 shadow-xl bg-white overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h2 className="font-display text-lg font-bold text-stone-900">Emergency Cash History</h2>
                    <p className="text-xs text-stone-500 font-medium">Tracking your emergency withdrawals and interests</p>
                </div>
            </div>

            <div className="overflow-x-auto -mx-6 text-nowrap lg:text-wrap">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-stone-50/50">
                            <th className="px-6 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Amount</th>
                            <th className="px-6 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Interest (Base)</th>
                            <th className="px-6 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {requests.map((req, i) => (
                            <motion.tr
                                key={req.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group hover:bg-amber-50/20 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-stone-300" />
                                            <span className="text-xs font-semibold text-stone-700">{formatDate(req.requestedAt)}</span>
                                        </div>
                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <p className="text-[10px] font-medium text-red-500 italic mt-1 leading-tight">
                                                Reason: {req.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-stone-900 text-right">
                                    {formatRF(req.amount)}
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-amber-700 text-right">
                                    +{formatRF(req.interestAmount)}
                                    <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">5% Tier 1</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <StatusBadge status={req.status} />
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: EmergencyRequest["status"] }) {
    const configs = {
        pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200" },
        approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        disbursed: { label: "Disbursed", icon: CheckCircle2, className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
        rejected: { label: "Rejected", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
        paid: { label: "Paid", icon: CheckCircle2, className: "bg-blue-100 text-blue-700 border-blue-200" },
    };

    const { label, icon: Icon, className } = configs[status] || configs.pending;

    return (
        <div className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${className}`}>
            <Icon size={10} />
            {label}
        </div>
    );
}

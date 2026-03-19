"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Bell, CheckCircle2, AlertCircle, Info, 
    Calendar, TrendingUp, Wallet, Shield, 
    Filter, Trash2, Sparkles, ArrowRight,
    Clock, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useState } from "react";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
    const { profile } = useAuth();
    const { notifications, markRead, markAllRead } = useNotifications(profile?.uid, 100);
    const [filter, setFilter] = useState<Notification["type"] | "all">("all");

    const filteredNotifs = notifications.filter(n => filter === "all" || n.type === filter);

    const getTypeConfig = (type: Notification["type"]) => {
        switch (type) {
            case "payment":
                return { icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
            case "emergency_request":
                return { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
            case "emergency_approved":
                return { icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
            case "emergency_rejected":
                return { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
            case "proposal_new":
                return { icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
            case "meeting_invite":
                return { icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
            default:
                return { icon: Info, color: "text-stone-500", bg: "bg-stone-500/10", border: "border-stone-500/20" };
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-10">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight flex items-center gap-4">
                        Activity Hub
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                    </h1>
                    <p className="text-stone-500 font-medium mt-2 max-w-md">
                        Stay informed about your institutional progress and community updates.
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => markAllRead()}
                        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white border border-stone-200 text-stone-600 font-bold text-xs uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm active:scale-95"
                    >
                        <CheckCircle2 size={16} />
                        Mark All Read
                    </button>
                </div>
            </header>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2.5">
                {[
                    { id: 'all', label: 'All Updates', icon: Filter },
                    { id: 'payment', label: 'Finances', icon: Wallet },
                    { id: 'emergency_request', label: 'Emergency', icon: AlertCircle },
                    { id: 'meeting_invite', label: 'Meetings', icon: Calendar },
                    { id: 'proposal_new', label: 'Governance', icon: Shield },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id as any)}
                        className={cn(
                            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            filter === item.id 
                                ? "bg-stone-900 border-stone-900 text-white shadow-lg shadow-stone-900/20" 
                                : "bg-white border-stone-100 text-stone-400 hover:border-stone-200 hover:text-stone-600"
                        )}
                    >
                        <item.icon size={14} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredNotifs.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="py-32 text-center bg-white rounded-[3rem] border border-stone-100 shadow-sm"
                        >
                            <div className="w-20 h-20 bg-stone-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-stone-300">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-black text-stone-900">Crystal Clear</h3>
                            <p className="text-stone-400 font-medium text-sm mt-1">No activity records match your current filter.</p>
                        </motion.div>
                    ) : (
                        filteredNotifs.map((n, idx) => {
                            const config = getTypeConfig(n.type);
                            return (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn(
                                        "group relative flex items-start gap-6 p-6 rounded-[2.5rem] border bg-white transition-all hover:shadow-xl hover:shadow-stone-900/5",
                                        !n.read ? "border-amber-500/30 bg-amber-500/[0.02]" : "border-stone-100"
                                    )}
                                    onClick={() => markRead(n.id)}
                                >
                                    {/* Icon Column */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 border",
                                        config.bg, config.color, config.border
                                    )}>
                                        <config.icon size={22} />
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-sm lg:text-base font-black text-stone-900 truncate tracking-tight">{n.title}</h3>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Clock size={12} className="text-stone-300" />
                                                    {formatDate(n.createdAt)}
                                                </span>
                                                {!n.read && (
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-stone-500 leading-relaxed font-medium line-clamp-2">{n.message}</p>
                                        
                                        <div className="flex items-center gap-4 mt-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                config.bg, config.color, config.border
                                            )}>
                                                {n.type.replace('_', ' ')}
                                            </span>
                                            
                                            <button className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Context <ArrowRight size={10} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visual Accent */}
                                    {!n.read && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-amber-500 rounded-r-full" />
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination / Footer placeholder */}
            {filteredNotifs.length > 0 && (
                <div className="pt-10 text-center border-t border-stone-100">
                    <p className="text-xs font-bold text-stone-400">Institutional Ledger v4.0.2 • Verified Transaction Feed</p>
                </div>
            )}
        </div>
    );
}

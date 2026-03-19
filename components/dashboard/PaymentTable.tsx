"use client";
import React, { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Download, ChevronLeft, ChevronRight, Filter, 
  Calendar, ArrowUpDown, MoreHorizontal, FileText,
  Clock, CheckCircle, Smartphone, Info
} from "lucide-react";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { Payment } from "@/lib/types";
import Papa from "papaparse";

interface PaymentTableProps {
  payments: Payment[];
  showExport?: boolean;
  title?: string;
}

const getProviderConfig = (provider?: string) => {
  if (!provider) return { dot: "bg-stone-400 shadow-[0_0_8px_#a8a29e]", label: "Standard Deposit" };
  const p = provider.toLowerCase();
  if (p.includes("mtn")) return { dot: "bg-yellow-400 shadow-[0_0_8px_#fbbf24]", label: provider };
  if (p.includes("airtel")) return { dot: "bg-red-500 shadow-[0_0_8px_#ef4444]", label: provider };
  if (p.includes("treasurer") || p.includes("manual")) return { dot: "bg-emerald-500 shadow-[0_0_8px_#10b981]", label: provider };
  if (p.includes("system") || p.includes("disbursement")) return { dot: "bg-indigo-500 shadow-[0_0_8px_#6366f1]", label: provider };
  return { dot: "bg-blue-400 shadow-[0_0_8px_#60a5fa]", label: provider };
};

const PAGE_SIZE = 8;

const PaymentRow = memo(({ payment, index, getProviderConfig, formatDate, formatRF }: any) => {
  const config = getProviderConfig(payment.provider);
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group hover:bg-stone-50/80 transition-all duration-300"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-white group-hover:shadow-sm transition-all">
            <Calendar size={14} />
          </div>
          <span className="font-bold text-stone-900 text-xs">{formatDate(payment.date)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className="inline-flex px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-100 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
          FY {payment.year}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
          <span className="text-xs font-bold text-stone-700">{config.label}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs font-medium text-stone-500 whitespace-pre-wrap">{payment.note || "Cooperative Contribution"}</p>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-stone-900 tracking-tight">{formatRF(payment.amount)}</span>
          <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Completed</span>
        </div>
      </td>
    </motion.tr>
  );
});

export function PaymentTable({ payments, showExport, title = "Payment History" }: PaymentTableProps) {
  const [search, setSearch] = useState("");
  const [searchColumn, setSearchColumn] = useState<"all" | "note" | "year" | "amount" | "provider">("all");
  const [durationFilter, setDurationFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      // 1. Column-specific Search
      const query = search.toLowerCase();
      let matchesSearch = false;
      if (searchColumn === 'all') {
        matchesSearch = 
          (p.note || "").toLowerCase().includes(query) ||
          String(p.year).includes(query) ||
          String(p.amount).includes(query) ||
          (p.provider || "").toLowerCase().includes(query);
      } else if (searchColumn === 'amount') {
        matchesSearch = String(p.amount).includes(query);
      } else if (searchColumn === 'year') {
        matchesSearch = String(p.year).includes(query);
      } else {
        matchesSearch = (p[searchColumn as keyof Payment] || "").toLowerCase().includes(query);
      }

      if (!matchesSearch) return false;

      // 2. Duration Filter
      if (durationFilter === "all") return true;
      
      const paymentDate = new Date(p.date).getTime();
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (durationFilter === "today") {
        return new Date(p.date).toDateString() === new Date().toDateString();
      } else if (durationFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        return paymentDate >= weekAgo;
      } else if (durationFilter === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
        return paymentDate >= monthAgo;
      } else if (durationFilter === "custom") {
        if (startDate && paymentDate < new Date(startDate).getTime()) return false;
        if (endDate && paymentDate > new Date(endDate).getTime() + 86400000) return false;
      }

      return true;
    });
  }, [payments, search, searchColumn, durationFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const csv = Papa.unparse(filtered.map((p) => ({
      Date: formatDate(p.date), 
      Year: p.year,
      Amount_RF: p.amount, 
      Provider: p.provider || "MoMo",
      Note: p.note || "",
    })));
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `campuslink_statements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-stone-50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg text-stone-900 font-black tracking-tight">{title}</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{filtered.length} Records Found</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-stone-50 rounded-xl border border-stone-100 p-1">
              <select 
                value={searchColumn}
                onChange={(e: any) => setSearchColumn(e.target.value)}
                className="bg-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border-none focus:ring-0 cursor-pointer text-stone-500"
              >
                <option value="all">All Columns</option>
                <option value="note">Note/Reason</option>
                <option value="year">Payment Year</option>
                <option value="amount">Amount</option>
                <option value="provider">Provider</option>
              </select>
              <div className="w-px h-6 bg-stone-200 mx-1" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Type to filter..."
                  className="pl-9 pr-4 py-2 bg-transparent text-xs font-bold text-stone-900 focus:outline-none w-40"
                />
              </div>
            </div>

            <div className="flex items-center bg-stone-50 rounded-xl border border-stone-100 p-1">
              <Clock className="ml-2 text-stone-400" size={14} />
              <select 
                value={durationFilter}
                onChange={(e: any) => { setDurationFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest px-3 py-2 border-none focus:ring-0 cursor-pointer text-stone-500"
              >
                <option value="all">Duration: All</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {showExport && (
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {durationFilter === 'custom' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-3 pt-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-xl border border-stone-100">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">From:</span>
                <input 
                  type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="bg-transparent text-[10px] font-bold text-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-xl border border-stone-100">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">To:</span>
                <input 
                  type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="bg-transparent text-[10px] font-bold text-stone-900 focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100">Transaction Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 text-center">Reference Year</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100">Payment Provider</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100">Description</th>
              <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    <Info size={32} strokeWidth={1.5} />
                    <p className="text-sm font-medium">No matching transactions found</p>
                    <button 
                      onClick={() => { setSearch(""); setDurationFilter("all"); }}
                      className="text-xs font-black text-amber-600 uppercase tracking-widest mt-2 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => (
                <PaymentRow 
                  key={p.id} 
                  payment={p} 
                  index={i} 
                  getProviderConfig={getProviderConfig}
                  formatDate={formatDate}
                  formatRF={formatRF}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-stone-50/50 border-t border-stone-50 flex items-center justify-between">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-stone-900 disabled:opacity-30 transition-all shadow-sm active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                page === i + 1 ? 'bg-stone-900 text-white shadow-lg' : 'bg-white text-stone-400 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-stone-900 disabled:opacity-30 transition-all shadow-sm active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

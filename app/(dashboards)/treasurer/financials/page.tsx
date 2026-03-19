"use client";
import { useState, useEffect } from "react";
import { 
    getAllUsers, 
    getAllApprovedEmergencyRequests, 
    disburseEmergencyRequest,
    getAllDisbursedEmergencyRequests 
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    DollarSign, TrendingUp, FileText, PieChart,
    ArrowUpRight, Download, Calendar, Loader2,
    Briefcase, Landmark, Calculator, Users,
    Shield, ArrowRight, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
    LayoutDashboard, Database, Activity, Filter, Printer
} from "lucide-react";
import { formatRF } from "@/lib/utils/format";
import type { CampusUser, EmergencyRequest } from "@/lib/types";
import Papa from "papaparse";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/dashboard/StatCard";

type TabType = "statements" | "ledger" | "emergency" | "audit";
const LEDGER_PAGE_SIZE = 10;

export default function FinancialReports() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("statements");
    const [members, setMembers] = useState<CampusUser[]>([]);
    const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
    const [disbursedRequests, setDisbursedRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [disbursingId, setDisbursingId] = useState<string | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [ledgerPage, setLedgerPage] = useState(1);

    const fetchData = async () => {
        try {
            const [u, r, d] = await Promise.all([
                getAllUsers(),
                getAllApprovedEmergencyRequests(),
                getAllDisbursedEmergencyRequests()
            ]);
            setMembers(u);
            setApprovedRequests(r);
            setDisbursedRequests(d);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to sync financial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Accounting Logic
    const totalSavings = members.reduce((s, m) => s + (m.paidSoFar || 0), 0);
    const totalEmergencyDisbursed = members.reduce((s, m) => s + (m.emergencyTaken || 0), 0);
    const totalInterestIncome = members.reduce((s, m) => s + (m.interestOwed || 0), 0);
    const pendingDisbursement = approvedRequests.reduce((s, r) => s + r.amount, 0);

    // Balance Sheet Logic
    const cashOnHand = totalSavings - totalEmergencyDisbursed;
    const loansReceivable = totalEmergencyDisbursed + totalInterestIncome;
    const totalAssets = cashOnHand + loansReceivable;

    const memberEquity = totalSavings;
    const retainedEarnings = totalInterestIncome;
    const totalEquity = memberEquity + retainedEarnings;

    const handleRelease = async (req: any) => {
        if (!profile) return;
        setDisbursingId(req.id);
        try {
            await disburseEmergencyRequest(req.userId, req.id, profile.uid);
            toast.success(`Funds released to ${req.userDoc?.fullName} ✅`);
            fetchData();
        } catch (error) {
            console.error("Release error:", error);
            toast.error("Failed to disburse funds");
        } finally {
            setDisbursingId(null);
        }
    };

    const handleExportAuditExcel = async () => {
        const wb = new ExcelJS.Workbook();
        wb.creator = "CampusLink Treasury";
        wb.created = new Date();

        const ws = wb.addWorksheet("Disbursement Audit");
        ws.columns = [
            { key: "name",     width: 30 },
            { key: "amount",   width: 24 },
            { key: "interest", width: 24 },
            { key: "date",     width: 22 },
            { key: "status",   width: 16 },
        ];

        // Title row
        ws.mergeCells("A1:E1");
        const titleCell = ws.getCell("A1");
        titleCell.value = "CAMPUSLINK — EMERGENCY DISBURSEMENT AUDIT";
        titleCell.font  = { name: "Calibri", bold: true, size: 15, color: { argb: "FFFFFFFF" } };
        titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(1).height = 30;

        // Subtitle row
        ws.mergeCells("A2:E2");
        const subCell = ws.getCell("A2");
        subCell.value = `Official Record of Released Capital  ·  Generated on ${new Date().toLocaleDateString()}`;
        subCell.font  = { name: "Calibri", italic: true, size: 10, color: { argb: "FF888888" } };
        subCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E7" } };
        subCell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(2).height = 18;

        // Header row
        const hdrRow = ws.addRow(["Recipient Member", "Principal Release", "Interest Applied", "Disbursement Date", "Status"]);
        hdrRow.height = 22;
        hdrRow.eachCell((cell) => {
            cell.value = cell.value?.toString().toUpperCase();
            cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4AF37" } };
            cell.font  = { name: "Calibri", bold: true, size: 13, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = { bottom: { style: "thin", color: { argb: "FFCC9900" } } };
        });
        ws.autoFilter = { from: "A3", to: "E3" };

        // Data rows
        disbursedRequests.forEach(r => {
            const row = ws.addRow([
                r.userDoc?.fullName ?? "—",
                r.amount,
                r.interestAmount,
                new Date(r.requestedAt).toLocaleDateString(),
                "Disbursed",
            ]);
            row.height = 18;
            row.eachCell((cell, col) => {
                cell.font = { name: "Calibri", size: 11, color: { argb: "FF333333" } };
                cell.alignment = { horizontal: [2, 3].includes(col) ? "right" : "left", vertical: "middle" };
                if (col === 2 || col === 3) cell.numFmt = '#,##0 "RWF"';
                if (col === 5) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
                    cell.font = { name: "Calibri", size: 11, color: { argb: "FF2E7D32" }, bold: true };
                }
            });
        });

        // Empty row before totals
        ws.addRow([]);

        // Totals row
        const totalPrincipal = disbursedRequests.reduce((a, b) => a + b.amount, 0);
        const totalInterest  = disbursedRequests.reduce((a, b) => a + b.interestAmount, 0);
        const totalRow = ws.addRow(["AUDIT TOTALS", totalPrincipal, totalInterest, "", ""]);
        totalRow.height = 22;
        totalRow.eachCell((cell, col) => {
            cell.font = { name: "Calibri", bold: true, size: 12, color: { argb: "FF000000" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
            cell.alignment = { horizontal: [2, 3].includes(col) ? "right" : "left", vertical: "middle" };
            if (col === 2 || col === 3) cell.numFmt = '#,##0 "RWF"';
        });

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `CampusLink_Disbursement_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Premium audit report exported! 🏦");
    };

    const handlePrintAudit = () => {
        window.print();
    };

    const exportReport = async () => {
        const wb = new ExcelJS.Workbook();
        wb.creator = "CampusLink Treasury";
        wb.created = new Date();

        // ─── Income Statement Sheet ───────────────────────────────────────────
        const is = wb.addWorksheet("Income Statement");
        is.columns = [
            { key: "section",  width: 26 },
            { key: "item",     width: 38 },
            { key: "amount",   width: 24 },
            { key: "note",     width: 32 },
        ];

        // Title row
        is.mergeCells("A1:D1");
        const titleCell = is.getCell("A1");
        titleCell.value = "CAMPUSLINK — INCOME STATEMENT";
        titleCell.font  = { name: "Calibri", bold: true, size: 15, color: { argb: "FFFFFFFF" } };
        titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        is.getRow(1).height = 30;

        // Subtitle row
        is.mergeCells("A2:D2");
        const subCell = is.getCell("A2");
        subCell.value = `Fiscal Year ${year}  ·  Generated on ${new Date().toLocaleDateString()}`;
        subCell.font  = { name: "Calibri", italic: true, size: 10, color: { argb: "FF888888" } };
        subCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E7" } };
        subCell.alignment = { horizontal: "center", vertical: "middle" };
        is.getRow(2).height = 18;

        // Header row
        const isHeaders = ["Section", "Line Item", "Amount (RWF)", "Notes"];
        const headerRow = is.addRow(isHeaders);
        headerRow.height = 22;
        headerRow.eachCell((cell) => {
            cell.value = cell.value?.toString().toUpperCase();
            cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4AF37" } };
            cell.font  = { name: "Calibri", bold: true, size: 13, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = { bottom: { style: "thin", color: { argb: "FFCC9900" } } };
        });
        is.autoFilter = { from: "A3", to: "D3" };

        const addISRow = (section: string, item: string, amount: number, note = "", bold = false, bgArgb?: string) => {
            const row = is.addRow([section, item, amount, note]);
            row.height = 18;
            row.eachCell((cell, col) => {
                cell.font = { name: "Calibri", bold, size: 11, color: { argb: bold ? "FF000000" : "FF333333" } };
                cell.alignment = { horizontal: col === 3 ? "right" : "left", vertical: "middle" };
                if (bgArgb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
                if (col === 3) cell.numFmt = '#,##0 "RWF"';
            });
        };

        addISRow("Revenue", "Total Member Savings",      totalSavings,                       "Cumulative contributions");
        addISRow("Revenue", "Interest Income (Loans)",   totalInterestIncome,                "Applied on emergency loans", false, "FFFDFFE0");
        is.addRow([]);
        addISRow("TOTAL",   "TOTAL GROSS REVENUE",       totalSavings + totalInterestIncome, "", true, "FFFFF3CD");

        // ─── Balance Sheet Sheet ──────────────────────────────────────────────
        const bs = wb.addWorksheet("Balance Sheet");
        bs.columns = [
            { key: "side",    width: 20 },
            { key: "item",    width: 36 },
            { key: "amount",  width: 24 },
            { key: "note",    width: 32 },
        ];

        bs.mergeCells("A1:D1");
        const bsTitle = bs.getCell("A1");
        bsTitle.value = "CAMPUSLINK — BALANCE SHEET";
        bsTitle.font  = { name: "Calibri", bold: true, size: 15, color: { argb: "FFFFFFFF" } };
        bsTitle.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
        bsTitle.alignment = { horizontal: "center", vertical: "middle" };
        bs.getRow(1).height = 30;

        bs.mergeCells("A2:D2");
        const bsSub = bs.getCell("A2");
        bsSub.value = `As of ${new Date().toLocaleDateString()}`;
        bsSub.font  = { name: "Calibri", italic: true, size: 10, color: { argb: "FF888888" } };
        bsSub.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF8FF" } };
        bsSub.alignment = { horizontal: "center", vertical: "middle" };
        bs.getRow(2).height = 18;

        const bsHdrRow = bs.addRow(["Side", "Line Item", "Amount (RWF)", "Notes"]);
        bsHdrRow.height = 22;
        bsHdrRow.eachCell((cell) => {
            cell.value = cell.value?.toString().toUpperCase();
            cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4AF37" } };
            cell.font  = { name: "Calibri", bold: true, size: 13, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = { bottom: { style: "thin", color: { argb: "FFCC9900" } } };
        });
        bs.autoFilter = { from: "A3", to: "D3" };

        const addBSRow = (side: string, item: string, amount: number, note = "", bold = false, bgArgb?: string) => {
            const row = bs.addRow([side, item, amount, note]);
            row.height = 18;
            row.eachCell((cell, col) => {
                cell.font = { name: "Calibri", bold, size: 11, color: { argb: bold ? "FF000000" : "FF333333" } };
                cell.alignment = { horizontal: col === 3 ? "right" : "left", vertical: "middle" };
                if (bgArgb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
                if (col === 3) cell.numFmt = '#,##0 "RWF"';
            });
        };

        addBSRow("Assets",   "Cash on Hand",       cashOnHand,       "Liquid reserves");
        addBSRow("Assets",   "Loans Receivable",   loansReceivable,  "Outstanding emergency loans");
        bs.addRow([]);
        addBSRow("TOTAL",    "TOTAL ASSETS",       totalAssets,      "", true, "FFFFF3CD");
        bs.addRow([]);
        addBSRow("Equity",   "Member Equity",      memberEquity,     "Total member savings");
        addBSRow("Equity",   "Retained Earnings",  retainedEarnings, "Accumulated interest income");
        bs.addRow([]);
        addBSRow("TOTAL",    "TOTAL EQUITY",       totalEquity,      "", true, "FFFFF3CD");

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `CampusLink_Financial_Report_${year}.xlsx`);
        toast.success("Premium financial report exported! 🏦");
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen -mt-20">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-amber-500" size={40} />
                <p className="text-xs text-stone-400 font-black uppercase tracking-widest animate-pulse">Syncing Vault...</p>
            </div>
        </div>
    );

    return (
        <div className="pt-2 lg:pt-3 px-4 lg:px-6 pb-20 max-w-[1500px] mx-auto space-y-8">
            {/* Header Redesign */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="tracking-tight text-3xl font-black text-stone-900 leading-none">
                        Financial <span className="text-amber-500">Hub</span>
                    </h1>
                    <p className="text-stone-500 font-medium text-xs mt-2 max-w-xl">
                        Official institutional accounting, money distribution, and capital release gateway.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
                        {[
                            { id: "statements", icon: LayoutDashboard, label: "Statements" },
                            { id: "ledger", icon: Database, label: "Member Ledger" },
                            { id: "emergency", icon: Activity, label: `Emergency Queue` },
                            { id: "audit", icon: Shield, label: `Disbursement Audit` }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as TabType)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    activeTab === t.id 
                                        ? "bg-white text-amber-600 shadow-sm border border-stone-200" 
                                        : "text-stone-400 hover:text-stone-600"
                                )}
                            >
                                <t.icon size={14} className={activeTab === t.id ? "text-amber-500" : ""} />
                                {t.label}
                                {t.id === 'emergency' && approvedRequests.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] ml-1 shadow-sm">
                                        {approvedRequests.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Summaries — Official StatCards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Capital"    value={formatRF(totalSavings)}          icon={DollarSign}  color="gold"   delay={0} />
                <StatCard title="Cash On Hand"     value={formatRF(cashOnHand)}            icon={Landmark}    color="green"  delay={0.05} />
                <StatCard title="System Reserves"  value={formatRF(totalSavings * 0.15)}  icon={Shield}      color="blue"   delay={0.1} />
                <StatCard title="Release Pending"  value={formatRF(pendingDisbursement)}  icon={AlertCircle} color="red"    delay={0.15} />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "statements" && (
                    <motion.div 
                        key="statements"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Income Statement */}
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-stone-50 flex items-center justify-between bg-amber-50/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-stone-900 tracking-tight uppercase">Income Statement</h2>
                                            <p className="text-[10px] text-stone-400 font-bold">Revenue & Earnings Overview</p>
                                        </div>
                                    </div>
                                    <button onClick={exportReport} className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-amber-500 hover:border-amber-500 transition-all shadow-sm">
                                        <Download size={16} />
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <FinancialRow label="Total Member Savings" value={formatRF(totalSavings)} />
                                    <FinancialRow label="Interest Income (Loans)" value={formatRF(totalInterestIncome)} highlight="green" />
                                    <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                                        <span className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em]">Total Gross Revenue</span>
                                        <span className="text-2xl font-black text-stone-900 tracking-tighter">{formatRF(totalSavings + totalInterestIncome)}</span>
                                    </div>
                                    <p className="text-[9px] text-stone-300 font-medium italic mt-8 text-center pt-10 uppercase tracking-widest">
                                        * Certified by Institutional Smart Ledger Protocol
                                    </p>
                                </div>
                            </div>

                            {/* Balance Sheet */}
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden text-[12px]">
                                <div className="p-8 border-b border-stone-50 flex items-center justify-between bg-blue-50/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                            <Landmark size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-stone-900 tracking-tight uppercase">Balance Sheet</h2>
                                            <p className="text-[10px] text-stone-400 font-bold">Asset and Equity distribution</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 grid md:grid-cols-2 gap-10">
                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50 pb-2">Assets</h3>
                                        <FinancialRowSmall label="Cash on Hand" value={formatRF(cashOnHand)} />
                                        <FinancialRowSmall label="Loans Receivable" value={formatRF(loansReceivable)} />
                                        <div className="pt-2 border-t border-stone-50 flex justify-between font-black text-sm text-stone-900">
                                            <span>Total Assets</span>
                                            <span>{formatRF(totalAssets)}</span>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50 pb-2">Equity</h3>
                                        <FinancialRowSmall label="Shareholder Capital" value={formatRF(memberEquity)} />
                                        <FinancialRowSmall label="Retained Earnings" value={formatRF(retainedEarnings)} />
                                        <div className="pt-2 border-t border-stone-50 flex justify-between font-black text-sm text-stone-900 uppercase">
                                            <span>Total Equity</span>
                                            <span>{formatRF(totalEquity)}</span>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Ratios Mini Hub */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <RatioCard label="Liquidity Coverage" value={`${Math.round((cashOnHand / totalAssets) * 100)}%`} icon={PieChart} color="blue" />
                            <RatioCard label="Capital Utilization" value={`${Math.round((totalEmergencyDisbursed / totalSavings) * 100)}%`} icon={Briefcase} color="amber" />
                            <RatioCard label="System Solvency" value="100%" icon={Calculator} color="emerald" />
                        </div>
                    </motion.div>
                )}

                {activeTab === "ledger" && (
                    <motion.div 
                        key="ledger"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/30">
                            <div>
                                <h2 className="text-sm font-black text-stone-900 tracking-tight uppercase">Member Capital Ledger</h2>
                                <p className="text-[10px] text-stone-400 font-bold mt-0.5">Live distribution of money per user</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-stone-900 transition-all shadow-sm">
                                    <Filter size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-stone-50/50">
                                        {["Member", "Portfolio Target", "Paid to Date", "Outstanding", "Liquidity Used", "Status"].map(h => (
                                            <th key={h} className="text-left px-4 py-4 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {members.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE).map((m) => (
                                        <tr key={m.uid} className="hover:bg-stone-50/50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-black text-[10px] group-hover:bg-amber-500 transition-colors">
                                                        {m.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-stone-900 tracking-tight">{m.fullName}</p>
                                                        <p className="text-[9px] text-stone-400 font-medium tracking-tight">ID: {m.uid.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-[10px] font-bold text-stone-600">{formatRF(m.totalShareValue)}</td>
                                            <td className="px-4 py-4 text-[10px] font-black text-amber-600">{formatRF(m.paidSoFar)}</td>
                                            <td className="px-4 py-4 text-[10px] font-bold text-stone-400">{formatRF(Math.max(0, m.totalShareValue - m.paidSoFar))}</td>
                                            <td className="px-4 py-4 text-[10px] font-black text-stone-900">{formatRF(m.emergencyTaken)}</td>
                                            <td className="px-4 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                    m.paidSoFar >= m.totalShareValue 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                        : "bg-blue-50 text-blue-600 border-blue-100"
                                                )}>
                                                    {m.paidSoFar >= m.totalShareValue ? "Fulfilled" : "Active"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Ledger Pagination heart */}
                        <div className="p-4 bg-stone-50/50 border-t border-stone-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">
                                Page {ledgerPage} of {Math.ceil(members.length / LEDGER_PAGE_SIZE)}
                            </p>
                            <div className="flex items-center gap-1">
                                <button 
                                    disabled={ledgerPage === 1} 
                                    onClick={() => setLedgerPage(p => p - 1)}
                                    className="p-2 rounded-xl bg-stone-100 text-stone-400 disabled:opacity-30"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    disabled={ledgerPage === Math.ceil(members.length / LEDGER_PAGE_SIZE)} 
                                    onClick={() => setLedgerPage(p => p + 1)}
                                    className="p-2 rounded-xl bg-stone-100 text-stone-400 disabled:opacity-30"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "emergency" && (
                    <motion.div 
                        key="emergency"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {approvedRequests.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-20 text-center">
                                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-100">
                                    <CheckCircle size={32} className="text-stone-200" />
                                </div>
                                <h3 className="text-xl font-black text-stone-900 tracking-tight">Queue Depleted</h3>
                                <p className="text-stone-400 text-sm font-medium mt-1">No authorized funds awaiting release.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {approvedRequests.map((req) => (
                                    <motion.div
                                        key={req.id}
                                        layout
                                        className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden group hover:border-amber-500/30 transition-all p-8 flex flex-col gap-8"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-stone-950 flex items-center justify-center text-white font-black text-2xl shadow-2xl group-hover:bg-amber-500 transition-colors duration-500">
                                                    {req.userDoc?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-stone-900 text-xl tracking-tight leading-none">{req.userDoc?.fullName}</h3>
                                                    <p className="text-stone-400 font-bold text-xs mt-1 italic uppercase tracking-widest opacity-60">Status: President Authorized</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Approved At</p>
                                                <div className="flex items-center gap-1.5 justify-end text-stone-400">
                                                    <Calendar size={12} />
                                                    <span className="text-xs font-bold">{new Date(req.requestedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Principal Amount</p>
                                                <p className="text-xl font-black text-stone-900 tracking-tighter">{formatRF(req.amount)}</p>
                                            </div>
                                            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Interest Impact</p>
                                                <p className="text-xl font-black text-amber-600 tracking-tighter">+{formatRF(req.interestAmount)}</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleRelease(req)}
                                            disabled={disbursingId === req.id}
                                            className="w-full py-5 bg-stone-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-xl shadow-stone-900/10 disabled:opacity-50"
                                        >
                                            {disbursingId === req.id ? (
                                                <Loader2 size={18} className="animate-spin text-white" />
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} />
                                                    Officialize Fund Release
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "audit" && (
                    <motion.div
                        key="audit"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl overflow-hidden mt-4"
                    >
                        <div className="p-8 border-b border-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/30 print:hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-stone-900 tracking-tight uppercase leading-none">Emergency Distribution Audit</h2>
                                    <p className="text-[10px] text-stone-400 font-bold mt-1 uppercase tracking-widest">Official Record of released capital</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePrintAudit} className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                                    <Printer size={14} /> Print Audit
                                </button>
                                <button onClick={handleExportAuditExcel} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-200 transition-all">
                                    <Download size={14} /> Export Excel
                                </button>
                            </div>
                        </div>

                        {/* Print Header heart */}
                        <div className="hidden print:block p-10 border-b-4 border-stone-900 mb-8">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-5">
                                    <img src="/assets/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
                                    <div>
                                        <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">COMPASLINK TREASURY</h1>
                                        <p className="text-sm text-amber-600 font-black tracking-widest uppercase">EMERGENCY CAPITAL AUDIT REPORT</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-stone-900 uppercase">Audit Date</p>
                                    <p className="text-lg font-black text-stone-900 leading-none">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-stone-50/60 border-b border-stone-100">
                                        {["Recipient Member", "Principal Release", "Interest Applied", "Disbursement Date", "Status"].map((h) => (
                                            <th key={h} className="px-8 py-4 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {disbursedRequests.map((r) => (
                                        <tr key={r.id} className="hover:bg-amber-50/20 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-black text-[10px] print:hidden">
                                                        {r.userDoc?.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-stone-900 uppercase">{r.userDoc?.fullName}</p>
                                                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Member ID: {r.userId.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-[11px] font-black text-stone-900">{formatRF(r.amount)}</td>
                                            <td className="px-8 py-4 text-[11px] font-black text-amber-600">+{formatRF(r.interestAmount)}</td>
                                            <td className="px-8 py-4 text-[11px] font-bold text-stone-500">{new Date(r.requestedAt).toLocaleDateString()}</td>
                                            <td className="px-8 py-4">
                                                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[8px] font-black uppercase tracking-widest">Disbursed</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {disbursedRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest">No Disbursement History Found</td>
                                        </tr>
                                    )}
                                </tbody>
                                {disbursedRequests.length > 0 && (
                                    <tfoot className="bg-stone-50/50 border-t border-stone-100">
                                        <tr>
                                            <td className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Audit Totals</td>
                                            <td className="px-8 py-5 text-sm font-black text-stone-900">{formatRF(disbursedRequests.reduce((a, b) => a + b.amount, 0))}</td>
                                            <td className="px-8 py-5 text-sm font-black text-amber-600">{formatRF(disbursedRequests.reduce((a, b) => a + b.interestAmount, 0))}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Print Signatures heart */}
                        <div className="hidden print:grid grid-cols-2 gap-20 p-12 mt-10 border-t-2 border-stone-100">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Verified by (Treasurer)</p>
                                <p className="text-sm font-black text-stone-900 leading-none">{profile?.fullName}</p>
                                <div className="mt-8 w-40 h-px bg-stone-300" />
                                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-2">Signature & Seal</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Authorized for Release</p>
                                <p className="text-sm font-black text-stone-900 leading-none">Institutional Command</p>
                                <div className="mt-8 w-40 h-px bg-stone-300" />
                                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-2">Executive Authentication</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SummaryMiniCard({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        amber: "text-amber-500 bg-amber-50 border-amber-100",
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        blue: "text-blue-500 bg-blue-50 border-blue-100",
        red: "text-red-500 bg-red-50 border-red-100"
    };

    return (
        <div className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-4 group hover:shadow-lg transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", colors[color])}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-stone-900 tracking-tighter leading-tight">{value}</p>
            </div>
        </div>
    );
}

function FinancialRow({ label, value, highlight }: any) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-stone-500 text-sm font-medium transition-colors group-hover:text-stone-900">{label}</span>
            <span className={cn(
                "font-black tracking-tight",
                highlight === 'green' ? "text-emerald-600" : "text-stone-800"
            )}>{value}</span>
        </div>
    );
}

function FinancialRowSmall({ label, value }: any) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-stone-600 font-medium group-hover:text-stone-900 transition-colors">{label}</span>
            <span className="font-bold text-stone-800 tracking-tight">{value}</span>
        </div>
    );
}

function RatioCard({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-500 shadow-blue-200",
        amber: "bg-amber-500 shadow-amber-200",
        emerald: "bg-emerald-500 shadow-emerald-200"
    };
    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex items-center gap-5 hover:shadow-xl transition-all group">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:rotate-3", colors[color])}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-stone-900 tracking-tighter">{value}</p>
            </div>
        </div>
    );
}

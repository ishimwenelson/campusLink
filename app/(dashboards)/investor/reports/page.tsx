"use client";
import { useState, useEffect, useMemo } from "react";
import { getProposals } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    FileText, Download, Printer, Filter,
    CheckCircle, AlertCircle, Vote,
    Loader2, Search, XCircle, Clock
} from "lucide-react";
import { toast } from "sonner";
import { Proposal } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type FilterTab = "all" | "my_proposals" | "approved" | "active" | "rejected";

export default function InvestorReports() {
    const { profile, loading } = useAuth();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (profile?.role === 'investor' || profile?.role === 'president' || profile?.role === 'boardMember') {
            getProposals().then(p => {
                setProposals(p);
                setLoadingData(false);
            });
        } else if (profile) {
             setLoadingData(false);
        }
    }, [profile]);

    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
             // 1. Filter out under_review unless it's the author looking at their own
            if (p.status === "under_review" && p.proposedBy !== profile?.uid) return false;

            // 2. Tab Filter
            if (activeTab === "my_proposals" && p.proposedBy !== profile?.uid) return false;
            if (activeTab === "approved" && p.status !== "approved") return false;
            if (activeTab === "active" && p.status !== "active" && p.status !== "pending") return false;
            if (activeTab === "rejected" && p.status !== "rejected") return false;

            // 3. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.proposedByName.toLowerCase().includes(query);
            }

            return true;
        });
    }, [proposals, activeTab, searchQuery, profile?.uid]);

    // Analytics for the Pie Chart based on ENTIRE dataset (to show the big picture)
    const chartData = useMemo(() => {
        const approved = proposals.filter(p => p.status === 'approved').length;
        const active = proposals.filter(p => p.status === 'active' || p.status === 'pending').length;
        const rejected = proposals.filter(p => p.status === 'rejected').length;
        const review = proposals.filter(p => p.status === 'under_review').length;

        return [
            { name: "Approved", value: approved, color: "#16a34a" },
            { name: "Active", value: active, color: "#0284c7" },
            { name: "Rejected", value: rejected, color: "#dc2626" },
            { name: "In Review", value: review, color: "#d97706" },
        ].filter(d => d.value > 0);
    }, [proposals]);

    const chartConfig = {
        value: { label: "Proposals", color: "#f59e0b" }
    };

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Proposal Report');

        // Define column widths explicitly (no header definition here to avoid automatic row 1)
        worksheet.columns = [
            { key: 'title', width: 40 },
            { key: 'description', width: 50 },
            { key: 'proposedByName', width: 25 },
            { key: 'proposedAt', width: 15 },
            { key: 'category', width: 15 },
            { key: 'requiredPercentage', width: 18 },
            { key: 'yesVotes', width: 12 },
            { key: 'noVotes', width: 12 },
            { key: 'status', width: 15 },
        ];

        // Title row
        worksheet.mergeCells("A1:I1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "CAMPUSLINK — INVESTOR PROPOSAL REPORT";
        titleCell.font  = { name: "Calibri", bold: true, size: 15, color: { argb: "FFFFFFFF" } };
        titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // Subtitle row
        worksheet.mergeCells("A2:I2");
        const subCell = worksheet.getCell("A2");
        subCell.value = `Official Record of Proposals  ·  Filter: ${activeTab.replace('_', ' ').toUpperCase()}  ·  Generated on ${new Date().toLocaleDateString()}`;
        subCell.font  = { name: "Calibri", italic: true, size: 10, color: { argb: "FF888888" } };
        subCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E7" } };
        subCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(2).height = 18;

        // Header row
        const headers = [
            'PROPOSAL TITLE', 'DESCRIPTION', 'PROPOSED BY', 'DATE SUBMITTED', 
            'CATEGORY', 'TARGET QUORUM %', 'YES VOTES', 'NO VOTES', 'STATUS'
        ];
        const hdrRow = worksheet.addRow(headers);
        hdrRow.height = 22;
        hdrRow.eachCell((cell) => {
            cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4AF37" } };
            cell.font  = { name: "Calibri", bold: true, size: 13, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = { bottom: { style: "thin", color: { argb: "FFCC9900" } } };
        });
        
        // Auto Filter
        worksheet.autoFilter = { from: "A3", to: "I3" };

        // Data rows
        filteredProposals.forEach(p => {
            const row = worksheet.addRow([
                p.title || "—",
                (p.description || "").substring(0, 100) + ((p.description || "").length > 100 ? "..." : ""),
                p.proposedByName || "—",
                new Date(p.proposedAt).toLocaleDateString(),
                (p.category || "General").toUpperCase(),
                (p.requiredPercentage || 0) + "%",
                p.votes?.yes || 0,
                p.votes?.no || 0,
                (p.status || "active").toUpperCase()
            ]);
            row.height = 18;
            row.eachCell((cell, col) => {
                cell.font = { name: "Calibri", size: 11, color: { argb: "FF333333" } };
                cell.alignment = { horizontal: [6, 7, 8].includes(col) ? "center" : "left", vertical: "middle" };
                
                // Status Color coding
                if (col === 9) {
                     if (p.status === 'approved') {
                         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
                         cell.font = { name: "Calibri", size: 11, color: { argb: "FF2E7D32" }, bold: true };
                     } else if (p.status === 'rejected') {
                         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } };
                         cell.font = { name: "Calibri", size: 11, color: { argb: "FFC62828" }, bold: true };
                     } else if (p.status === 'under_review') {
                         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3E0" } };
                         cell.font = { name: "Calibri", size: 11, color: { argb: "FFE65100" }, bold: true };
                     } else {
                         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } };
                         cell.font = { name: "Calibri", size: 11, color: { argb: "FF1565C0" }, bold: true };
                     }
                }
            });
        });

        // Auto-Size Columns (Safe implementation for only specific columns)
        [3, 4, 5, 6, 7, 8, 9].forEach(colIndex => {
            const column = worksheet.getColumn(colIndex);
            let maxColumnLength = 0;
            // Use optional chaining safely just in case
            if (column && column.eachCell) {
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    if (rowNumber > 2) { // Skip title and subtitle row
                        const columnLength = cell.value ? cell.value.toString().length : 10;
                        if (columnLength > maxColumnLength) {
                            maxColumnLength = columnLength;
                        }
                    }
                });
                column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2;
            }
        });

        // Generate and save
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `COMPASLINK_Proposals_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast.success("Proposal report exported successfully!");
    };

    if (loading || loadingData) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="text-xs font-black text-stone-400 tracking-widest uppercase animate-pulse">Loading Reports...</p>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 print:p-0">
            {/* Header - Hidden on Print */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden"
            >
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
                        Project <span className="text-amber-500">Reports</span>
                    </h1>
                    <p className="text-stone-500 text-sm mt-1 font-medium">Generate and export proposal data and governance metrics</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                        <Printer size={14} /> Print Report
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-200 transition-colors"
                    >
                        <Download size={14} /> Export Excel
                    </button>
                </div>
            </motion.div>

            {/* Print Header - Visible only on Print */}
            <div className="hidden print:block p-8 border-b-4 border-stone-900 mb-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <img src="/assets/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">COMPASLINK INVESTMENT A</h1>
                            <p className="text-sm text-amber-600 font-black tracking-widest uppercase">OFFICIAL PROJECT REPORT</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-stone-900 uppercase">Generated on</p>
                        <p className="text-lg font-black text-stone-900 leading-none">{new Date().toLocaleDateString()}</p>
                        <div className="mt-2 space-y-0.5">
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Filter: {activeTab.replace('_', ' ')}</p>
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Investigator: {profile?.fullName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 grid grid-cols-2 gap-4 print:hidden">
                    <StatCard title="Total Proposals" value={proposals.length.toString()} icon={FileText} color="gold" delay={0} />
                    <StatCard title="Approved Projects" value={proposals.filter(p => p.status === 'approved').length.toString()} icon={CheckCircle} color="green" delay={0.1} />
                    <StatCard title="Active Campaigns" value={proposals.filter(p => p.status === 'active' || p.status === 'pending').length.toString()} icon={Vote} color="blue" delay={0.2} />
                    <StatCard title="Rejected Concept" value={proposals.filter(p => p.status === 'rejected').length.toString()} icon={XCircle} color="red" delay={0.3} />
                </div>
                
                <div className="bg-white rounded-[2.5rem] border border-stone-100 p-6 flex flex-col items-center justify-center shadow-lg relative print:col-span-1 print:border-none print:shadow-none print:p-0">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4 self-start absolute top-6 left-6">Global Distribution</h3>
                    {chartData.length > 0 ? (
                        <div className="w-full h-[200px] mt-6">
                            <ChartContainer config={chartConfig} className="w-full h-full pb-4">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">{d.name} ({d.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-stone-400">
                            <Filter size={32} className="opacity-20 mb-2" />
                            <p className="text-xs font-medium">No Data Available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters & Table */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none"
            >
                {/* Table Controls - Hidden on Print */}
                <div className="p-6 border-b border-stone-50 flex flex-col gap-4 print:hidden">
                    <div className="flex flex-wrap items-center gap-2 w-full">
                        {/* Tabs */}
                        <div className="flex bg-stone-100 p-1 rounded-2xl overflow-x-auto w-full md:w-auto hide-scrollbar">
                            {[
                                { id: "all", label: "All Proposals" },
                                { id: "my_proposals", label: "Proposed by Me" },
                                { id: "active", label: "Active" },
                                { id: "approved", label: "Approved" },
                                { id: "rejected", label: "Rejected" },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as FilterTab)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                        activeTab === tab.id
                                            ? "bg-white text-amber-600 shadow-md"
                                            : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative ml-auto w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                            <input
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full bg-stone-50 rounded-xl border border-stone-200 pl-9 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50/60 print:bg-stone-100 border-b border-stone-200">
                                {["Project Title", "Category", "Votes", "Status", "Date"].map((h, i) => (
                                    <th key={h} className={`px-5 py-4 text-[10px] font-black text-stone-500 uppercase tracking-[0.1em] ${i === 2 ? 'text-center' : ''} ${i >= 3 ? 'text-right' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 print:divide-stone-200">
                            {filteredProposals.map(p => {
                                const totalVotes = p.votes.yes + p.votes.no;
                                const yesPct = totalVotes > 0 ? (p.votes.yes / totalVotes) * 100 : 0;
                                
                                return (
                                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col max-w-xs md:max-w-md">
                                                <p className="text-sm font-black text-stone-900 leading-tight truncate">{p.title}</p>
                                                <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">By {p.proposedByName}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide bg-stone-100 text-stone-600 border border-stone-200">
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                    <span className="text-green-600">{p.votes.yes} Y</span>
                                                    <span className="text-stone-300">/</span>
                                                    <span className="text-red-500">{p.votes.no} N</span>
                                                </div>
                                                <div className="w-16 h-1 bg-stone-100 rounded-full mt-1.5 overflow-hidden flex">
                                                    <div style={{ width: `${yesPct}%` }} className="bg-green-500 h-full border-r border-white/20" />
                                                    <div style={{ width: `${100 - yesPct}%` }} className="bg-red-400 h-full" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border inline-flex items-center gap-1
                                                ${p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                  p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                                  p.status === 'under_review' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                  'bg-blue-50 text-blue-700 border-blue-200'}`}
                                            >
                                                {p.status === 'approved' && <CheckCircle size={10} />}
                                                {p.status === 'rejected' && <XCircle size={10} />}
                                                {(p.status === 'active' || p.status === 'pending') && <Vote size={10} />}
                                                {p.status === 'under_review' && <Clock size={10} />}
                                                {p.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-black text-stone-500 text-right">
                                            {new Date(p.proposedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProposals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                       <FileText size={32} className="mx-auto text-stone-200 mb-2 print:hidden" />
                                       <p className="text-xs text-stone-400 font-medium">No matching proposals found in this view.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {/* Table Footer - Totals */}
                        <tfoot className="bg-stone-50/80 print:bg-stone-100 border-t border-stone-200">
                            <tr>
                                <td colSpan={2} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-stone-600">Report Summary</td>
                                <td className="px-5 py-4 text-center text-xs font-black text-stone-900">
                                    {filteredProposals.reduce((sum, p) => sum + p.votes.yes + p.votes.no, 0)} Total Votes
                                </td>
                                <td colSpan={2} className="px-5 py-4 text-right text-xs font-black text-stone-900">
                                    {filteredProposals.length} Proposals
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Signatures & Footer - Visible only on Print */}
                <div className="hidden print:grid grid-cols-2 gap-20 p-12 mt-12">
                     {/* Print footprint matching Secretary Style */}
                    <div className="border-t-2 border-stone-300 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Generated by</p>
                        <p className="text-sm font-black text-stone-900 leading-tight">{profile?.fullName}</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">CampusLink {profile?.role}</p>
                        <div className="mt-12 w-48 h-px bg-stone-200" />
                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-2">Member Signature</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

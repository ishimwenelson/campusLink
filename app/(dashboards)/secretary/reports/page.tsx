"use client";
import { useState, useEffect, useMemo } from "react";
import { getAllUsers } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion } from "framer-motion";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    FileText, Download, Printer, Filter,
    Search, Users, CheckCircle, AlertCircle,
    TrendingUp, ChevronDown
} from "lucide-react";
import { formatRF } from "@/lib/utils/format";
import type { CampusUser } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";

export default function SecretaryReports() {
    const { profile, loading } = useAuth();
    const [members, setMembers] = useState<CampusUser[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending_docs" | "up_to_date">("all");
    const [search, setSearch] = useState("");
    const [searchColumn, setSearchColumn] = useState<"all"|"fullName"|"email"|"phone"|"nationalID">("all");
    const [durationFilter, setDurationFilter] = useState<"all"|"today"|"week"|"month"|"year"|"custom">("all");
    const [joinDateStart, setJoinDateStart] = useState("");
    const [joinDateEnd, setJoinDateEnd] = useState("");

    useEffect(() => {
        if (profile?.role === 'secretary') {
            getAllUsers().then(u => {
                setMembers(u);
                setLoadingData(false);
            });
        }
    }, [profile]);

    const filteredMembers = useMemo(() => members.filter(m => {
        const query = search.toLowerCase();
        let matchesSearch = false;
        if (searchColumn === 'all') {
            matchesSearch = m.fullName.toLowerCase().includes(query) || (m.email||"").toLowerCase().includes(query) || (m.phone||"").toLowerCase().includes(query) || (m.nationalID||"").toLowerCase().includes(query);
        } else {
            matchesSearch = String(m[searchColumn] || "").toLowerCase().includes(query);
        }

        if (!matchesSearch) return false;

        if (filter === "active" && !m.isActive) return false;
        if (filter === "inactive" && m.isActive) return false;
        if (filter === "pending_docs" && m.documentsUploaded) return false;
        if (filter === "up_to_date") {
            const annualTarget = m.totalShareValue * 0.20;
            const currentYear = new Date().getFullYear();
            const joinYear = new Date(m.createdAt as string).getFullYear() || currentYear;
            const yearsSinceStart = Math.max(1, currentYear - joinYear + 1);
            const expectedPaid = Math.min(annualTarget * yearsSinceStart, m.totalShareValue);
            if (m.paidSoFar < expectedPaid) return false;
        }

        const joined = new Date(m.createdAt as string).getTime();
        const now = new Date();
        const joinedDate = new Date(m.createdAt as string);

        if (durationFilter === "today") {
            if (joinedDate.toDateString() !== now.toDateString()) return false;
        } else if (durationFilter === "week") {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (joined < oneWeekAgo.getTime()) return false;
        } else if (durationFilter === "month") {
            if (joinedDate.getMonth() !== now.getMonth() || joinedDate.getFullYear() !== now.getFullYear()) return false;
        } else if (durationFilter === "year") {
            if (joinedDate.getFullYear() !== now.getFullYear()) return false;
        } else if (durationFilter === "custom") {
            if (joinDateStart && joined < new Date(joinDateStart).getTime()) return false;
            
            if (joinDateEnd && joined > new Date(joinDateEnd).getTime() + 86400000) return false;
        }

        return true;
    }), [members, search, filter, searchColumn, durationFilter, joinDateStart, joinDateEnd]);

    const stats = useMemo(() => ({
        total: members.length,
        active: members.filter(m => m.isActive).length,
        inactive: members.filter(m => !m.isActive).length,
        pendingDocs: members.filter(m => !m.documentsUploaded).length,
        totalValue: members.reduce((acc, m) => acc + m.totalShareValue, 0),
        totalPaid: members.reduce((acc, m) => acc + m.paidSoFar, 0),
    }), [members]);

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Secretary Report');

        
        worksheet.columns = [
            { header: 'Member Name', key: 'fullName', width: 25 },
            { header: 'Email Address', key: 'email', width: 30 },
            { header: 'Phone Number', key: 'phone', width: 15 },
            { header: 'National ID', key: 'nationalID', width: 20 },
            { header: 'Join Date', key: 'createdAt', width: 15 },
            { header: 'Total Share Value', key: 'totalShareValue', width: 20 },
            { header: 'Paid So Far', key: 'paidSoFar', width: 20 },
            { header: 'Outstanding Balance', key: 'balance', width: 20 },
            { header: 'Compliance Status', key: 'compliance', width: 20 },
            { header: 'Account Status', key: 'status', width: 15 },
        ];

        
        filteredMembers.forEach(m => {
            worksheet.addRow({
                fullName: m.fullName,
                email: m.email,
                phone: m.phone || "N/A",
                nationalID: m.nationalID || "N/A",
                createdAt: new Date(m.createdAt as string).toLocaleDateString(),
                totalShareValue: m.totalShareValue,
                paidSoFar: m.paidSoFar,
                balance: m.totalShareValue - m.paidSoFar,
                compliance: m.documentsUploaded ? "Compliant" : "Missing Documents",
                status: m.isActive ? "Active" : "Inactive"
            });
        });

        
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD4AF37' } 
            };
            cell.font = {
                color: { argb: 'FFFFFFFF' }, 
                bold: true,
                size: 11
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        
        worksheet.autoFilter = {
            from: 'A1',
            to: {
                row: 1,
                column: worksheet.columns.length
            }
        };

        
        worksheet.columns.forEach(column => {
            let maxColumnLength = 0;
            column.eachCell!({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxColumnLength) {
                    maxColumnLength = columnLength;
                }
            });
            column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2;
        });

        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `COMPASLINK_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast.success("Professional Excel report exported! heart");
    };

    if (loading || loadingData) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 print:p-0">
            {}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden"
            >
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
                        Membership <span className="text-amber-500">Reports</span>
                    </h1>
                    <p className="text-stone-500 text-sm mt-1 font-medium">Generate and export member data for administrative use</p>
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

            {}
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden"
            >
                <StatCard title="Total Shares" value={formatRF(stats.totalValue)} icon={TrendingUp} color="gold" delay={0} />
                <StatCard title="Collected Capital" value={formatRF(stats.totalPaid)} icon={CheckCircle} color="green" delay={0.05} />
                <StatCard title="Active Status" value={`${stats.active} Members`} icon={Users} color="blue" delay={0.1} />
                <StatCard title="Doc Compliance" value={`${stats.total - stats.pendingDocs}/${stats.total}`} icon={AlertCircle} color="purple" delay={0.15} />
            </motion.div>

            {}
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden"
            >
                {}
                <div className="p-6 border-b border-stone-50 flex flex-col gap-4 print:hidden">

                    {}
                    {(search || filter !== "all" || joinDateStart || joinDateEnd) && (
                        <div className="flex flex-wrap items-center gap-2 mb-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">Active Filters:</span>
                            {search && (
                                <span className="px-2 py-0.5 bg-white border border-amber-200 rounded-md text-[10px] font-bold text-stone-600">
                                    Search ({searchColumn}): "{search}"
                                </span>
                            )}
                            {filter !== "all" && (
                                <span className="px-2 py-0.5 bg-white border border-amber-200 rounded-md text-[10px] font-bold text-stone-600">
                                    Status: {filter.replace('_', ' ')}
                                </span>
                            )}
                            {durationFilter !== "all" && (
                                <span className="px-2 py-0.5 bg-white border border-amber-200 rounded-md text-[10px] font-bold text-stone-600">
                                    {durationFilter === "custom" 
                                        ? `Joined: ${joinDateStart || "Any"} to ${joinDateEnd || "Any"}`
                                        : `Joined: ${durationFilter.replace('_', ' ')}`
                                    }
                                </span>
                            )}
                            <button 
                                onClick={() => { setSearch(""); setFilter("all"); setSearchColumn("all"); setDurationFilter("all"); setJoinDateStart(""); setJoinDateEnd(""); }}
                                className="ml-auto text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            {}
                            <div className="flex items-center gap-1 bg-stone-50 rounded-xl border border-stone-200 p-1">
                                <select 
                                    value={searchColumn} onChange={e => setSearchColumn(e.target.value as any)}
                                    className="appearance-none bg-transparent pl-3 pr-6 py-1.5 text-[10px] font-black uppercase tracking-widest text-stone-600 outline-none cursor-pointer"
                                >
                                    <option value="all">ANY</option>
                                    <option value="fullName">NAME</option>
                                    <option value="email">EMAIL</option>
                                    <option value="phone">PHONE</option>
                                    <option value="nationalID">NID</option>
                                </select>
                                <div className="w-px h-4 bg-stone-300"></div>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                                    <input
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="bg-transparent pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none w-32 sm:w-48 placeholder-stone-400"
                                    />
                                </div>
                            </div>

                            {}
                            <div className="flex items-center gap-1 bg-amber-50/50 rounded-xl border border-amber-100 p-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 pl-3">Joined:</span>
                                <select 
                                    value={durationFilter} onChange={e => setDurationFilter(e.target.value as any)}
                                    className="appearance-none bg-white rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-stone-600 outline-none cursor-pointer border border-amber-200"
                                >
                                    <option value="all">ALL TIME</option>
                                    <option value="today">TODAY</option>
                                    <option value="week">THIS WEEK</option>
                                    <option value="month">THIS MONTH</option>
                                    <option value="year">THIS YEAR</option>
                                    <option value="custom">CUSTOM RANGE</option>
                                </select>
                                {durationFilter === "custom" && (
                                    <div className="flex items-center gap-1 ml-1 pr-1 border-l border-amber-200 pl-2">
                                        <input
                                            type="date"
                                            value={joinDateStart} onChange={e => setJoinDateStart(e.target.value)}
                                            className="bg-white border border-amber-200 rounded-lg px-2 py-1 text-[10px] font-bold text-stone-600 outline-none focus:ring-1 focus:ring-amber-400"
                                        />
                                        <span className="text-stone-300 text-xs">-</span>
                                        <input
                                            type="date"
                                            value={joinDateEnd} onChange={e => setJoinDateEnd(e.target.value)}
                                            className="bg-white border border-amber-200 rounded-lg px-2 py-1 text-[10px] font-bold text-stone-600 outline-none focus:ring-1 focus:ring-amber-400"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-[10px] items-center font-black text-stone-400 uppercase tracking-widest shrink-0 hidden md:block">
                            {filteredMembers.length} records
                        </div>
                    </div>
                </div>

                {}
                <div className="hidden print:block p-8 border-b-4 border-stone-900 mb-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <img src="/assets/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
                            <div>
                                <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">COMPASLINK INVESTMENT A</h1>
                                <p className="text-sm text-amber-600 font-black tracking-widest uppercase">OFFICIAL SECRETARY REPORT</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-stone-900 uppercase">Generated on</p>
                            <p className="text-lg font-black text-stone-900 leading-none">{new Date().toLocaleDateString()}</p>
                            <div className="mt-2 space-y-0.5">
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Filter: {filter.replace('_', ' ')}</p>
                                {search && <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Query: {search}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50/60 print:bg-stone-100">
                                {["Member", "Email / Phone", "Total Share", "Paid Amount", "Balance", "Compliance"].map((h, i) => (
                                    <th key={h} className={`px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] ${i > 1 ? 'text-right' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 print:divide-stone-200">
                            {filteredMembers.map(m => (
                                <tr key={m.uid} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 flex items-center justify-center text-white font-black text-xs print:hidden">
                                                {m.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-stone-900">{m.fullName}</p>
                                                <p className="text-[9px] text-stone-400 uppercase tracking-widest">{m.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[10px] font-bold text-stone-600">{m.email}</p>
                                        <p className="text-[9px] font-medium text-stone-400">{m.phone || "—"}</p>
                                    </td>
                                    <td className="px-5 py-3 text-xs font-black text-stone-700 text-right">{formatRF(m.totalShareValue)}</td>
                                    <td className="px-5 py-3 text-xs font-black text-green-700 text-right">{formatRF(m.paidSoFar)}</td>
                                    <td className="px-5 py-3 text-xs font-black text-red-600 text-right">{formatRF(m.totalShareValue - m.paidSoFar)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border ${m.documentsUploaded ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                            {m.documentsUploaded ? 'Compliant' : 'Missing'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                       <FileText size={32} className="mx-auto text-stone-200 mb-2" />
                                       <p className="text-xs text-stone-400">No matching records found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {}
                        <tfoot className="bg-amber-50/50 print:bg-stone-50 border-t border-amber-100 print:border-stone-300">
                            <tr>
                                <td colSpan={2} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-amber-800 print:text-stone-800">Report Totals</td>
                                <td className="px-5 py-4 text-right text-sm font-black text-stone-900">{formatRF(filteredMembers.reduce((a, b) => a + b.totalShareValue, 0))}</td>
                                <td className="px-5 py-4 text-right text-sm font-black text-green-700">{formatRF(filteredMembers.reduce((a, b) => a + b.paidSoFar, 0))}</td>
                                <td className="px-5 py-4 text-right text-sm font-black text-red-600">{formatRF(filteredMembers.reduce((a, b) => a + (b.totalShareValue - b.paidSoFar), 0))}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {}
                <div className="hidden print:grid grid-cols-2 gap-20 p-12 mt-12">
                    <div className="border-t-2 border-stone-300 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Prepared by</p>
                        <p className="text-sm font-black text-stone-900 leading-tight">{profile?.fullName || 'Official Secretary'}</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{profile?.role || 'Secretary'}</p>
                        <p className="text-[10px] font-medium text-stone-500 mt-2">Tel: {profile?.phone || 'N/A'}</p>
                        <div className="mt-12 w-48 h-px bg-stone-200" />
                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-2">Authorized Signature</p>
                    </div>
                    <div className="border-t-2 border-stone-300 pt-4 flex flex-col items-end text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Approved for Release</p>
                        <p className="text-sm font-black text-stone-900 leading-tight">Board of Directors</p>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">CampusLink Command</p>
                        <div className="mt-12 w-48 h-px bg-stone-200" />
                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-2">Executive Seal</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import { getAllUsers, getUserDocuments } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Search, FileText, X, Loader2,
  CheckCircle, Eye, Download, ExternalLink, TrendingUp,
  UserCheck, UserX, DollarSign, ArrowRight
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatRF } from "@/lib/utils/format";
import type { CampusUser, UserDocument } from "@/lib/types";
import { toast } from "sonner";
import RegisterMemberModal from "@/components/dashboard/RegisterMemberModal";
import { useRouter, useSearchParams } from "next/navigation";

export default function MemberDirectory() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [members, setMembers] = useState<CampusUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CampusUser | null>(null);
  const [memberDocs, setMemberDocs] = useState<UserDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [cardFilter, setCardFilter] = useState<"all" | "active" | "inactive" | "paid">("all");
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === "secretary") fetchMembers();
  }, [profile]);

  const fetchMembers = async () => {
    try {
      const u = await getAllUsers();
      setMembers(u);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setDataLoading(false);
    }
  };

  const fetchMemberDocs = async (member: CampusUser) => {
    setSelectedMember(member);
    setDocsLoading(true);
    try {
      const docs = await getUserDocuments(member.uid);
      setMemberDocs(docs);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.isActive).length;
    const inactive = total - active;
    const paidFull = members.filter(m => m.paidSoFar >= m.totalShareValue && m.totalShareValue > 0).length;
    return { total, active, inactive, paidFull };
  }, [members]);

  const filtered = useMemo(() => {
    let base = members;
    if (cardFilter === "active")   base = base.filter(m => m.isActive);
    if (cardFilter === "inactive") base = base.filter(m => !m.isActive);
    if (cardFilter === "paid")     base = base.filter(m => m.paidSoFar >= m.totalShareValue && m.totalShareValue > 0);
    return base.filter(m =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.nationalID?.includes(search)
    );
  }, [members, search, cardFilter]);

  if (loading || dataLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

      {}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
            Member <span className="text-amber-500">Database</span>
          </h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">Search, view profile and manage documents</p>
        </div>
        <motion.button
          onClick={() => setShowRegister(true)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors"
        >
          <UserPlus size={16} /> Register Member
        </motion.button>
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {([
          { key: "all",      label: "Total Members",    value: stats.total,    icon: Users,      color: "gold",   delay: 0 },
          { key: "active",   label: "Active Members",   value: stats.active,   icon: UserCheck,  color: "green",  delay: 0.05 },
          { key: "inactive", label: "Inactive Members", value: stats.inactive, icon: UserX,      color: "red",    delay: 0.1 },
          { key: "paid",     label: "Fully Paid",       value: stats.paidFull, icon: DollarSign, color: "purple", delay: 0.15 },
        ] as const).map(({ key, label, value, icon, color, delay }) => (
          <div
            key={key}
            onClick={() => setCardFilter(f => f === key ? "all" : key)}
            className={`cursor-pointer rounded-[1.5rem] transition-all duration-300 ${
              cardFilter === key ? "ring-4 ring-white/80 ring-offset-2 scale-[1.03] shadow-2xl" : "hover:scale-[1.01]"
            }`}
          >
            <StatCard title={label} value={value} subtitle={cardFilter === key ? "Click to reset" : "Click to filter"} icon={icon} color={color} delay={delay} trend={{ value: 0, label: "members" }} />
          </div>
        ))}
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden"
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-stone-900 tracking-tight">Member Directory</h2>
            <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
              {filtered.length} {cardFilter !== "all" ? `(${cardFilter})` : search ? "found" : "total"}
            </span>
            {cardFilter !== "all" && (
              <button
                onClick={() => setCardFilter("all")}
                className="text-[10px] font-black text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <X size={11} /> Clear filter
              </button>
            )}
          </div>
          {}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, ID…"
              className="pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 w-56 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50/60">
                {["Member", "National ID", "Phone", "Share Value", "Paid", "Activity", "Document", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Users size={32} className="mx-auto text-stone-200 mb-2" />
                    <p className="text-xs text-stone-400">{members.length === 0 ? "No members yet." : "No matching members."}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const pct = m.totalShareValue > 0 ? Math.min((m.paidSoFar / m.totalShareValue) * 100, 100) : 0;
                  return (
                    <motion.tr
                      key={m.uid}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      onClick={() => router.push(`/secretary/members/${m.uid}`)}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 flex items-center justify-center text-white font-black text-xs group-hover:from-amber-500 group-hover:to-amber-600 transition-all duration-300">
                            {m.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-stone-900 leading-tight">{m.fullName}</p>
                            <p className="text-[10px] text-stone-400 font-medium">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-stone-500">{m.nationalID || "—"}</td>
                      <td className="px-5 py-3 text-xs text-stone-500">{m.phone || "—"}</td>
                      <td className="px-5 py-3 text-xs font-black text-stone-700">{formatRF(m.totalShareValue)}</td>
                      <td className="px-5 py-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-amber-500"}`}
                            />
                          </div>
                          <span className="text-[10px] font-black text-stone-500">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                          m.isActive
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          {m.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {m.documentsUploaded
                          ? <span className="flex items-center gap-1 text-green-600 text-[10px] font-black"><CheckCircle size={12} /> Verified</span>
                          : <span className="text-[10px] text-red-400 font-bold italic">Missing</span>
                        }
                      </td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => fetchMemberDocs(m)}
                          className="p-1.5 rounded-lg bg-stone-100 text-stone-400 hover:bg-amber-500 hover:text-white transition-all"
                          title="View Documents"
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)} />
            <motion.div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-6 z-10 shadow-2xl border border-stone-100"
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white font-black text-lg">
                    {selectedMember.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">{selectedMember.fullName}</h3>
                    <p className="text-[10px] text-stone-400">Member Documents & Verification</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-2 rounded-xl hover:bg-stone-100 transition-colors">
                  <X size={18} className="text-stone-400" />
                </button>
              </div>

              {docsLoading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-amber-500 mb-3" size={28} />
                  <p className="text-xs text-stone-400">Retrieving documents…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["ID", "Agreement", "Application"].map(type => {
                      const doc = memberDocs.find(d => d.type === type);
                      return (
                        <div key={type} className={`p-4 rounded-2xl border-2 transition-all ${doc ? "border-amber-100 bg-amber-50/20" : "border-dashed border-stone-200 bg-stone-50"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${doc ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-400"}`}>
                                <FileText size={14} />
                              </div>
                              <span className="text-xs font-black text-stone-800">{type}</span>
                            </div>
                            {doc && <CheckCircle size={14} className="text-green-500" />}
                          </div>
                          {doc ? (
                            <div className="flex gap-2">
                              <button onClick={() => setViewingDoc(doc.url)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-700 text-[10px] font-black hover:bg-amber-50 transition-colors">
                                <Eye size={12} /> View
                              </button>
                              <a href={doc.url} download
                                className="px-3 flex items-center justify-center rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                                <Download size={12} />
                              </a>
                            </div>
                          ) : (
                            <p className="text-[10px] text-stone-400 italic text-center py-1">Not uploaded</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {memberDocs.length > 0 && (
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                      <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-wider mb-2">Storage Details</h4>
                      <div className="space-y-1.5">
                        {memberDocs.map(d => (
                          <div key={d.id} className="flex items-center justify-between text-[10px] text-stone-500">
                            <span>{d.type}: {new Date(d.uploadedAt).toLocaleString()}</span>
                            <a href={d.url} target="_blank" className="text-amber-600 hover:underline flex items-center gap-1">
                              Open <ExternalLink size={9} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => router.push(`/secretary/members/${selectedMember.uid}`)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-black hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Full Profile <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-black hover:bg-stone-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RegisterMemberModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => { setShowRegister(false); fetchMembers(); }}
      />

      {}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingDoc(null)} 
            />
            <motion.div 
              className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center gap-2 text-amber-600">
                  <FileText size={18} />
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Document Viewer</h3>
                </div>
                <button 
                  onClick={() => setViewingDoc(null)} 
                  className="p-2 rounded-xl bg-white border border-stone-200 text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 bg-stone-100 relative">
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingDoc)}&embedded=true`}
                  className="w-full h-full border-0 absolute inset-0"
                  title="PDF Viewer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

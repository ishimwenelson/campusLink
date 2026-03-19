"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUser, getUserDocuments, getUserPayments, getUserEmergencyRequests, updateUser } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, User, Mail, Phone, ShieldCheck, Calendar, 
  CreditCard, FileText, CheckCircle, AlertCircle, 
  Download, Eye, ExternalLink, TriangleAlert, X
} from "lucide-react";
import { formatRF } from "@/lib/utils/format";
import type { CampusUser, UserDocument, Payment, EmergencyRequest } from "@/lib/types";
import { toast } from "sonner";

export default function MemberProfile() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { profile } = useAuth();
  
  const [member, setMember] = useState<CampusUser | null>(null);
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === "secretary" && id) {
      fetchData();
    }
  }, [profile, id]);

  const fetchData = async () => {
    try {
      const [u, d, p, e] = await Promise.all([
        getUser(id),
        getUserDocuments(id),
        getUserPayments(id),
        getUserEmergencyRequests(id)
      ]);
      setMember(u);
      setDocs(d);
      setPayments(p.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setEmergencies(e.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!member) return;
    try {
      await updateUser(member.uid, { isActive: !member.isActive });
      setMember({ ...member, isActive: !member.isActive });
      toast.success(`Member marked as ${!member.isActive ? "Active" : "Inactive"}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-stone-700">Member Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 text-amber-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const pct = member.totalShareValue > 0 ? Math.min((member.paidSoFar / member.totalShareValue) * 100, 100) : 0;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <motion.button 
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Directory
      </motion.button>

      {/* Main Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden relative"
      >
        <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-600" />
        <div className="px-8 pb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12">
          <div className="w-24 h-24 rounded-[1.5rem] bg-stone-900 border-4 border-white flex items-center justify-center text-white font-black text-4xl shadow-xl z-10 shrink-0">
            {member.fullName.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left z-10">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">{member.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs font-semibold text-stone-500">
              <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-full"><Mail size={12} /> {member.email}</span>
              <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-full"><Phone size={12} /> {member.phone || "No phone"}</span>
              <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-full"><ShieldCheck size={12} /> {member.nationalID || "No ID"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 self-center sm:self-auto w-full sm:w-auto mt-4 sm:mt-0 z-10">
             <button 
                onClick={handleToggleStatus}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors hover:scale-[1.02] active:scale-95 shadow-sm ${
                  member.isActive ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100" : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                }`}
              >
                {member.isActive ? "Active Account" : "Inactive Account"}
              </button>
              <span className="text-[10px] text-stone-400 font-medium">
                Joined {new Date(member.createdAt as string).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Stats & Docs) */}
        <div className="lg:col-span-1 space-y-6">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] border border-stone-100 shadow-xl p-6">
            <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-5">Financial Status</h2>
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-2xl p-4">
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wide mb-1">Target Share</p>
                <p className="text-xl font-black text-stone-900 tracking-tight">{formatRF(member.totalShareValue)}</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <p className="text-[10px] text-green-700 font-bold uppercase tracking-wide mb-1">Paid So Far</p>
                <p className="text-xl font-black text-green-800 tracking-tight">{formatRF(member.paidSoFar)}</p>
                
                <div className="mt-3">
                  <div className="flex justify-between mb-1.5">
                     <span className="text-[9px] font-black text-green-600/80 uppercase tracking-wide">Progress</span>
                     <span className="text-[9px] font-black text-green-700">{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-green-200/50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] border border-stone-100 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">Documents</h2>
              {member.documentsUploaded ? 
                <span className="flex items-center gap-1 text-[10px] text-green-600 font-black"><CheckCircle size={12}/> Verified</span> :
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-black"><AlertCircle size={12}/> Pending</span>
              }
            </div>
            
            <div className="space-y-3">
               {["ID", "Agreement", "Application"].map(type => {
                  const doc = docs.find(d => d.type === type);
                  return (
                    <div key={type} className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${doc ? "border-amber-100 bg-amber-50/20" : "border-dashed border-stone-200 bg-stone-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${doc ? "bg-amber-500 text-white shadow-sm" : "bg-stone-200 text-stone-400"}`}>
                          <FileText size={14} />
                        </div>
                        <span className="text-[10px] font-black text-stone-800 uppercase tracking-wide">{type}</span>
                      </div>
                      {doc ? (
                        <div className="flex gap-2">
                          <button onClick={() => setViewingDoc(doc.url)} className="w-7 h-7 rounded-lg bg-white border border-amber-200 text-amber-600 flex items-center justify-center hover:bg-amber-50 shadow-sm"><Eye size={12} /></button>
                          <a href={doc.url} download className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 shadow-sm"><Download size={12} /></a>
                        </div>
                      ) : (
                        <span className="text-[9px] text-stone-400 font-bold italic">Missing</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>

        {/* Right Column (Payments & Activity) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-stone-100 shadow-xl p-6">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">Recent Payments</h2>
              <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-[10px] font-black text-stone-500">{payments.length} total</span>
            </div>
            
            {payments.length === 0 ? (
               <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <CreditCard size={28} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-xs font-bold text-stone-400">No payments recorded</p>
               </div>
            ) : (
               <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="text-left py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest">Date</th>
                        <th className="text-left py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest">Amount</th>
                        <th className="text-left py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {payments.slice(0, 8).map(p => (
                        <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                           <td className="py-3 text-[11px] font-bold text-stone-600">{new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                           <td className="py-3 text-xs font-black text-green-700">{formatRF(p.amount)}</td>
                           <td className="py-3 text-[10px] font-medium text-stone-500 line-clamp-1">{p.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            )}
          </motion.div>

           {emergencies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-[2rem] border border-stone-100 shadow-xl p-6">
               <div className="flex items-center gap-2 mb-6">
                 <TriangleAlert size={16} className="text-amber-500" />
                 <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">Emergency Requests</h2>
               </div>

               <div className="space-y-3">
                 {emergencies.map(e => (
                   <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-stone-100 bg-stone-50 gap-4">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-black text-stone-900">{formatRF(e.amount)}</span>
                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                           e.status === 'approved' ? 'bg-green-100 text-green-700' :
                           e.status === 'rejected' ? 'bg-red-100 text-red-700' :
                           'bg-amber-100 text-amber-700'
                         }`}>{e.status}</span>
                       </div>
                       <p className="text-[10px] font-medium text-stone-500">
                         Requested: {new Date(e.requestedAt).toLocaleDateString()}
                       </p>
                     </div>
                     <div className="text-left sm:text-right">
                       <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Interest (5%)</p>
                       <p className="text-xs font-black text-stone-700">{formatRF(e.interestAmount)}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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

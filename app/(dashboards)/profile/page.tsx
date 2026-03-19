"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserDocuments, saveUserDocument, updateUser } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Shield, Mail, Phone, Fingerprint,
    Upload, FileText, CheckCircle, Loader2,
    Eye, Download, Trash2, Key, Save, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import type { UserDocument } from "@/lib/types";
import { BUSINESS_RULES } from "@/lib/types";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function ProfilePage() {
    const { profile, loading } = useAuth();
    const [documents, setDocuments] = useState<UserDocument[]>([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ fullName: "", phone: "" });
    const [pwdData, setPwdData] = useState({ current: "", new: "", confirm: "" });
    const [showPwdModal, setShowPwdModal] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({ fullName: profile.fullName, phone: profile.phone });
            fetchDocs();
        }
    }, [profile]);

    const fetchDocs = async () => {
        if (!profile) return;
        try {
            const docs = await getUserDocuments(profile.uid);
            setDocuments(docs);
        } catch (error) {
            console.error("Docs fetch error:", error);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        try {
            await updateUser(profile.uid, formData);
            toast.success("Profile updated successfully");
            setEditing(false);
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        setUploading(type);
        const form = new FormData();
        form.append("file", file);
        form.append("folder", `members/${profile.uid}`);
        form.append("userId", profile.uid);

        try {
            const res = await fetch("/api/upload/github", {
                method: "POST",
                body: form,
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            
            const docData: Omit<UserDocument, "id"> = {
                type: type as any,
                url: data.url,
                uploadedAt: new Date().toISOString(),
            };
            await saveUserDocument(profile.uid, docData);

            
            const updatedDocs = [...documents, { ...docData, id: 'temp' } as UserDocument];
            if (updatedDocs.length >= 3) {
                await updateUser(profile.uid, { documentsUploaded: true });
            }

            toast.success(`${type} uploaded successfully`);
            fetchDocs();
        } catch (error: any) {
            toast.error(error.message || "Upload failed");
        } finally {
            setUploading(null);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwdData.new !== pwdData.confirm) return toast.error("Passwords do not match");
        if (!auth.currentUser || !profile) return;

        setSavingPwd(true);
        try {
            const credential = EmailAuthProvider.credential(profile.email, pwdData.current);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, pwdData.new);

            
            if (!profile.passwordChanged) {
                await updateUser(profile.uid, { passwordChanged: true });
            }

            toast.success("Password changed successfully");
            setShowPwdModal(false);
            setPwdData({ current: "", new: "", confirm: "" });
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        } finally {
            setSavingPwd(false);
        }
    };

    if (loading || !profile) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
    );

    return (
        <div className="p-4 lg:p-10 max-w-5xl mx-auto space-y-10">
            {}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden card-gold p-8 rounded-3xl border border-amber-200 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 
                            flex items-center justify-center text-white font-bold text-5xl shadow-2xl group-hover:scale-105 transition-transform">
                            {profile.fullName.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl border-4 border-white shadow-lg ${profile.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="font-display text-4xl text-stone-900 font-bold mb-1">{profile.fullName}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
                            <span className="badge-gold text-xs px-3 py-1 font-bold uppercase tracking-widest">{profile.role}</span>
                            <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                                <Mail size={14} /> {profile.email}
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                                <Phone size={14} /> {profile.phone}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setEditing(!editing)} className="btn-stone flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold">
                            <User size={18} /> Edit Profile
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {}
                <div className="space-y-8">
                    <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Fingerprint size={20} />
                            </div>
                            <h2 className="font-display text-2xl text-stone-900 font-semibold">Security Settings</h2>
                        </div>

                        <div className="card-gold p-6 space-y-5 rounded-2xl border border-amber-50">
                            {!profile.passwordChanged && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 italic">
                                    <AlertCircle size={24} className="flex-shrink-0" />
                                    Please change your default password for account security.
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-stone-800 text-sm">Account Password</p>
                                    <p className="text-xs text-stone-500">Last updated: {profile.passwordChanged ? 'Recently' : 'Never (Default)'}</p>
                                </div>
                                <button
                                    onClick={() => setShowPwdModal(true)}
                                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors flex items-center gap-2"
                                >
                                    <Key size={14} /> Update Password
                                </button>
                            </div>

                            {editing ? (
                                <div className="pt-4 border-t border-amber-50 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1.5 block uppercase">Full Name</label>
                                        <input
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-amber-50/30 border border-amber-100 focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1.5 block uppercase">Phone Number</label>
                                        <input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-amber-50/30 border border-amber-100 focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateProfile} className="flex-1 btn-gold py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                            <Save size={16} /> Save Changes
                                        </button>
                                        <button onClick={() => setEditing(false)} className="px-5 py-3 rounded-xl border border-stone-200 font-bold text-sm">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-amber-50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Member Since</p>
                                            <p className="text-sm font-semibold text-stone-700">{new Date(profile.createdAt as string).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">National ID</p>
                                            <p className="text-sm font-semibold text-stone-700 font-mono">{profile.nationalID}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </div>

                {}
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <Shield size={20} />
                        </div>
                        <h2 className="font-display text-2xl text-stone-900 font-semibold">Identity Documents</h2>
                    </div>

                    <div className="card-gold p-6 rounded-2xl border border-amber-50 space-y-6">
                        <p className="text-xs text-stone-500 mb-2 italic">
                            Upload your documents to verify your membership status. All files are stored securely.
                        </p>

                        {["ID", "Agreement", "Application"].map((type) => {
                            const doc = documents.find(d => d.type === type);
                            const isUploading = uploading === type;

                            return (
                                <div key={type} className={`p-4 rounded-xl border transition-all ${doc ? 'bg-amber-50/30 border-amber-100' : 'bg-stone-50 border-dashed border-stone-300'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className={doc ? 'text-amber-500' : 'text-stone-300'} />
                                            <span className="font-bold text-stone-800 text-sm">{type} Document</span>
                                        </div>
                                        {doc && <CheckCircle size={14} className="text-green-500" />}
                                    </div>

                                    {doc ? (
                                        <div className="flex gap-2">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white border border-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors">
                                                <Eye size={12} /> View
                                            </a>
                                            <a href={doc.url} download className="px-3 flex items-center justify-center rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
                                                <Download size={12} />
                                            </a>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(e, type)}
                                                disabled={!!uploading}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                            />
                                            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors">
                                                {isUploading ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : <><Upload size={12} /> Upload File</>}
                                            </div>
                                        </label>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.section>
            </div>

            {}
            <AnimatePresence>
                {showPwdModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPwdModal(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <h3 className="font-display text-2xl font-bold text-stone-900 mb-6">Change Password</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Current Password</label>
                                    <input type="password" required value={pwdData.current} onChange={(e) => setPwdData({ ...pwdData, current: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-400 outline-none text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">New Password</label>
                                    <input type="password" required minLength={8} value={pwdData.new} onChange={(e) => setPwdData({ ...pwdData, new: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-400 outline-none text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Confirm Password</label>
                                    <input type="password" required value={pwdData.confirm} onChange={(e) => setPwdData({ ...pwdData, confirm: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-400 outline-none text-sm" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowPwdModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 font-bold text-stone-600 text-sm">Cancel</button>
                                    <button type="submit" disabled={savingPwd} className="flex-1 btn-gold py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                        {savingPwd ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Update</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

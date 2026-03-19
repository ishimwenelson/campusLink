
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlus, X, Loader2, ShieldCheck, Info, ChevronDown, TrendingUp } from "lucide-react";
import { getSystemSettings } from "@/lib/firebase/firestore";
import { formatRF } from "@/lib/utils/format";
import { useEffect } from "react";

const schema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number required"),
  nationalID: z.string().min(10, "National ID required"),
  role: z.enum(["member", "investor", "president", "treasurer", "secretary", "boardMember"]),
  shareUnits: z.number().min(400, "Minimum 400 shares required"),
  accountUsed: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_PASSWORD = "CampusLink2025";

export default function RegisterMemberModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [sharePrice, setSharePrice] = useState(1000);

  useEffect(() => {
    if (open) {
      getSystemSettings().then(s => setSharePrice(s.shareUnitPrice || 1000));
    }
  }, [open]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "member",
      shareUnits: 400,
    },
  });

  const watchedShares = watch("shareUnits");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        totalShareValue: data.shareUnits * sharePrice
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      toast.success(`${data.fullName} registered! Default password: ${DEFAULT_PASSWORD}`);
      reset();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg.includes("email-already") ? "This email is already registered" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            {}
            <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between bg-stone-50/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md">
                  <UserPlus size={18} />
                </div>
                <h2 className="font-display text-[14px] font-black text-stone-900 tracking-tight uppercase">Register Member</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-stone-100 rounded-full transition-all text-stone-400 hover:text-stone-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {}
              <div className="bg-amber-50/50 rounded-xl px-4 py-2.5 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Default Password: <span className="font-mono text-amber-600 ml-1">{DEFAULT_PASSWORD}</span></p>
                </div>
                <p className="text-[9px] font-bold text-amber-600 italic">Reset required on login</p>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">Full Name</label>
                  <input 
                    {...register("fullName")} 
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none text-[11px] font-bold transition-all" 
                    placeholder="Jean Uwimana" 
                  />
                  {errors.fullName && <p className="text-red-500 text-[8px] font-black mt-0.5 ml-0.5 uppercase">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">Email</label>
                  <input 
                    {...register("email")} type="email"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none text-[11px] font-bold transition-all" 
                    placeholder="jean@mail.com" 
                  />
                  {errors.email && <p className="text-red-500 text-[8px] font-black mt-0.5 ml-0.5 uppercase">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">Phone</label>
                  <input 
                    {...register("phone")} 
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none text-[11px] font-bold transition-all" 
                    placeholder="+250..." 
                  />
                  {errors.phone && <p className="text-red-500 text-[8px] font-black mt-0.5 ml-0.5 uppercase">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">National ID</label>
                  <input 
                    {...register("nationalID")} 
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none text-[11px] font-bold transition-all" 
                    placeholder="1199..." 
                  />
                  {errors.nationalID && <p className="text-red-500 text-[8px] font-black mt-0.5 ml-0.5 uppercase">{errors.nationalID.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">Role</label>
                  <div className="relative">
                    <select 
                      {...register("role")} 
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 outline-none text-[11px] font-black appearance-none"
                    >
                      <option value="member">Member</option>
                      <option value="investor">Investor</option>
                      <option value="treasurer">Treasurer</option>
                      <option value="secretary">Secretary</option>
                      <option value="boardMember">Board Member</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">Shares (Units)</label>
                  <div className="relative">
                    <input 
                      {...register("shareUnits", { valueAsNumber: true })} type="number"
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 outline-none text-[11px] font-bold" 
                      placeholder="400" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                       <span className="text-[8px] font-black text-stone-300 uppercase tracking-tighter">Units</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 ml-1">
                    <TrendingUp size={10} className="text-amber-500" />
                    <p className="text-[9px] font-black text-stone-900 uppercase tracking-tight">
                      Value: <span className="text-amber-600">{formatRF(watchedShares * sharePrice)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest ml-0.5">Account Number (Optional)</label>
                <input 
                  {...register("accountUsed")} 
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 outline-none text-[11px] font-bold" 
                  placeholder="MoMo / Bank account number" 
                />
              </div>

              <div className="flex gap-4 pt-3">
                <button 
                  type="button" onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl border border-stone-100 text-stone-500 font-extrabold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <motion.button 
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-[2] py-3.5 rounded-2xl bg-stone-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-stone-200"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Register Member"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

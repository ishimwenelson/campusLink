"use client";
import { useState } from "react";
import { ShoppingBag, X, Info, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createShareOffer } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { formatRF } from "@/lib/utils/format";
import { ShareListing } from "@/lib/types";

interface BuySharesModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ShareListing | null;
  uid: string;
  userName: string;
}

export function BuySharesModal({ isOpen, onClose, listing, uid, userName }: BuySharesModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shareAmount = Number(amount);

    if (shareAmount <= 0) return toast.error("Please enter a valid amount.");
    if (shareAmount > listing.availableShares) {
      return toast.error(`Only ${listing.availableShares.toLocaleString()} shares are available.`);
    }

    setLoading(true);
    try {
      await createShareOffer(
        listing.id, 
        uid, 
        userName, 
        shareAmount, 
        listing.pricePerShare, 
        listing.sellerId
      );
      toast.success("Purchase offer sent to seller!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = Number(amount) * listing.pricePerShare;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-stone-100 overflow-hidden"
          >
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-stone-900 tracking-tight italic">Buy <span className="text-amber-500">Shares</span></h2>
                  <p className="text-stone-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Market Purchase Request</p>
                </div>
                <button onClick={onClose} className="p-3 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-colors">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              <div className="mb-8 p-6 rounded-[2rem] bg-stone-50 border border-stone-100">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 font-black">
                       {listing.sellerName.charAt(0)}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Seller</p>
                       <p className="text-sm font-black text-stone-900">{listing.sellerName}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Available</p>
                        <p className="text-sm font-black text-amber-600">{listing.availableShares.toLocaleString()} SHRS</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Asking Price</p>
                        <p className="text-sm font-black text-emerald-600">{formatRF(listing.pricePerShare)}</p>
                    </div>
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Quantity to Buy</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Max ${listing.availableShares}`}
                      max={listing.availableShares}
                      className="w-full px-5 py-4 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-amber-500/20 transition-all font-black text-stone-900 shadow-inner"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300">SHRS</span>
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-stone-900 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Estimated Total</p>
                       <p className="text-2xl font-black text-white">{formatRF(totalCost)}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                       <ShoppingBag size={24} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 border border-stone-100 italic">
                   <ShieldCheck size={16} className="text-emerald-500" />
                   <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                      Secure Transfer: Funds are handled institutional-direct upon approval.
                   </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !amount || Number(amount) > listing.availableShares}
                  className="w-full py-5 rounded-[1.8rem] bg-amber-500 text-white font-black hover:bg-amber-600 transition-all shadow-[0_20px_40px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {loading ? "Sending Offer..." : (
                    <>
                      Place Buy Order <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

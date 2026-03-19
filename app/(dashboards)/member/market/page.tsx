"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { 
  getMarketListings, getListingOffers, acceptShareOffer, 
  getMarketHistory 
} from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, TrendingUp, ArrowUpRight, Plus, X,
  Search, Filter, Clock, CheckCircle2, AlertCircle,
  History as HistoryIcon, ArrowRight, Wallet, User, Briefcase, ChevronRight, XCircle,
  ArrowDownLeft
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatRF } from "@/lib/utils/format";
import { toast } from "sonner";
import { ShareListing, ShareOffer } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { SellSharesModal } from "@/components/modals/SellSharesModal";
import { BuySharesModal } from "@/components/modals/BuySharesModal";

export default function MarketPage() {
  const { profile } = useAuth();
  const [listings, setListings] = useState<ShareListing[]>([]);
  const [myOffers, setMyOffers] = useState<ShareOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'my-listings' | 'my-offers'>('market');
  const [searchQuery, setSearchQuery] = useState("");

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ShareListing | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, [profile]);

  async function fetchMarketData() {
    if (!profile) return;
    setLoading(true);
    try {
      const marketListings = await getMarketListings();
      setListings(marketListings);
      
      // Fetch user's offers (we'd need a specific function or filter)
      // For now, I'll focus on the listings and their nested offers
    } catch (error) {
      console.error(error);
      toast.error("Failed to load market listings");
    } finally {
      setLoading(false);
    }
  }

  const filteredListings = listings.filter(l => 
    l.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.totalShares.toString().includes(searchQuery)
  );

  const myActiveListings = listings.filter(l => l.sellerId === profile?.uid);

  return (
    <div className="space-y-8 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="tracking-tight text-3xl font-black">
            Share <span className="text-amber-500">Marketplace</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs mt-1 max-w-xl">
            Trade shares securely within the Campus Link ecosystem.
          </p>
        </div>

        <motion.button
          onClick={() => setIsSellModalOpen(true)}
          className="btn-gold flex items-center gap-2.5 px-5 py-3"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} />
          <span className="font-bold">List Shares</span>
        </motion.button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Market Volume" 
          value={formatRF(listings.reduce((acc, curr) => acc + (curr.availableShares * curr.pricePerShare), 0))} 
          icon={TrendingUp} 
          color="gold"
          trend={{ value: 1.2, label: "vs last week" }}
        />
        <StatCard 
          title="Active Listings" 
          value={listings.length} 
          icon={ShoppingBag} 
          color="blue"
        />
        <StatCard 
          title="My Equity" 
          value={profile ? formatRF(profile.paidSoFar) : "0 RF"} 
          icon={Wallet} 
          color="purple"
        />
        <StatCard 
          title="Total Shares" 
          value={profile ? Math.round(profile.paidSoFar / 1000) : 0} 
          subtitle="Total Holding"
          icon={Briefcase} 
          color="green"
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden min-h-[500px] relative">
        {/* Tab Navigation */}
        <div className="flex border-b border-stone-50 px-6 bg-stone-50/30 backdrop-blur-md sticky top-0 z-10">
          <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} label="Live Market" count={listings.length} />
          <TabButton active={activeTab === 'my-listings'} onClick={() => setActiveTab('my-listings')} label="My Listings" count={myActiveListings.length} />
          <TabButton active={activeTab === 'my-offers'} onClick={() => setActiveTab('my-offers')} label="History" />
        </div>

        <div className="p-6">
          {activeTab === 'market' && (
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                   <div className="absolute inset-0 bg-amber-500/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-hover:text-amber-500 transition-colors" size={16} />
                   <input
                    type="text"
                    placeholder="Search seller or share amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border-stone-100 border focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all text-xs font-medium text-stone-900"
                  />
                </div>
              </div>

              {/* Listings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50/60">
                      <th className="px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">Seller</th>
                      <th className="px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">Inventory</th>
                      <th className="px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">Asking Price</th>
                      <th className="px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">Liquidity</th>
                      <th className="px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">Type</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black text-stone-400 uppercase tracking-[0.15em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {loading ? (
                       <tr><td colSpan={6} className="text-center py-20 text-[10px] font-black text-stone-300 uppercase tracking-widest animate-pulse">Synchronizing Order Book...</td></tr>
                    ) : filteredListings.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-20 bg-stone-50/30">
                        <div className="flex flex-col items-center gap-3">
                           <ShoppingBag size={32} className="text-stone-200" />
                           <p className="text-stone-400 font-bold text-xs">No active market listings matched.</p>
                        </div>
                      </td></tr>
                    ) : filteredListings.map((listing) => (
                      <ListingRow 
                        key={listing.id} 
                        listing={listing} 
                        onBuy={() => {
                          setSelectedListing(listing);
                          setIsBuyModalOpen(true);
                        }} 
                        isOwn={listing.sellerId === profile?.uid} 
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'my-listings' && (
            <div className="space-y-6">
               {myActiveListings.length === 0 ? (
                  <div className="text-center py-20 bg-stone-50/30 rounded-[2rem] border-2 border-dashed border-stone-100 flex flex-col items-center gap-4">
                    <div className="p-4 rounded-2xl bg-white shadow-sm">
                       <Plus size={32} className="text-stone-200" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-stone-900">No Active Listings</h3>
                      <p className="text-xs text-stone-400 font-medium">List your shares to gain liquidity.</p>
                    </div>
                    <button 
                      onClick={() => setIsSellModalOpen(true)}
                      className="px-6 py-2 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase hover:bg-stone-800 transition-all shadow-lg"
                    >
                      New Listing
                    </button>
                  </div>
               ) : (
                  myActiveListings.map((listing) => (
                    <MyListingBox key={listing.id} listing={listing} />
                  ))
               )}
            </div>
          )}

          {activeTab === 'my-offers' && <MarketHistoryView profile={profile} />}
        </div>
      </div>

      {profile && (
        <>
          <SellSharesModal
            isOpen={isSellModalOpen}
            onClose={() => { setIsSellModalOpen(false); fetchMarketData(); }}
            uid={profile.uid}
            userName={profile.fullName}
            currentPaid={profile.paidSoFar}
          />
          <BuySharesModal
            isOpen={isBuyModalOpen}
            onClose={() => { setIsBuyModalOpen(false); fetchMarketData(); }}
            listing={selectedListing}
            uid={profile.uid}
            userName={profile.fullName}
          />
        </>
      )}
    </div>
  );
}

function MyListingBox({ listing }: { listing: ShareListing }) {
  const [offers, setOffers] = useState<ShareOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListingOffers(listing.id).then(setOffers).finally(() => setLoading(false));
  }, [listing.id]);

  const handleAccept = async (offer: ShareOffer) => {
    try {
      await acceptShareOffer(offer);
      toast.success("Offer accepted! Trade finalized.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete trade");
    }
  };

  return (
    <div className="rounded-3xl border border-stone-100 p-6 space-y-6 bg-stone-50/20">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3">
             <div className="p-3 rounded-xl bg-white border border-stone-100 text-amber-500 shadow-sm">
                <ShoppingBag size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black text-stone-900">Market Listing</h3>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-0.5">ID: {listing.id.slice(0,8)} • {new Date(listing.createdAt).toLocaleDateString()}</p>
             </div>
          </div>
          <div className="flex gap-4 items-center bg-white/50 px-4 py-2 rounded-2xl border border-stone-100/50">
             <div className="text-right">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Inventory</p>
                <p className="text-xs font-black text-stone-900">{listing.availableShares.toLocaleString()} / {listing.totalShares.toLocaleString()} SHRS</p>
             </div>
             <div className="h-6 w-[1px] bg-stone-200" />
             <div className="text-right">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Liquidity</p>
                <p className="text-xs font-black text-stone-900">{formatRF(listing.availableShares * listing.pricePerShare)}</p>
             </div>
          </div>
       </div>

       <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
             <ArrowUpRight size={12} className="text-amber-500" /> Incoming Offers
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {loading ? (
                <div className="col-span-2 py-8 text-center text-stone-300 font-black uppercase tracking-widest text-[9px]">Scanning...</div>
             ) : offers.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-stone-300 italic text-xs">No pending buy requests.</div>
             ) : offers.filter(o => o.status === 'pending').map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-100 shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center font-black text-stone-300 text-xs">
                         {offer.buyerName.charAt(0)}
                      </div>
                      <div>
                         <p className="text-xs font-black text-stone-900">{offer.buyerName}</p>
                         <p className="text-[9px] font-black text-stone-400 uppercase whitespace-nowrap">{offer.requestedShares.toLocaleString()} SHRS Requested</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-stone-400 uppercase mb-0.5">Value</p>
                         <p className="text-xs font-black text-emerald-600">{formatRF(offer.requestedShares * offer.pricePerShare)}</p>
                      </div>
                      <div className="flex gap-1.5">
                         <button 
                           onClick={() => handleAccept(offer)}
                           className="px-4 py-2 rounded-lg bg-stone-900 text-white text-[9px] font-black uppercase hover:bg-emerald-600 transition-all"
                         >
                           Accept
                         </button>
                         <button className="p-2 rounded-lg bg-stone-50 border border-stone-100 text-stone-400 hover:text-red-500">
                            <X size={14} />
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

function MarketHistoryView({ profile }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketHistory().then(data => {
      const myHistory = data.filter(h => h.sellerId === profile?.uid || h.buyerId === profile?.uid);
      setHistory(myHistory);
    }).finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="space-y-3">
       {loading ? (
          <div className="text-center py-20 animate-pulse font-black text-stone-300 uppercase italic text-[10px]">Retrieving...</div>
       ) : history.length === 0 ? (
          <div className="text-center py-20 italic text-stone-400 text-xs">No completed trades found.</div>
       ) : (
          <div className="space-y-2">
             {history.map((record) => {
                const isSeller = record.sellerId === profile?.uid;
                return (
                  <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-stone-100 group">
                     <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", isSeller ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600")}>
                           {isSeller ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-stone-900 leading-tight">
                              {isSeller ? `Sold to ${record.buyerName}` : `Bought from ${record.sellerName}`}
                           </p>
                           <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-0.5">
                              {record.shares.toLocaleString()} SHRS • {new Date(record.createdAt).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={cn("text-sm font-black", isSeller ? "text-stone-900" : "text-emerald-600")}>
                           {isSeller ? "+" : "-"}{formatRF(record.totalPrice)}
                        </p>
                        <p className="text-[8px] font-black text-stone-300 uppercase mt-0.5">MOD: {record.id.slice(0,6)}</p>
                     </div>
                  </div>
                );
             })}
          </div>
       )}
    </div>
  );
}

function TabButton({ active, onClick, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-5 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative flex items-center gap-2",
        active ? "text-stone-950" : "text-stone-400 hover:text-stone-600"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("px-1.5 py-0.5 rounded-md text-[8px] font-black", active ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-400")}>
          {count}
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="marketTab" 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" 
        />
      )}
    </button>
  );
}

function ListingRow({ listing, onBuy, isOwn }: { listing: ShareListing, onBuy: () => void, isOwn?: boolean }) {
  return (
    <tr className="hover:bg-stone-50/60 transition-colors group">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 flex items-center justify-center text-white font-black text-xs group-hover:from-amber-400 group-hover:to-amber-600 transition-all duration-300 relative overflow-hidden">
            <span className="relative z-10">{listing.sellerName.charAt(0)}</span>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-sm font-black text-stone-900 leading-tight">{isOwn ? "You (Seller)" : listing.sellerName}</p>
            <p className="text-[10px] text-stone-400 font-medium whitespace-nowrap">Listed {new Date(listing.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5">
           <p className="text-xs font-black text-amber-500 italic">{listing.availableShares.toLocaleString()}</p>
           <span className="text-[9px] text-stone-300 font-black uppercase tracking-tighter">/ {listing.totalShares.toLocaleString()} SHRS</span>
        </div>
      </td>
      <td className="px-5 py-3 text-xs font-black text-emerald-600">
        {formatRF(listing.pricePerShare)}
      </td>
      <td className="px-5 py-3 text-xs font-black text-stone-700">
        {formatRF(listing.availableShares * listing.pricePerShare)}
      </td>
      <td className="px-5 py-3">
        {listing.isLiquidation ? (
          <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wide border border-red-100">
             Liquidation
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wide border border-blue-100">
             Partial
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-right">
        {isOwn ? (
           <span className="text-[9px] font-black text-stone-300 uppercase italic opacity-50">Own Asset</span>
        ) : (
          <button
            onClick={onBuy}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-400 hover:bg-amber-500 hover:text-white transition-all"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

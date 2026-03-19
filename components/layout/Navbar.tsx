"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
    Search, Bell, Moon, Sun, Menu, X,
    ChevronDown, ChevronRight, User, Settings, LogOut,
    Command, Sparkles, Shield, Wallet, Users
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CampusUser, UserRole } from "@/lib/types";

interface NavbarProps {
    profile: CampusUser | null;
    unreadCount: number;
    notifications: any[];
    markRead: (id: string) => Promise<void>;
    setMobileSidebarOpen: (open: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    handleLogout: () => Promise<void>;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    navItems: any[];
}

export default function Navbar({
    profile,
    unreadCount,
    notifications,
    markRead,
    setMobileSidebarOpen,
    sidebarOpen,
    setSidebarOpen,
    handleLogout,
    darkMode,
    setDarkMode,
    navItems
}: NavbarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const searchRef = useRef<HTMLInputElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === "Escape") {
                setSearchOpen(false);
                setNotifOpen(false);
                setProfileOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (searchOpen) searchRef.current?.focus();
    }, [searchOpen]);

    const filteredSearch = searchQuery.length > 0
        ? navItems.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    const currentPage = navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "Dashboard";

    return (
        <header className="sticky top-0 z-40 w-full h-16 bg-white/70 backdrop-blur-xl border-b border-stone-100 flex items-center justify-between px-6 lg:px-10 gap-4 transition-all">

            {}
            <div className="flex items-center gap-6 flex-1 lg:flex-none">
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden p-3 rounded-2xl bg-stone-50 hover:bg-stone-100/80 transition-all text-stone-600 active:scale-95"
                >
                    <Menu size={22} />
                </button>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-amber-500 hover:border-amber-200 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(245,158,11,0.1)] active:scale-95"
                >
                    {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
                </button>

                <div className="hidden md:block">
                    <h1 className="font-display text-xl text-stone-900 font-black tracking-tight flex items-center gap-3">
                        {currentPage}
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </h1>
                </div>
            </div>

            {}
            <div className="flex-1 max-w-xl hidden md:block">
                <AnimatePresence mode="wait">
                    {searchOpen ? (
                        <motion.div
                            key="search-box"
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            className="relative"
                        >
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                            <input
                                ref={searchRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tools, members, financials..."
                                className="w-full bg-white border-2 border-amber-500/20 rounded-[16px] py-2 pl-12 pr-12 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 shadow-2xl shadow-amber-900/10 transition-all"
                            />
                            <button
                                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {}
                            <AnimatePresence>
                                {searchQuery.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full mt-3 w-full bg-white border border-stone-100 rounded-[24px] shadow-2xl overflow-hidden z-[60]"
                                    >
                                        <div className="p-3">
                                            {filteredSearch.length > 0 ? (
                                                filteredSearch.map((res) => (
                                                    <button
                                                        key={res.href}
                                                        onClick={() => { router.push(res.href); setSearchOpen(false); setSearchQuery(""); }}
                                                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-amber-50 rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-100/50 group-hover:text-amber-600 transition-colors">
                                                            <res.icon size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-stone-800">{res.label}</p>
                                                            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mt-0.5">Navigation item</p>
                                                        </div>
                                                        <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40" />
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="py-10 text-center">
                                                    <p className="text-sm text-stone-400 italic">No matches found for "{searchQuery}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="search-trigger"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            onClick={() => setSearchOpen(true)}
                            className="w-full group bg-stone-50 border border-stone-100 hover:border-amber-200 hover:bg-white px-5 py-2 rounded-[16px] flex items-center gap-3 transition-all"
                        >
                            <Search className="text-stone-400 group-hover:text-amber-500 transition-colors" size={18} />
                            <span className="text-sm text-stone-400 text-left flex-1">Type <span className="text-amber-500 font-bold">⌘K</span> to jump anywhere...</span>
                            <Command size={14} className="text-stone-300 group-hover:text-amber-400" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {}
            <div className="flex items-center gap-4">
                {}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 transition-all text-stone-500 shadow-sm active:scale-95"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 transition-all text-stone-500 shadow-sm active:scale-95 relative"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-amber-500/30">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                className="absolute right-0 top-full mt-4 w-[380px] bg-white rounded-[32px] border border-stone-100 shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 border-b border-stone-50 flex items-center justify-between">
                                    <h3 className="font-display font-black text-stone-900 tracking-tight">Activity</h3>
                                    {unreadCount > 0 && <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-[450px] overflow-y-auto p-2">
                                    {notifications.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <Sparkles className="mx-auto mb-4 text-amber-500/20" size={48} />
                                            <p className="text-sm text-stone-400 font-medium">Your feed is currently clean.</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <button
                                                key={n.id} onClick={() => markRead(n.id)}
                                                className={cn(
                                                    "w-full p-4 rounded-2xl text-left hover:bg-stone-50 transition-all border border-transparent",
                                                    !n.read && "bg-amber-500/[0.03] border-amber-500/5 shadow-sm"
                                                )}
                                            >
                                                <p className="text-xs font-bold text-stone-800">{n.title}</p>
                                                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{n.message}</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Just Now</span>
                                                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="p-4 border-t border-stone-50">
                                        <button 
                                            onClick={() => { router.push('/notifications'); setNotifOpen(false); }}
                                            className="w-full py-3 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold text-xs uppercase tracking-widest transition-all"
                                        >
                                            View All Activity
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 transition-all active:scale-95 border border-stone-100 shadow-sm"
                    >
                        <div className="hidden sm:block text-right pr-0.5">
                            <p className="text-[11px] font-black text-stone-900 leading-none">{profile?.fullName.split(' ')[0]}</p>
                            <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mt-0.5">{profile?.role}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 
                            flex items-center justify-center text-white font-black text-sm shadow-xl relative">
                            {profile?.fullName.charAt(0)}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <ChevronDown size={12} className={cn("text-stone-400 transition-transform", profileOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                className="absolute right-0 top-full mt-4 w-64 bg-white rounded-[32px] border border-stone-100 shadow-2xl overflow-hidden p-3"
                            >
                                <div className="p-4 bg-stone-50 rounded-[24px] mb-2">
                                    <p className="text-sm font-black text-stone-900 truncate">{profile?.fullName}</p>
                                    <p className="text-xs text-stone-500 truncate mt-0.5">{profile?.email}</p>
                                </div>

                                {[
                                    { icon: User, label: 'Profile Settings', href: '/profile' },
                                    { icon: Settings, label: 'Preferences', href: '#' },
                                    { icon: Shield, label: 'Governance', href: '/board' },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => { router.push(item.href); setProfileOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all group"
                                    >
                                        <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </button>
                                ))}

                                <div className="h-px bg-stone-100 my-2 mx-2" />

                                <button
                                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                >
                                    <LogOut size={18} />
                                    <span className="text-sm font-bold">Disconnect</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}

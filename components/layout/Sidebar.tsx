"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { ChevronRight, LogOut } from "lucide-react";
import type { UserRole, CampusUser } from "@/lib/types";

type NavItem = { label: string; href: string; icon: any; roles: UserRole[]; badgeCount?: number };

interface SidebarProps {
    sidebarOpen: boolean;
    profile: CampusUser | null;
    filteredNav: NavItem[];
    handleLogout: () => Promise<void>;
    setMobileSidebarOpen: (open: boolean) => void;
}

const roleLabel: Record<UserRole, string> = {
    member: "Member", investor: "Investor", president: "President",
    treasurer: "Treasurer", secretary: "Secretary", boardMember: "Board Member",
};

export default function Sidebar({
    sidebarOpen,
    profile,
    filteredNav,
    handleLogout,
    setMobileSidebarOpen
}: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [activeHref, setActiveHref] = useState(pathname);

    // Sync activeHref with pathname when navigating via browser buttons
    useEffect(() => {
        setActiveHref(pathname);
    }, [pathname]);

    return (
        <motion.aside
            className={cn(
                "flex flex-col h-full bg-[#09090b] z-50",
                "shadow-[0_0_50px_rgba(0,0,0,0.5)] border-r border-stone-800 transition-all duration-500",
                sidebarOpen ? "w-[240px]" : "w-[76px]"
            )}
            initial={false}
        >
            {/* Logo Section */}
            <div className={cn(
                "px-6 py-8 flex items-center gap-4 relative", 
                !sidebarOpen && "justify-center px-0"
            )}>
                <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="absolute inset-0 bg-amber-500/10 rounded-xl blur-lg" />
                    <div className="relative w-full h-full bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center p-2 shadow-2xl">
                        <Image
                            src="/assets/icon.png"
                            alt="CampusLink"
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </div>
                </div>
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="min-w-0"
                        >
                            <h2 className="font-display text-white text-lg font-black tracking-tight leading-tight">
                                CAMPUS<span className="text-amber-500">LINK</span>
                            </h2>
                            <p className="text-stone-600 text-[8px] uppercase font-black tracking-[0.4em] mt-0.5 whitespace-nowrap">
                                ASSET MANAGEMENT
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Underline */}
                {sidebarOpen && (
                    <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-stone-800 via-stone-700 to-transparent" />
                )}
            </div>

            {/* Navigation Groups */}
            <nav className={cn(
                "flex-1 px-3 space-y-0.5 scrollbar-hide py-4",
                sidebarOpen ? "overflow-y-auto" : "overflow-hidden"
            )}>
                {filteredNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeHref === item.href || (
                        activeHref.startsWith(item.href + "/") && 
                        !filteredNav.some(other => other.href.length > item.href.length && activeHref.startsWith(other.href))
                    );
                    return (
                        <motion.button
                            key={item.href}
                            onClick={() => { 
                                setActiveHref(item.href);
                                router.push(item.href); 
                                setMobileSidebarOpen(false); 
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-500 relative group overflow-hidden",
                                isActive
                                    ? "bg-white text-stone-950 shadow-xl shadow-black/20"
                                    : "text-stone-500 hover:text-stone-200 hover:bg-white/5",
                                !sidebarOpen && "justify-center px-0 h-10 w-10 mx-auto"
                            )}
                            whileTap={{ scale: 0.96 }}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"
                                />
                            )}
                            <Icon size={18} className={cn("flex-shrink-0 transition-all duration-500", isActive ? "text-amber-500 scale-110" : "group-hover:text-amber-500 group-hover:scale-110")} />
                            <AnimatePresence>
                                {sidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }}
                                        className="truncate tracking-tight flex-1 text-left"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Badge */}
                            {item.badgeCount ? (
                                <div className={cn(
                                    "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-black shadow-sm ml-auto z-10 transition-colors",
                                    isActive 
                                        ? "bg-amber-500 text-white shadow-amber-500/20" 
                                        : "bg-red-500 text-white"
                                )}>
                                    {item.badgeCount}
                                </div>
                            ) : null}

                            {/* Active Dot */}
                            {isActive && sidebarOpen && !item.badgeCount && (
                                <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="ml-auto w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] z-10" />
                            )}
                        </motion.button>
                    );
                })}
            </nav>

            {/* Profile Section */}
            <div className="mx-3 mb-4 p-1 rounded-2xl bg-stone-900/30 border border-stone-800/30">
                {profile && (
                    <motion.div
                        onClick={() => { router.push("/profile"); setMobileSidebarOpen(false); }}
                        className={cn(
                            "flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all group",
                            pathname === "/profile" ? "bg-stone-800" : "hover:bg-stone-800/50",
                            !sidebarOpen && "flex-col justify-center gap-1 p-1.5"
                        )}
                    >
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-stone-800 to-stone-950 border border-stone-700
                              flex items-center justify-center text-white font-black text-sm shadow-2xl relative overflow-hidden group-hover:border-amber-500/50 transition-colors">
                                <span className="relative z-10">{profile.fullName.charAt(0)}</span>
                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.div
                                    className="min-w-0"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                >
                                    <p className="text-white text-[13px] font-black truncate tracking-tight group-hover:text-amber-400 transition-all">
                                        {profile.fullName.split(' ')[0]}
                                    </p>
                                    <p className="text-stone-600 text-[8px] font-black uppercase tracking-[0.2em] mt-0.5">
                                        {roleLabel[profile.role]}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Logout Button */}
                <motion.button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] mt-1",
                        "text-stone-600 hover:text-red-400 hover:bg-red-500/5 transition-all text-left",
                        !sidebarOpen && "justify-center p-0 h-9 w-9 mx-auto"
                    )}
                    whileTap={{ scale: 0.95 }}
                    title={!sidebarOpen ? "Logout" : undefined}
                >
                    <LogOut size={14} className="flex-shrink-0 transition-transform group-hover:rotate-12" />
                    {sidebarOpen && <span>Logout</span>}
                </motion.button>
            </div>
        </motion.aside>
    );
}

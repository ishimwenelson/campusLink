"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { 
  getProposals, getCampusInfo, getAllApprovedEmergencyRequests, getMeetings,
  subscribeToMarketListings
} from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Users, FileText, DollarSign,
  Bell, Moon, Sun, LogOut, Menu, X, ChevronRight,
  AlertCircle, Calendar, Vote, Shield, Wallet, Award, FolderGit2, ShoppingBag, History
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";

type NavItem = { label: string; href: string; icon: any; roles: UserRole[]; badgeCount?: number };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/investor", icon: TrendingUp, roles: ["investor"] },
  { label: "Overview", href: "/president", icon: Shield, roles: ["president"] },
  // Treasurer & President Accounting pages
  { label: "Overview", href: "/treasurer", icon: LayoutDashboard, roles: ["treasurer"] },
  { label: "Financials", href: "/treasurer/financials", icon: DollarSign, roles: ["treasurer", "president"] },
  { label: "Shareholders", href: "/treasurer/shareholders", icon: Users, roles: ["treasurer", "president"] },
  // Secretary sub-pages
  { label: "Overview", href: "/secretary", icon: LayoutDashboard, roles: ["secretary"] },
  { label: "Members", href: "/secretary/members", icon: Users, roles: ["secretary"] },
  { label: "Reports", href: "/secretary/reports", icon: FileText, roles: ["secretary"] },
  { label: "My Savings", href: "/member", icon: Wallet, roles: ["member", "investor", "president", "treasurer", "secretary", "boardMember"] },
  // Dividend pages
  { label: "Dividends", href: "/member/dividends", icon: Award, roles: ["member", "investor", "president", "treasurer", "secretary", "boardMember"] },
  { label: "Dividend Management", href: "/president/dividends", icon: Award, roles: ["president"] },
  // Projects & Proposals
  { label: "News in Campus", href: "/projects", icon: Vote, roles: ["member", "investor", "president", "treasurer", "secretary", "boardMember"] },

  { label: "Board", href: "/board", icon: Shield, roles: ["boardMember"] },
  { label: "Proposals", href: "/investor/proposals", icon: Vote, roles: ["investor", "president", "boardMember"] },
  { label: "Projects", href: "/investor/projects", icon: FolderGit2, roles: ["investor"] },
  { label: "Project Reviews", href: "/board/projects", icon: FolderGit2, roles: ["boardMember"] },
  { label: "Reports", href: "/investor/reports", icon: FileText, roles: ["investor"] },
  { label: "Meetings", href: "/board/meetings", icon: Calendar, roles: ["member", "investor", "president", "treasurer", "secretary", "boardMember"] },
  { label: "Emergency Requests", href: "/president/emergency", icon: AlertCircle, roles: ["president"] },
  { label: "Share Marketplace", href: "/member/market", icon: ShoppingBag, roles: ["member", "investor", "president", "treasurer", "secretary", "boardMember"] },
  { label: "Market History", href: "/admin/market-history", icon: History, roles: ["president", "treasurer", "secretary"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["member", "investor", "president", "treasurer", "secretary", "boardMember"] },
];

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import GlobalLoader from "@/components/layout/GlobalLoader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications(profile?.uid);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [projectBadgeCount, setProjectBadgeCount] = useState(0);
  const [emergencyBadgeCount, setEmergencyBadgeCount] = useState(0);
  const [meetingBadgeCount, setMeetingBadgeCount] = useState(0);
  const [marketBadgeCount, setMarketBadgeCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);

  // Optimize loader: Speed up simulation and finish immediately when ready
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadProgress(prev => {
          if (prev < 90) return prev + Math.random() * 10; // Faster steps
          return prev;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/auth/login");
    }
  }, [loading, profile]);

  useEffect(() => {
    if (!profile) return;
    
    const fetchCounts = async () => {
      try {
        const [proposals, campusInfo, meetings] = await Promise.all([
          getProposals(),
          getCampusInfo(),
          getMeetings()
        ]);

        // 1. Project/Proposals Count
        const activeProposals = proposals.filter((p: any) => p.status === 'active' || p.status === 'pending').length;
        const publishedInfo = campusInfo.filter((i: any) => i.status === 'published').length;
        setProjectBadgeCount(activeProposals + publishedInfo);

        // 2. Meetings Count
        const activeMeetings = meetings.filter((m) => {
          const isInvited = m.invitedRoles?.includes(profile.role);
          const isActive = m.status === 'planned' || m.status === 'ongoing';
          return isInvited && isActive;
        });
        setMeetingBadgeCount(activeMeetings.length);

        // 3. Emergency Count (Admin only)
        if (profile.role === 'treasurer' || profile.role === 'president') {
          const reqs = await getAllApprovedEmergencyRequests();
          setEmergencyBadgeCount(reqs.length);
        }
      } catch (err) {
        console.error("Error fetching badge counts:", err);
      }
    };

    fetchCounts();

    // Subscribe to market listings for real-time badge
    const unsubMarket = subscribeToMarketListings((listings) => {
      setMarketBadgeCount(listings.length);
    });

    return () => {
      unsubMarket();
    };
  }, [profile]);

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/auth/login");
    toast.success("Logged out successfully");
  };

  const filteredNav = useMemo(() => {
    if (!profile) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(profile.role)).map((item) => {
      if (item.href === "/projects" && projectBadgeCount > 0) {
        return { ...item, badgeCount: projectBadgeCount };
      }
      if (item.href === "/treasurer/financials" && emergencyBadgeCount > 0) {
        return { ...item, badgeCount: emergencyBadgeCount };
      }
      if (item.href === "/board/meetings" && meetingBadgeCount > 0) {
        return { ...item, badgeCount: meetingBadgeCount };
      }
      if (item.href === "/member/market" && marketBadgeCount > 0) {
        return { ...item, badgeCount: marketBadgeCount };
      }
      return item;
    });
  }, [profile, projectBadgeCount, emergencyBadgeCount, meetingBadgeCount, marketBadgeCount]);

  if (loading) {
    return <GlobalLoader progress={loadProgress} />;
  }

  return (
    <div className={cn("flex h-screen overflow-hidden", darkMode ? "bg-stone-950 dark" : "bg-stone-50")}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 relative z-50 print:hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          profile={profile}
          filteredNav={filteredNav}
          handleLogout={handleLogout}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            <motion.div
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-60"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sidebar
                sidebarOpen={true}
                profile={profile}
                filteredNav={filteredNav}
                handleLogout={handleLogout}
                setMobileSidebarOpen={setMobileSidebarOpen}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="print:hidden">
          <Navbar
            profile={profile}
            unreadCount={unreadCount}
            notifications={notifications}
            markRead={markRead}
            setMobileSidebarOpen={setMobileSidebarOpen}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            navItems={filteredNav}
          />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative p-2 lg:p-4 scrollbar-hide print:p-0 print:overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

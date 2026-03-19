"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, TrendingUp, Shield, Users, ArrowRight, Lock, Mail, ChevronRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import GlobalLoader from "@/components/layout/GlobalLoader";

const ROLE_ROUTES: Record<string, string> = {
  member: "/member",
  investor: "/investor",
  president: "/president",
  treasurer: "/treasurer",
  secretary: "/secretary",
  boardMember: "/board",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadProgress(prev => (prev < 95 ? prev + Math.random() * 10 : prev));
    }, 200);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUser(user.uid);
          if (profile) {
            
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: user.uid, role: profile.role }),
            });

            setLoadProgress(100);
            setTimeout(() => {
              router.push(ROLE_ROUTES[profile.role] || "/member");
            }, 500);
            return;
          }
        } catch (err) {
          console.error("Session sync failed:", err);
        }
      }
      setInitialLoading(false);
      clearInterval(timer);
    });

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadProgress(0);

    
    const timer = setInterval(() => {
      setLoadProgress(prev => (prev < 90 ? prev + 5 : prev));
    }, 100);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUser(cred.user.uid);
      if (!profile) throw new Error("Profile not found");

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: cred.user.uid, role: profile.role }),
      });

      setLoadProgress(100);
      toast.success(`Welcome back, ${profile.fullName}!`);

      setTimeout(() => {
        if (!profile.passwordChanged) {
          router.push("/auth/change-password");
        } else {
          router.push(ROLE_ROUTES[profile.role] || "/member");
        }
      }, 800);
    } catch (err: any) {
      clearInterval(timer);
      setLoading(false);
      toast.error("Invalid credentials or network error.");
    }
  };

  if (initialLoading || (loading && loadProgress > 0)) {
    return <GlobalLoader progress={loadProgress} message={loading ? "Authenticating Identity..." : "CampusLink Investment Acc."} />;
  }

  return (
    <div className="min-h-screen flex bg-stone-950 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {}
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-16 relative z-10 border-r border-stone-800/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <Image src="/assets/logo.png" alt="CampusLink" width={240} height={60} className="object-contain brightness-110 shadow-2xl" />
        </motion.div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Global Investment Network</span>
            </div>
            <h1 className="text-6xl font-black text-white leading-none tracking-tighter">
              Institutional <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 animate-gradient-x">Equity Control</span>
            </h1>
            <p className="text-stone-400 text-lg max-w-md font-medium leading-relaxed">
              Connect to Rwanda's premier student-led investment institution. Manage your shares, track dividends, and secure your future.
            </p>
          </motion.div>
        </div>

        <div className="flex items-center gap-6 text-[10px] font-black text-stone-600 uppercase tracking-[0.3em]">
          <span>© CampusLink Investment Association Software</span>
        </div>
      </div>

      
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 bg-gradient-to-l from-stone-900/20 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          
          <div className="lg:hidden mb-12 flex flex-col items-center">
            <Image src="/assets/icon.png" alt="CampusLink" width={100} height={100} className="mb-4 drop-shadow-2xl" />
            <h2 className="text-white font-black text-2xl uppercase tracking-tighter">CampusLink Portal</h2>
          </div>

          <div className="relative group">
            
            <div className="relative bg-stone-900/60 backdrop-blur-3xl border border-stone-800/80 rounded-[32px] p-8 lg:p-10 lg:pt-8 overflow-hidden shadow-2xl">
              <div className="mb-6">
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2">Authenticated Access</div>
                <h2 className="text-3xl font-black text-white tracking-tight">System Login</h2>
                <div className="w-12 h-1 bg-amber-500 mt-4 rounded-full" />
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail size={10} className="text-amber-500" />
                    Registry Email
                  </label>
                  <div className="relative group/input">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-950/50 border border-stone-800 rounded-[22px] px-5 py-3 text-stone-100 placeholder:text-stone-700 outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all duration-300 font-medium text-sm"
                      placeholder="n.mudenge@campuslink.rw"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Lock size={10} className="text-amber-500" />
                    Security Key
                  </label>
                  <div className="relative group/input">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-950/50 border border-stone-800 rounded-[22px] px-5 py-3 text-stone-100 placeholder:text-stone-700 outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all duration-300 font-medium text-sm"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-white transition-colors"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-4 h-4 border border-stone-700 rounded bg-stone-950 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all" />
                      <ChevronRight size={10} className="absolute text-stone-950 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Stay Active</span>
                  </label>
                  <button type="button" className="text-[10px] font-black text-amber-500 uppercase tracking-wider hover:text-amber-400 transition-colors">
                    Reset Key
                  </button>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01, translateY: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative group/btn"
                >
                  <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                  <div className="relative bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-[0.2em] py-5 rounded-full flex items-center justify-center gap-3 overflow-hidden shadow-xl">
                    <span>Initialize Portal Session</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </form>

            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}

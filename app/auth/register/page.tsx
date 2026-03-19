"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, UserPlus, ChevronRight,
  ArrowLeft, CheckCircle2, Crown, DollarSign,
  Users, FileText, Briefcase, Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";
import { BUSINESS_RULES } from "@/lib/types";

// ── Role definitions with icons & colors ───────────────────────────
const ROLES: {
  value: UserRole;
  label: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
}[] = [
  {
    value: "secretary",
    label: "Secretary",
    description: "Registers members, manages documents & directory",
    icon: Users,
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
  },
  {
    value: "president",
    label: "President",
    description: "Full system access, approves emergency requests",
    icon: Crown,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  {
    value: "treasurer",
    label: "Treasurer",
    description: "Financial overview, reports & fund management",
    icon: DollarSign,
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  {
    value: "boardMember",
    label: "Board Member",
    description: "Creates & manages board meetings and agendas",
    icon: Briefcase,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    value: "investor",
    label: "Investor",
    description: "Creates proposals, votes on investment decisions",
    icon: Shield,
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-200",
  },
  {
    value: "member",
    label: "Member",
    description: "Tracks payments, requests emergency cash, downloads certificate",
    icon: FileText,
    color: "text-stone-700",
    bg: "bg-stone-50 border-stone-200",
  },
];

const ROLE_ROUTES: Record<UserRole, string> = {
  member: "/member",
  investor: "/investor",
  president: "/president",
  treasurer: "/treasurer",
  secretary: "/secretary",
  boardMember: "/board",
};

// Steps
type Step = "role" | "info" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Form fields
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalID: "",
    password: "",
    confirmPassword: "",
    totalShareValue: BUSINESS_RULES.MIN_SHARE_VALUE,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdName, setCreatedName] = useState("");

  // ── Handle registration ───────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.totalShareValue < BUSINESS_RULES.MIN_SHARE_VALUE) {
      toast.error(`Minimum share value is ${BUSINESS_RULES.MIN_SHARE_VALUE.toLocaleString()} RF`);
      return;
    }

    setLoading(true);
    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      await updateProfile(cred.user, { displayName: form.fullName });

      // 2. Create Firestore profile
      await setDoc(doc(db, "users", cred.user.uid), {
        email: form.email,
        role: selectedRole,
        fullName: form.fullName,
        phone: form.phone,
        nationalID: form.nationalID,
        createdAt: new Date().toISOString(),
        totalShareValue: form.totalShareValue,
        paidSoFar: 0,
        emergencyTaken: 0,
        interestOwed: 0,
        isActive: true,
        passwordChanged: true,   // already set their own password
        documentsUploaded: false,
      });

      // 3. Set session cookie
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: cred.user.uid, role: selectedRole }),
      });

      setCreatedName(form.fullName.split(" ")[0]);
      setStep("done");
      toast.success(`Account created for ${form.fullName} 🎉`);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Please login.");
      } else {
        toast.error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    if (selectedRole) router.push(ROLE_ROUTES[selectedRole]);
  };

  const updateForm = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-pattern-subtle">
      {/* ── Left panel ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 p-12 relative overflow-hidden"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-yellow-500/8 blur-2xl" />

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Image src="/assets/logo.png" alt="CampusLink" width={260} height={74} className="object-contain" />
        </motion.div>

        <motion.div
          className="space-y-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <h1 className="font-display text-4xl text-white leading-tight mb-3">
              Join the Investment Community
            </h1>
            <p className="text-stone-300 text-base leading-relaxed">
              Create your account to start managing your shares, tracking payments,
              and growing together with fellow members.
            </p>
          </div>

          {/* Progress steps */}
          <div className="space-y-3">
            {[
              { label: "Choose your role", done: step !== "role" || selectedRole !== null },
              { label: "Fill in your details", done: step === "done" },
              { label: "Access your dashboard", done: step === "done" },
            ].map(({ label, done }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${done ? "bg-amber-500 text-white" : "bg-amber-900/40 text-amber-400 border border-amber-700"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-sm ${done ? "text-white" : "text-stone-400"}`}>{label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-800/30">
            <p className="text-amber-300 text-sm font-semibold mb-1">⚠️ Dev / Testing Mode</p>
            <p className="text-stone-400 text-xs leading-relaxed">
              This signup page is for initial setup & testing. In production,
              only the Secretary registers new members through their dashboard.
            </p>
          </div>
        </motion.div>

        <p className="text-stone-600 text-xs">© 2025 CampusLink Investment Association</p>
      </motion.div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-xl py-6">

          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <Image src="/assets/icon.png" alt="" width={64} height={64} className="mx-auto mb-2 object-contain" />
            <h2 className="font-display text-xl text-gradient-gold">CampusLink Investment</h2>
          </div>

          <AnimatePresence mode="wait">

            {/* ─── STEP 1: Choose role ─── */}
            {step === "role" && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="font-display text-3xl text-stone-900 mb-1">Create Account</h2>
                  <p className="text-stone-500 text-sm">First, select the role you're registering for</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {ROLES.map(({ value, label, description, icon: Icon, color, bg }) => (
                    <motion.button
                      key={value}
                      onClick={() => setSelectedRole(value)}
                      className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200
                        ${selectedRole === value
                          ? `${bg} border-current ring-2 ring-offset-1 ring-amber-400`
                          : "bg-white border-stone-100 hover:border-amber-200 hover:shadow-sm"
                        }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                          ${selectedRole === value ? `${bg.replace("border-", "")} ${color}` : "bg-amber-50 text-amber-600"}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${selectedRole === value ? color : "text-stone-800"}`}>
                            {label}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>
                        </div>
                      </div>
                      {selectedRole === value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full
                                     flex items-center justify-center"
                        >
                          <CheckCircle2 size={12} className="text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => selectedRole && setStep("info")}
                  disabled={!selectedRole}
                  className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.98 }}
                >
                  Continue as {selectedRole ? ROLES.find(r => r.value === selectedRole)?.label : "..."}
                  <ChevronRight size={18} />
                </motion.button>

                <p className="text-center text-sm text-stone-400 mt-5">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-amber-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ─── STEP 2: Fill in details ─── */}
            {step === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Role badge + back */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setStep("role")}
                    className="p-2 rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    <ArrowLeft size={18} className="text-stone-500" />
                  </button>
                  <div>
                    <h2 className="font-display text-2xl text-stone-900">Your Details</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-stone-400 text-xs">Registering as</span>
                      {(() => {
                        const r = ROLES.find(r => r.value === selectedRole)!;
                        const Icon = r.icon;
                        return (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${r.bg} ${r.color}`}>
                            <Icon size={10} /> {r.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={e => updateForm("fullName", e.target.value)}
                      placeholder="e.g. Jean Pierre Habimana"
                      required
                      className="input-gold"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => updateForm("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="input-gold"
                    />
                  </div>

                  {/* Phone + National ID side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-stone-700 block mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => updateForm("phone", e.target.value)}
                        placeholder="+250 7XX XXX XXX"
                        className="input-gold"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-stone-700 block mb-1.5">National ID</label>
                      <input
                        type="text"
                        value={form.nationalID}
                        onChange={e => updateForm("nationalID", e.target.value)}
                        placeholder="1 XXXX X XXXXXXX X XX"
                        className="input-gold"
                      />
                    </div>
                  </div>

                  {/* Share value — only for member/investor roles */}
                  {(selectedRole === "member" || selectedRole === "investor") && (
                    <div>
                      <label className="text-sm font-medium text-stone-700 block mb-1.5">
                        Total Share Value (RF) *
                      </label>
                      <input
                        type="number"
                        value={form.totalShareValue}
                        onChange={e => updateForm("totalShareValue", Number(e.target.value))}
                        min={400000}
                        step={1000}
                        required
                        className="input-gold"
                      />
                      <p className="text-xs text-stone-400 mt-1">
                        Minimum 400,000 RF · {(form.totalShareValue / 1000).toFixed(0)} shares
                        · Annual target: {(form.totalShareValue * 0.2).toLocaleString()} RF/year
                      </p>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={e => updateForm("password", e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        className="input-gold pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-600"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Confirm Password *</label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => updateForm("confirmPassword", e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className={`input-gold ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? "border-red-400 focus:ring-red-300"
                          : ""
                      }`}
                    />
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading
                      ? <><Loader2 className="animate-spin" size={18} /> Creating account...</>
                      : <><UserPlus size={18} /> Create Account</>
                    }
                  </motion.button>

                  <p className="text-center text-xs text-stone-400">
                    Already registered?{" "}
                    <Link href="/auth/login" className="text-amber-600 font-semibold hover:underline">
                      Sign in instead
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 3: Success ─── */}
            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-600 
                             rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200"
                >
                  <CheckCircle2 size={48} className="text-white" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h2 className="font-display text-4xl text-stone-900 mb-2">
                    Welcome, {createdName}! 🎉
                  </h2>
                  <p className="text-stone-500 mb-2">
                    Your account has been created as{" "}
                    <strong className="text-amber-700">
                      {ROLES.find(r => r.value === selectedRole)?.label}
                    </strong>.
                  </p>
                  {selectedRole === "secretary" && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-left mt-4 mb-6">
                      <p className="text-violet-800 font-semibold text-sm mb-1">🗂️ Secretary Access Granted</p>
                      <p className="text-violet-600 text-sm">
                        You can now register other members from your dashboard.
                        Go to <strong>Member Management</strong> and use the
                        <strong> "Register Member"</strong> button to create members
                        and assign their roles.
                      </p>
                    </div>
                  )}
                  <motion.button
                    onClick={goToDashboard}
                    className="btn-gold flex items-center justify-center gap-2 mx-auto px-10"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to My Dashboard <ChevronRight size={18} />
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

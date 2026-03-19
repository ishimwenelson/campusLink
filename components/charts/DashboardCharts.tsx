"use client";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target,
  Activity, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Award, Wallet, FileText, AlertCircle, CheckCircle, Clock
} from "lucide-react";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { Proposal, CampusUser, Meeting } from "@/lib/types";

// Chart Types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryData {
  category: string;
  amount: number;
  count?: number;
  percentage?: number;
}

// Flexible data interfaces to handle different chart data formats
export interface FlexibleChartData {
  name?: string;
  category?: string;
  amount: number;
  value?: number;
  count?: number;
  percentage?: number;
  [key: string]: any;
}

// Color Palette
const COLORS = {
  primary: "#f59e0b",
  secondary: "#10b981", 
  tertiary: "#3b82f6",
  quaternary: "#ef4444",
  quinary: "#8b5cf6",
  gray: "#6b7280",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6"
};

const CHART_COLORS = [
  "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

// Component Props
interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

// Base Chart Card Component
export function ChartCard({ title, subtitle, icon, children, trend, className = "" }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-lg transition-shadow p-4 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-widest leading-none mb-1">{title}</h3>
            {subtitle && <p className="text-[9px] text-stone-500 font-medium uppercase tracking-wider leading-none">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${
            trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// Line Chart Component
export function CustomLineChart({ data, dataKey, height = 300 }: { 
  data: any[]; 
  dataKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "white", 
            border: "1px solid #e5e7eb", 
            borderRadius: "8px",
            fontSize: "12px"
          }}
          formatter={(value: any) => [formatRF(value), "Amount"]}
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={COLORS.primary}
          strokeWidth={3}
          dot={{ fill: COLORS.primary, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Area Chart Component
export function CustomAreaChart({ data, dataKey, height = 300 }: { 
  data: any[]; 
  dataKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "white", 
            border: "1px solid #e5e7eb", 
            borderRadius: "8px",
            fontSize: "12px"
          }}
          formatter={(value: any) => [formatRF(value), "Amount"]}
        />
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={COLORS.primary}
          fill={COLORS.primary}
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Bar Chart Component
export function CustomBarChart({ data, dataKey, height = 300 }: { 
  data: any[]; 
  dataKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "white", 
            border: "1px solid #e5e7eb", 
            borderRadius: "8px",
            fontSize: "12px"
          }}
          formatter={(value: any) => [formatRF(value), "Amount"]}
        />
        <Bar dataKey={dataKey} fill={COLORS.primary} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
export function CustomPieChart({ data, height = 300 }: { 
  data: any[]; 
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage, category }) => `${name || category} ${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "white", 
            border: "1px solid #e5e7eb", 
            borderRadius: "8px",
            fontSize: "12px"
          }}
          formatter={(value: any) => [formatRF(value), "Amount"]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Radial Chart Component
export function CustomRadialChart({ data, height = 300 }: { 
  data: { name: string; value: number; fill: string }[]; 
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data}>
        <RadialBar dataKey="value" cornerRadius={10} fill={COLORS.primary} />
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "white", 
            border: "1px solid #e5e7eb", 
            borderRadius: "8px",
            fontSize: "12px"
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

// Member Dashboard Charts
export function MemberDashboardCharts({ memberData }: { memberData: any }) {
  const savingsData = [
    { month: "Jan", amount: 50000 },
    { month: "Feb", amount: 75000 },
    { month: "Mar", amount: 95000 },
    { month: "Apr", amount: 120000 },
    { month: "May", amount: 145000 },
    { month: "Jun", amount: 180000 }
  ];

  const dividendData = [
    { quarter: "Q1", amount: 5000 },
    { quarter: "Q2", amount: 7500 },
    { quarter: "Q3", amount: 12000 },
    { quarter: "Q4", amount: 15000 }
  ];

  const portfolioData = [
    { name: "Savings", amount: 180000, percentage: 60 },
    { name: "Dividends", amount: 40000, percentage: 13 },
    { name: "Returns", amount: 80000, percentage: 27 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Savings Growth"
        subtitle="Monthly contribution trend"
        icon={<Wallet className="text-amber-600" size={20} />}
        trend={{ value: 12, isPositive: true, label: "vs last month" }}
      >
        <CustomAreaChart data={savingsData} dataKey="amount" />
      </ChartCard>

      <ChartCard
        title="Dividend History"
        subtitle="Quarterly dividend payments"
        icon={<Award className="text-amber-600" size={20} />}
        trend={{ value: 25, isPositive: true, label: "vs last quarter" }}
      >
        <CustomBarChart data={dividendData} dataKey="amount" />
      </ChartCard>

      <ChartCard
        title="Portfolio Distribution"
        subtitle="Your investment breakdown"
        icon={<PieChartIcon className="text-amber-600" size={20} />}
      >
        <CustomPieChart data={portfolioData} />
      </ChartCard>

      <ChartCard
        title="5-Year Progress"
        subtitle="Investment growth projection"
        icon={<Target className="text-amber-600" size={20} />}
      >
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-600 mb-2">60%</div>
            <div className="text-sm text-stone-600">Complete</div>
            <div className="w-full bg-stone-200 rounded-full h-2 mt-4">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// President Dashboard Charts
export function PresidentDashboardCharts({ presidentData }: { presidentData: any }) {
  const revenueData = [
    { month: "Jan", amount: 2500000 },
    { month: "Feb", amount: 2800000 },
    { month: "Mar", amount: 3200000 },
    { month: "Apr", amount: 2900000 },
    { month: "May", amount: 3500000 },
    { month: "Jun", amount: 3800000 }
  ];

  const memberGrowthData = [
    { month: "Jan", count: 120 },
    { month: "Feb", count: 135 },
    { month: "Mar", count: 142 },
    { month: "Apr", count: 158 },
    { month: "May", count: 165 },
    { month: "Jun", count: 178 }
  ];

  const departmentData = [
    { name: "Operations", amount: 1200000, percentage: 32 },
    { name: "Development", amount: 900000, percentage: 24 },
    { name: "Marketing", amount: 600000, percentage: 16 },
    { name: "Admin", amount: 1100000, percentage: 28 }
  ];

  const performanceData = [
    { name: "Revenue", value: 85, fill: COLORS.primary },
    { name: "Growth", value: 72, fill: COLORS.secondary },
    { name: "Efficiency", value: 91, fill: COLORS.tertiary }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Revenue Trend"
        subtitle="Monthly revenue performance"
        icon={<DollarSign className="text-amber-600" size={20} />}
        trend={{ value: 8, isPositive: true, label: "vs last month" }}
      >
        <CustomLineChart data={revenueData} dataKey="amount" />
      </ChartCard>

      <ChartCard
        title="Member Growth"
        subtitle="New members per month"
        icon={<Users className="text-amber-600" size={20} />}
        trend={{ value: 15, isPositive: true, label: "vs last month" }}
      >
        <CustomAreaChart data={memberGrowthData.map(d => ({ ...d, amount: d.count }))} dataKey="amount" />
      </ChartCard>

      <ChartCard
        title="Department Budget"
        subtitle="Budget allocation by department"
        icon={<BarChart3 className="text-amber-600" size={20} />}
      >
        <CustomPieChart data={departmentData} />
      </ChartCard>

      <ChartCard
        title="Performance Metrics"
        subtitle="Key performance indicators"
        icon={<Activity className="text-amber-600" size={20} />}
      >
        <CustomRadialChart data={performanceData} />
      </ChartCard>
    </div>
  );
}

// Treasurer Dashboard Charts
export function TreasurerDashboardCharts({ treasurerData }: { treasurerData: { members: any[] } }) {
  const { members } = treasurerData;

  // Real Cash Flow Analysis (Saving trends)
  const currentYearVal = new Date().getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const cashFlowData = months.map((month, index) => {
    let totals = 0;
    members.forEach(m => {
      m.payments?.forEach((p: any) => {
        const pDate = new Date(p.date);
        if (pDate.getFullYear() === currentYearVal && pDate.getMonth() === index && p.status === 'completed') {
          totals += p.amount;
        }
      });
    });
    return { month, amount: totals };
  }).slice(0, new Date().getMonth() + 1);

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-5 h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
          <TrendingUp size={16} />
        </div>
        <div>
          <p className="font-black text-stone-900 text-sm tracking-tight">Institutional Cash Flow</p>
          <p className="text-[10px] text-stone-400 font-medium">Monthly saving intake</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashFlowData} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickMargin={8}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #f1f5f9", 
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                fontSize: "11px"
              }}
              formatter={(value: any) => [formatRF(value), "Intake"]}
            />
            <Area 
              type="natural" 
              dataKey="amount" 
              stroke="#f59e0b" 
              fill="url(#fillCash)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ShareDistributionChart({ members }: { members: any[] }) {
  const distributionRanges = [
    { label: "0 - 100K", min: 0, max: 100000 },
    { label: "100K - 1M", min: 100001, max: 1000000 },
    { label: "1M - 5M", min: 1000001, max: 5000000 },
    { label: "5M - 10M", min: 5000001, max: 10000000 },
    { label: "10M+", min: 10000001, max: Infinity },
  ];

  const data = distributionRanges.map(range => ({
    name: range.label,
    count: members.filter(m => m.paidSoFar >= range.min && m.paidSoFar <= range.max).length
  }));

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-200">
          <Users size={16} />
        </div>
        <div>
          <p className="font-black text-stone-900 text-sm tracking-tight">Member Share Distribution</p>
          <p className="text-[10px] text-stone-400 font-medium">Institutional stake breakdown by savings volume</p>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickMargin={8}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickMargin={8}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #f1f5f9", 
                borderRadius: "12px",
                fontSize: "11px"
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Secretary Dashboard Charts
export function SecretaryDashboardCharts({ secretaryData }: { secretaryData: any }) {
  const meetingData = [
    { month: "Jan", attended: 45, total: 50 },
    { month: "Feb", attended: 48, total: 52 },
    { month: "Mar", attended: 50, total: 55 },
    { month: "Apr", attended: 52, total: 58 },
    { month: "May", attended: 55, total: 60 },
    { month: "Jun", attended: 58, total: 62 }
  ];

  const documentData = [
    { type: "Minutes", count: 120 },
    { type: "Reports", count: 85 },
    { type: "Contracts", count: 45 },
    { type: "Policies", count: 32 },
    { type: "Other", count: 28 }
  ];

  const roleDistributionData = [
    { name: "Members", count: 145, percentage: 65 },
    { name: "Investors", count: 35, percentage: 16 },
    { name: "Board Members", count: 25, percentage: 11 },
    { name: "Staff", count: 18, percentage: 8 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Meeting Attendance"
        subtitle="Monthly attendance trends"
        icon={<Calendar className="text-amber-600" size={20} />}
        trend={{ value: 5, isPositive: true, label: "vs last month" }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={meetingData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #e5e7eb", 
                borderRadius: "8px",
                fontSize: "12px"
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="attended" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} />
            <Area type="monotone" dataKey="total" stackId="2" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Document Management"
        subtitle="Documents by type"
        icon={<FileText className="text-amber-600" size={20} />}
      >
        <CustomBarChart data={documentData} dataKey="count" />
      </ChartCard>

      <ChartCard
        title="Member Distribution"
        subtitle="Members by role type"
        icon={<Users className="text-amber-600" size={20} />}
      >
        <CustomPieChart data={roleDistributionData.map(d => ({ ...d, amount: d.count, percentage: d.percentage }))} />
      </ChartCard>

      <ChartCard
        title="Communication Stats"
        subtitle="Monthly communication metrics"
        icon={<Activity className="text-amber-600" size={20} />}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-600">Emails Sent</span>
            <span className="text-sm font-medium text-amber-600">1,245</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-600">Notifications</span>
            <span className="text-sm font-medium text-blue-600">856</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-600">Reports Generated</span>
            <span className="text-sm font-medium text-green-600">124</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-600">Meetings Scheduled</span>
            <span className="text-sm font-medium text-purple-600">18</span>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// Board Member Dashboard Charts
export function BoardMemberDashboardCharts({ boardData }: { boardData: { proposals: Proposal[], members: CampusUser[], meetings: Meeting[] } }) {
  const { proposals, members, meetings } = boardData;

  // ─── Real data transformation for Governance Performance (Attendance by Role) ───
  // Map internal roles to display names
  const roleMapping: Record<string, string> = {
    secretary: "Secretariat",
    treasurer: "Treasury",
    president: "Presidential Office",
    boardMember: "Board Council",
    investor: "Investor Relations",
  };

  const completedMeetings = meetings.filter(m => m.status === "completed" || m.status === "ongoing");
  
  const committeeData = Object.entries(roleMapping).map(([role, name]) => {
    const roleMembers = members.filter(m => m.role === role);
    if (roleMembers.length === 0 || completedMeetings.length === 0) {
      return { name, efficiency: 80 }; // Fallback
    }

    let totalPossibleAttendances = 0;
    let actualAttendances = 0;

    completedMeetings.forEach(meeting => {
      // Check if this role was even invited to the meeting
      if (meeting.invitedRoles?.includes(role as any)) {
        totalPossibleAttendances += roleMembers.length;
        // Count how many members of this role were in the attendees list
        const attendeesOfThisRole = meeting.attendees?.filter((uid: string) => 
          roleMembers.some(rm => rm.uid === uid)
        ).length || 0;
        actualAttendances += attendeesOfThisRole;
      }
    });

    const efficiency = totalPossibleAttendances > 0 
      ? Math.round((actualAttendances / totalPossibleAttendances) * 100) 
      : 80;

    return { name, efficiency };
  });

  // Real data transformation for Proposal Activity (Monthly)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  const yearToDisplay = new Date().getFullYear();

  const proposalActivity = months.map((month, index) => {
    const monthProposals = proposals.filter(p => {
      const date = new Date(p.proposedAt);
      return date.getMonth() === index && date.getFullYear() === yearToDisplay;
    });

    return {
      month,
      approved: monthProposals.filter(p => p.status === "approved").length,
      rejected: monthProposals.filter(p => p.status === "rejected").length,
      pending: monthProposals.filter(p => p.status === "active" || p.status === "pending" || p.status === "under_review").length
    };
  }).slice(0, currentMonthIdx + 1);

  // Real data transformation for Decision Distribution
  const approvedCount = proposals.filter(p => p.status === "approved").length;
  const rejectedCount = proposals.filter(p => p.status === "rejected").length;
  const pendingCount = proposals.filter(p => p.status === "active" || p.status === "pending" || p.status === "under_review").length;
  const total = proposals.length || 1;

  const votingData = [
    { name: `Approved(${approvedCount})`, value: approvedCount, fill: COLORS.success, percentage: Math.round((approvedCount / total) * 100) },
    { name: `Rejected(${rejectedCount})`, value: rejectedCount, fill: COLORS.danger, percentage: Math.round((rejectedCount / total) * 100) },
    { name: `Pending(${pendingCount})`, value: pendingCount, fill: COLORS.warning, percentage: Math.round((pendingCount / total) * 100) }
  ];

  // Default fallback if no data
  if (votingData.length === 0) {
    votingData.push({ name: "No Data", value: 1, fill: COLORS.gray, percentage: 0 });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <ChartCard
        title="Proposal Activity"
        subtitle="Monthly decision tracking"
        icon={<FileText className="text-amber-600" size={20} />}
        trend={{ value: 15, isPositive: true, label: "approval rate" }}
        className="lg:col-span-3"
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={proposalActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="fillRejected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.1} />
                <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickMargin={8}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickMargin={8}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #f1f5f9", 
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                fontSize: "11px"
              }}
            />
            <Area 
              type="monotone" 
              dataKey="approved" 
              stroke={COLORS.success} 
              fill="url(#fillApproved)" 
              strokeWidth={3} 
              stackId="1"
            />
            <Area 
              type="monotone" 
              dataKey="rejected" 
              stroke={COLORS.danger} 
              fill="url(#fillRejected)" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              stackId="2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Decision Split"
        subtitle="Outcome distribution"
        icon={<PieChartIcon className="text-amber-600" size={20} />}
        className="lg:col-span-1"
      >
        <div className="h-[300px] flex flex-col">
          <ResponsiveContainer width="100%" height="75%">
            <PieChart>
              <Pie
                data={votingData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
              >
                {votingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #f1f5f9", 
                  borderRadius: "12px",
                  fontSize: "10px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 px-2">
            {votingData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-[8px] font-black text-stone-600 uppercase tracking-widest">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Governance Performance"
        subtitle="Role-based efficiency"
        icon={<TrendingUp className="text-amber-600" size={20} />}
        className="lg:col-span-2"
      >
        <div className="space-y-4">
          {committeeData.map((committee, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <div className="text-[9px] font-black text-stone-900 uppercase tracking-widest leading-none">{committee.name}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-stone-100 rounded-full h-1.5 border border-stone-200/50">
                  <div 
                    className="bg-amber-500 h-full rounded-full shadow-sm" 
                    style={{ width: `${committee.efficiency}%` }} 
                  />
                </div>
                <span className="text-[10px] font-black text-stone-900">{committee.efficiency}%</span>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard
        title="Governance Metrics"
        subtitle="Institutional benchmarks"
        icon={<Activity className="text-amber-600" size={20} />}
        className="lg:col-span-2"
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Meeting Attendance", value: "92%", color: "bg-green-50 text-green-600 border-green-100" },
            { label: "Quorum Achievement", value: "85%", color: "bg-blue-50 text-blue-600 border-blue-100" },
            { label: "Decision Speed", value: "78%", color: "bg-amber-50 text-amber-600 border-amber-100" },
            { label: "Compliance Rate", value: "95%", color: "bg-purple-50 text-purple-600 border-purple-100" },
          ].map((m) => (
            <div key={m.label} className={`text-center p-4 rounded-2xl border ${m.color}`}>
              <div className="text-2xl font-black tracking-tighter">{m.value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

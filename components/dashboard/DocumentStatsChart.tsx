"use client"

import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"
import { FileText } from "lucide-react"
import type { CampusUser } from "@/lib/types"

interface Props {
  members: CampusUser[];
}

const COLORS = ["#10b981", "#ef4444"]

export function DocumentStatsChart({ members }: Props) {
  const { chartData, stats } = useMemo(() => {
    const uploaded = members.filter(m => m.documentsUploaded).length
    const pending = members.length - uploaded
    const percentage = members.length > 0 ? Math.round((uploaded / members.length) * 100) : 0
    return {
      chartData: [
        { name: "Verified", value: uploaded },
        { name: "Missing", value: pending },
      ],
      stats: { percentage },
    }
  }, [members])

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-3 h-full flex flex-col gap-2">
      {}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-200">
          <FileText size={14} />
        </div>
        <div>
          <p className="font-black text-stone-900 text-xs tracking-tight">Documentation Status</p>
          <p className="text-[9px] text-stone-400 font-medium">Verification overview</p>
        </div>
      </div>

      {}
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
                fontSize: "11px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={(value) => (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Completion</span>
          <span className="text-[9px] font-black text-blue-600">{stats.percentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

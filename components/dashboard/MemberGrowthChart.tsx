"use client"

import { TrendingUp, Users } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useMemo } from "react"
import { format } from "date-fns"
import type { CampusUser } from "@/lib/types"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface Props {
  members: CampusUser[];
}

export function MemberGrowthChart({ members }: Props) {
  const chartData = useMemo(() => {
    if (!members.length) return [];
    
    const now = new Date();
    const data: Record<string, number> = {};
    
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = format(d, "MMMM");
      data[key] = 0;
    }

    members.forEach((member) => {
      const date = new Date(member.createdAt as string);
      if (isNaN(date.getTime())) return;
      
      const key = format(date, "MMMM");
      if (data[key] !== undefined) {
        data[key]++;
      }
    });

    return Object.entries(data).map(([month, count]) => ({
      month,
      count
    }));
  }, [members]);

  const chartConfig = {
    count: {
      label: "Members",
      color: "#f59e0b",
    },
  } satisfies ChartConfig

  const latestMonth = chartData[chartData.length - 1]?.count || 0;
  const prevMonth = chartData[chartData.length - 2]?.count || 0;
  const growth = prevMonth === 0 ? 100 : Math.round(((latestMonth - prevMonth) / prevMonth) * 100);

  return (
    <Card className="border-amber-100 shadow-xl overflow-hidden group h-full">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
                <Users size={16} />
            </div>
            <div>
                <CardTitle className="text-sm font-black">Member Growth</CardTitle>
                <CardDescription className="text-[10px]">Registrations · last 6 months</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={28}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="count"
              type="natural"
              fill="url(#fillCount)"
              fillOpacity={1}
              stroke="var(--color-count)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="px-5 pb-4 pt-1">
        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium">
          <TrendingUp className={growth >= 0 ? "h-3 w-3 text-green-500" : "h-3 w-3 text-red-500 rotate-180"} />
          <span className={growth >= 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{growth >= 0 ? "+" : ""}{growth}%</span>
          vs last month · {chartData[0]?.month} – {chartData[chartData.length-1]?.month} {new Date().getFullYear()}
        </div>
      </CardFooter>
    </Card>
  )
}

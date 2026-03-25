"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatEur } from "@/lib/utils/formatter";
import { Y_AXIS_CEILING } from "@/lib/calculator/engine";
import type { MonthlyBreakdown } from "@/lib/calculator/types";

interface SeasonalChartProps {
  data: MonthlyBreakdown[];
}

export function SeasonalChart({ data }: SeasonalChartProps) {
  return (
    <div>
      <h3 className="text-base font-semibold text-brand-text mb-1">Monthly Revenue</h3>
      <p className="text-sm text-brand-muted mb-4">Seasonal variation across your fleet</p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorEcredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ADFB7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2ADFB7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFlex" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8654A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E8654A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,223,183,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#7B8CA8" }} axisLine={{ stroke: "rgba(42,223,183,0.1)" }} tickLine={false} />
            <YAxis
              domain={[0, Y_AXIS_CEILING]}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              tick={{ fontSize: 11, fill: "#7B8CA8" }} axisLine={false} tickLine={false} width={50}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatEur(value), name === "ecredits" ? "E-Credits" : "Grid Flexibility"]}
              contentStyle={{ backgroundColor: "#0D1847", border: "1px solid rgba(42,223,183,0.2)", borderRadius: "6px", boxShadow: "none", fontSize: "13px", color: "#FFFFFF" }}
            />
            <Legend formatter={(value: string) => value === "ecredits" ? "E-Credits" : "Grid Flexibility"} />
            <Area type="monotone" dataKey="ecredits" stackId="1" stroke="#2ADFB7" strokeWidth={1.5} fill="url(#colorEcredits)" />
            <Area type="monotone" dataKey="flexibility" stackId="1" stroke="#E8654A" strokeWidth={1.5} fill="url(#colorFlex)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

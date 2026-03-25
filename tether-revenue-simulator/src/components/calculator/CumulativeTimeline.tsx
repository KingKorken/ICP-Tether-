"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatEur } from "@/lib/utils/formatter";
import type { CumulativeData } from "@/lib/calculator/types";

interface CumulativeTimelineProps {
  data: CumulativeData[];
  totalMonths: number;
}

export function CumulativeTimeline({ data, totalMonths }: CumulativeTimelineProps) {
  const cumulativeCeiling = 25000 * (totalMonths / 12) * 1.2;

  return (
    <div>
      <h3 className="text-base font-semibold text-brand-text mb-1">Cumulative Revenue</h3>
      <p className="text-sm text-brand-muted mb-4">Total accumulated over {totalMonths} months</p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ADFB7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2ADFB7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,223,183,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7B8CA8" }} axisLine={{ stroke: "rgba(42,223,183,0.1)" }} tickLine={false} interval={0} />
            <YAxis
              domain={[0, cumulativeCeiling]}
              tickFormatter={(v: number) => { if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`; if (v >= 1000) return `${(v / 1000).toFixed(0)}K`; return String(v); }}
              tick={{ fontSize: 11, fill: "#7B8CA8" }} axisLine={false} tickLine={false} width={55}
            />
            <Tooltip
              formatter={(value: number) => [formatEur(value), "Cumulative Revenue"]}
              contentStyle={{ backgroundColor: "#0D1847", border: "1px solid rgba(42,223,183,0.2)", borderRadius: "6px", boxShadow: "none", fontSize: "13px", color: "#FFFFFF" }}
            />
            <Area type="monotone" dataKey="cumulativeCombined" stroke="#2ADFB7" strokeWidth={2} fill="url(#colorCumulative)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { formatEur } from "@/lib/utils/formatter";
import type { CumulativeData } from "@/lib/calculator/types";

interface CumulativeTimelineProps {
  data: CumulativeData[];
  totalMonths: number;
}

export function CumulativeTimeline({
  data,
  totalMonths,
}: CumulativeTimelineProps) {
  // Fixed ceiling for cumulative: proportional to horizon
  const cumulativeCeiling = 25000 * (totalMonths / 12) * 1.2;

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-brand-text">
          Cumulative Revenue Timeline
        </h3>
        <InfoTooltip
          content="This chart shows your total accumulated revenue over the historical period, combining both E-Credit and grid flexibility income streams."
          disclaimer="Based on 2025 historical data. Not a projection of future performance."
          className="text-brand-muted mt-0.5"
        />
      </div>
      <p className="text-sm text-brand-muted mb-4">
        Total accumulated revenue over {totalMonths} months (historical)
      </p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ADFB7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2ADFB7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(42,223,183,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#7B8CA8" }}
              axisLine={{ stroke: "rgba(42,223,183,0.1)" }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[0, cumulativeCeiling]}
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return String(v);
              }}
              tick={{ fontSize: 11, fill: "#7B8CA8" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value: number) => [formatEur(value), "Cumulative Revenue"]}
              contentStyle={{
                backgroundColor: "#0D1847",
                border: "1px solid rgba(42,223,183,0.2)",
                borderRadius: "6px",
                boxShadow: "none",
                fontSize: "13px",
                color: "#FFFFFF",
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeCombined"
              stroke="#2ADFB7"
              strokeWidth={2}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

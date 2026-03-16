"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { formatEur } from "@/lib/utils/formatter";
import type { MonthlyBreakdown } from "@/lib/calculator/types";

interface SeasonalChartProps {
  data: MonthlyBreakdown[];
}

export function SeasonalChart({ data }: SeasonalChartProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-brand-text">
          Monthly Revenue Breakdown
        </h3>
        <InfoTooltip
          content="This chart shows how your combined E-Credit and grid flexibility revenue varies month by month, driven by seasonal energy demand and market price fluctuations."
          disclaimer="Market prices vary by month and country, based on real auction data from Nordic and European energy markets."
          className="text-brand-muted mt-0.5"
        />
      </div>
      <p className="text-sm text-brand-muted mb-4">
        Seasonal variation across 12 months
      </p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorEcredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3a7d5c" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3a7d5c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFlex" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c78c20" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#c78c20" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(26,58,42,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7a72" }}
              axisLine={{ stroke: "rgba(26,58,42,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
              tick={{ fontSize: 11, fill: "#6b7a72" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatEur(value),
                name === "ecredits" ? "E-Credits" : "Grid Flexibility",
              ]}
              contentStyle={{
                backgroundColor: "#f9faf9",
                border: "1px solid #d4dbd7",
                borderRadius: "6px",
                boxShadow: "none",
                fontSize: "13px",
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "ecredits" ? "E-Credits" : "Grid Flexibility"
              }
            />
            <Area
              type="monotone"
              dataKey="ecredits"
              stackId="1"
              stroke="#3a7d5c"
              strokeWidth={1.5}
              fill="url(#colorEcredits)"
            />
            <Area
              type="monotone"
              dataKey="flexibility"
              stackId="1"
              stroke="#c78c20"
              strokeWidth={1.5}
              fill="url(#colorFlex)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

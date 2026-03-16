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
import { Card } from "@/components/shared/Card";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { formatEur } from "@/lib/utils/formatter";
import type { MonthlyBreakdown } from "@/lib/calculator/types";

interface SeasonalChartProps {
  data: MonthlyBreakdown[];
}

export function SeasonalChart({ data }: SeasonalChartProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-lg font-semibold text-brand-dark">
          Monthly Revenue Breakdown
        </h3>
        <InfoTooltip
          content="This chart shows how your combined E-Credit and grid flexibility revenue varies month by month, driven by seasonal energy demand and market price fluctuations."
          disclaimer="Market prices vary by month and country, based on real auction data from Nordic and European energy markets."
          className="text-brand-muted mt-1"
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
                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFlex" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(45,27,105,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6E6B8A" }}
              axisLine={{ stroke: "rgba(45,27,105,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
              tick={{ fontSize: 11, fill: "#6E6B8A" }}
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
                backgroundColor: "#fff",
                border: "1px solid #E8E0F5",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
              stroke="#00D4FF"
              strokeWidth={2}
              fill="url(#colorEcredits)"
            />
            <Area
              type="monotone"
              dataKey="flexibility"
              stackId="1"
              stroke="#00C896"
              strokeWidth={2}
              fill="url(#colorFlex)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

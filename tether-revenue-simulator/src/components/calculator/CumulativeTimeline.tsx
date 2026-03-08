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
import { Card } from "@/components/shared/Card";
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
  return (
    <Card>
      <h3 className="text-lg font-semibold text-brand-dark mb-1">
        Cumulative Revenue Timeline
      </h3>
      <p className="text-sm text-brand-muted mb-4">
        Total accumulated revenue over {totalMonths} months
      </p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="colorCumulative"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#2D1B69" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2D1B69" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(45,27,105,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6E6B8A" }}
              axisLine={{ stroke: "rgba(45,27,105,0.1)" }}
              tickLine={false}
              interval={totalMonths <= 12 ? 0 : 1}
            />
            <YAxis
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return String(v);
              }}
              tick={{ fontSize: 11, fill: "#6E6B8A" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value: number) => [formatEur(value), "Cumulative Revenue"]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E8E0F5",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeCombined"
              stroke="#2D1B69"
              strokeWidth={2.5}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

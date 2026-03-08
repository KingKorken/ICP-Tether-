"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/Card";

interface AnalyticsData {
  totalLeads: number;
  verifiedLeads: number;
  totalContactRequests: number;
  unhandledContactRequests: number;
  pdfExports: number;
  countryDistribution: Record<string, number>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (res.ok) setData(json);
      } catch {
        // Silent failure
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-muted">Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-muted">Failed to load analytics data.</p>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Leads",
      value: data.totalLeads,
      color: "text-brand-primary",
    },
    {
      label: "Verified Leads",
      value: data.verifiedLeads,
      color: "text-brand-tether",
    },
    {
      label: "Contact Requests",
      value: data.totalContactRequests,
      color: "text-brand-accent",
    },
    {
      label: "Unhandled Requests",
      value: data.unhandledContactRequests,
      color: "text-brand-warm",
    },
    {
      label: "PDF Exports",
      value: data.pdfExports,
      color: "text-brand-primary",
    },
  ];

  const countries = Object.entries(data.countryDistribution).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">
        Market Intelligence
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-brand-muted mb-1">{metric.label}</p>
            <p className={`text-3xl font-bold tabular-nums ${metric.color}`}>
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Country Distribution */}
      <Card>
        <h2 className="text-lg font-semibold text-brand-dark mb-4">
          Country Distribution
        </h2>
        {countries.length > 0 ? (
          <div className="space-y-3">
            {countries.map(([country, count]) => {
              const pct =
                data.totalLeads > 0
                  ? Math.round((count / data.totalLeads) * 100)
                  : 0;
              return (
                <div key={country}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-brand-dark capitalize font-medium">
                      {country}
                    </span>
                    <span className="text-brand-muted">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-brand-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-tether rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-brand-muted text-sm py-8 text-center">
            No data yet. Country distribution will appear after leads use the
            calculator.
          </p>
        )}
      </Card>
    </div>
  );
}

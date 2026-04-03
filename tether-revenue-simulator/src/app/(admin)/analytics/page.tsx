"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/shared/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Lead {
  id: string;
  email: string;
  company_name: string;
  total_visits: number;
  last_visit_at: string | null;
}

interface Snapshot {
  id: string;
  input_state: Record<string, unknown>;
  output_results: Record<string, unknown>;
  created_at: string;
}

interface Session {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  device_type: string | null;
  events_count: number;
}

interface UserAnalytics {
  lead: Lead & {
    tokens: Array<{ id: string; token: string; origin: string; is_active: boolean }>;
    contact_requests: Array<{ id: string; created_at: string; is_handled: boolean }>;
  };
  snapshots: Snapshot[];
  kpis: {
    totalSessions: number;
    totalEvents: number;
    pdfExports: number;
    snapshotCount: number;
    lastEventAt: string | null;
  };
  sessions: Session[];
}

const COUNTRY_LABELS: Record<string, string> = {
  sweden: "Sweden", norway: "Norway", germany: "Germany",
  netherlands: "Netherlands", france: "France",
};

const POWER_LABELS: Record<string, string> = {
  "0.0074": "7.4 kW", "0.011": "11 kW", "0.022": "22 kW",
};

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatEur(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return "-";
  return `EUR ${Math.round(num).toLocaleString("en-US")}`;
}

function buildRetentionData(sessions: Session[]): Array<{ week: string; visits: number }> {
  if (sessions.length === 0) return [];

  const weekMap = new Map<string, number>();
  for (const session of sessions) {
    const date = new Date(session.started_at);
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekKey = monday.toISOString().split("T")[0];
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1);
  }

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, visits]) => ({
      week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visits,
    }));
}

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Fetch all leads for the dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/admin/leads?limit=100&offset=0");
        const data = await res.json();
        if (res.ok) {
          setLeads(data.leads ?? []);
        }
      } catch {
        // Silent
      } finally {
        setIsLoadingLeads(false);
      }
    };
    fetchLeads();
  }, []);

  // Fetch per-user analytics when a lead is selected
  const fetchUserAnalytics = useCallback(async (leadId: string) => {
    if (!leadId) {
      setAnalytics(null);
      return;
    }

    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/analytics/${leadId}`);
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch {
      // Silent
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leadId = e.target.value;
    setSelectedLeadId(leadId);
    fetchUserAnalytics(leadId);
  };

  if (isLoadingLeads) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  const latestSnapshot = analytics?.snapshots[0] ?? null;
  const inputState = latestSnapshot?.input_state ?? null;
  const outputResults = latestSnapshot?.output_results ?? null;
  const retentionData = analytics ? buildRetentionData(analytics.sessions) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-2">
        User Analytics
      </h1>
      <p className="text-brand-muted text-sm mb-6">
        Select a user to view their calculator engagement and data.
      </p>

      {/* User Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-brand-dark mb-1.5">
          Select User
        </label>
        <select
          value={selectedLeadId}
          onChange={handleLeadChange}
          className="w-full max-w-md px-3 py-2.5 bg-white border border-brand-border rounded-lg text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors"
        >
          <option value="">Choose a user...</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.company_name || "No company"} — {lead.email}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {isLoadingAnalytics && (
        <div className="flex items-center justify-center py-20">
          <p className="text-brand-muted">Loading user analytics...</p>
        </div>
      )}

      {/* No user selected */}
      {!selectedLeadId && !isLoadingAnalytics && (
        <Card>
          <p className="text-brand-muted text-sm py-12 text-center">
            Select a user from the dropdown above to view their analytics and calculator data.
          </p>
        </Card>
      )}

      {/* User analytics */}
      {analytics && !isLoadingAnalytics && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Visits", value: analytics.lead.total_visits, color: "text-brand-primary" },
              { label: "Sessions", value: analytics.kpis.totalSessions, color: "text-brand-tether" },
              { label: "Interactions", value: analytics.kpis.totalEvents, color: "text-brand-accent" },
              { label: "PDF Exports", value: analytics.kpis.pdfExports, color: "text-brand-primary" },
              { label: "Calculations", value: analytics.kpis.snapshotCount, color: "text-brand-revenue" },
            ].map((m) => (
              <Card key={m.label}>
                <p className="text-sm text-brand-muted mb-1">{m.label}</p>
                <p className={`text-3xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              </Card>
            ))}
          </div>

          {/* Visit Retention Chart */}
          {retentionData.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-brand-dark mb-1">
                Visit History
              </h2>
              <p className="text-sm text-brand-muted mb-4">
                Sessions per week — shows how often this user returns to the calculator
              </p>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ede9" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "#6b7a72" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7a72" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1c2420",
                        border: "none",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#d4dbd7" }}
                    />
                    <Bar
                      dataKey="visits"
                      fill="#3a7d5c"
                      radius={[4, 4, 0, 0]}
                      name="Sessions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Latest Calculator Data */}
            <Card>
              <h2 className="text-lg font-semibold text-brand-dark mb-1">
                Latest Calculator Data
              </h2>
              <p className="text-sm text-brand-muted mb-4">
                The values this user entered in their most recent calculation
              </p>

              {inputState ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DataRow label="Country" value={COUNTRY_LABELS[String(inputState.country)] ?? String(inputState.country ?? "-")} />
                    <DataRow label="Charger Type" value={String(inputState.type ?? "-").charAt(0).toUpperCase() + String(inputState.type ?? "-").slice(1)} />
                    <DataRow label="Power Level" value={POWER_LABELS[String(inputState.powerMW)] ?? String(inputState.powerMW ?? "-")} />
                    <DataRow label="Charge Points" value={inputState.chargers ? Number(inputState.chargers).toLocaleString() : "-"} />
                    <DataRow label="Utilization" value={inputState.utilization ? `${Math.round(Number(inputState.utilization) * 100)}%` : "-"} />
                    <DataRow label="Flex Potential" value={inputState.flexPotential ? `${Math.round(Number(inputState.flexPotential) * 100)}%` : "-"} />
                    <DataRow label="Horizon" value={inputState.horizonMonths ? `${inputState.horizonMonths} months` : "-"} />
                    <DataRow label="Last Calculated" value={formatDate(latestSnapshot?.created_at ?? null)} />
                  </div>

                  {outputResults && (
                    <div className="border-t border-brand-border/50 pt-3">
                      <p className="text-xs text-brand-muted font-medium uppercase tracking-wide mb-2">
                        Calculated Results
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <DataRow label="Total Revenue" value={formatEur(outputResults.totalCPO)} highlight />
                        <DataRow label="Per Charger/Year" value={formatEur(outputResults.perCharger)} />
                        <DataRow label="E-Credits" value={formatEur(outputResults.ecreditCPO)} />
                        <DataRow label="Grid Flexibility" value={formatEur(outputResults.flexCPO)} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-brand-muted text-sm py-8 text-center">
                  This user hasn&apos;t used the calculator yet.
                </p>
              )}
            </Card>

            {/* User Info */}
            <Card>
              <h2 className="text-lg font-semibold text-brand-dark mb-1">
                User Info
              </h2>
              <p className="text-sm text-brand-muted mb-4">
                Account details and activity summary
              </p>
              <div className="space-y-3">
                <DataRow label="Email" value={analytics.lead.email} />
                <DataRow label="Company" value={analytics.lead.company_name || "-"} />
                <DataRow label="Last Visit" value={formatDateTime(analytics.lead.last_visit_at)} />
                <DataRow label="Last Event" value={formatDateTime(analytics.kpis.lastEventAt)} />
                <DataRow label="Active Tokens" value={String(analytics.lead.tokens?.filter((t) => t.is_active).length ?? 0)} />
                <DataRow label="Contact Requests" value={String(analytics.lead.contact_requests?.length ?? 0)} />
              </div>
              <div className="mt-4 pt-3 border-t border-brand-border/50">
                <a
                  href={`/leads/${analytics.lead.id}`}
                  className="text-sm text-brand-tether hover:underline"
                >
                  View full lead details &rarr;
                </a>
              </div>
            </Card>
          </div>

          {/* Calculation History */}
          {analytics.snapshots.length > 1 && (
            <Card>
              <h2 className="text-lg font-semibold text-brand-dark mb-1">
                Calculation History
              </h2>
              <p className="text-sm text-brand-muted mb-4">
                All calculations this user has performed — shows how their needs evolved
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-secondary/50">
                      <th className="text-left py-2 px-3 text-brand-muted font-medium">Date</th>
                      <th className="text-left py-2 px-3 text-brand-muted font-medium">Country</th>
                      <th className="text-left py-2 px-3 text-brand-muted font-medium">Type</th>
                      <th className="text-right py-2 px-3 text-brand-muted font-medium">Chargers</th>
                      <th className="text-left py-2 px-3 text-brand-muted font-medium">Power</th>
                      <th className="text-right py-2 px-3 text-brand-muted font-medium">Utilization</th>
                      <th className="text-right py-2 px-3 text-brand-muted font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.snapshots.map((snap) => {
                      const s = snap.input_state;
                      const r = snap.output_results;
                      return (
                        <tr key={snap.id} className="border-b border-brand-secondary/30">
                          <td className="py-2 px-3 text-brand-muted">{formatDate(snap.created_at)}</td>
                          <td className="py-2 px-3 text-brand-dark capitalize">{String(s?.country ?? "-")}</td>
                          <td className="py-2 px-3 text-brand-dark capitalize">{String(s?.type ?? "-")}</td>
                          <td className="py-2 px-3 text-brand-dark text-right tabular-nums">
                            {s?.chargers ? Number(s.chargers).toLocaleString() : "-"}
                          </td>
                          <td className="py-2 px-3 text-brand-dark">
                            {POWER_LABELS[String(s?.powerMW)] ?? "-"}
                          </td>
                          <td className="py-2 px-3 text-brand-dark text-right tabular-nums">
                            {s?.utilization ? `${Math.round(Number(s.utilization) * 100)}%` : "-"}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-brand-dark tabular-nums">
                            {formatEur(r?.totalCPO)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-brand-muted">{label}</p>
      <p className={`text-sm ${highlight ? "font-semibold text-brand-tether" : "font-medium text-brand-dark"}`}>
        {value}
      </p>
    </div>
  );
}

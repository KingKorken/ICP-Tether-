"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

interface LeadDetail {
  id: string;
  email: string;
  company_name: string;
  email_domain: string;
  is_free_email: boolean;
  is_verified: boolean;
  country: string | null;
  created_at: string;
  verified_at: string | null;
  last_visit_at: string | null;
  total_visits: number;
  tokens: Array<{
    id: string;
    token: string;
    origin: string;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
    prefilled_data: Record<string, unknown> | null;
  }>;
  contact_requests: Array<{
    id: string;
    message: string;
    preferred_contact: string;
    is_handled: boolean;
    created_at: string;
  }>;
}

interface Snapshot {
  id: string;
  token_id: string;
  input_state: Record<string, unknown>;
  output_results: Record<string, unknown>;
  client_version: number;
  created_at: string;
}

interface KPIs {
  totalSessions: number;
  totalEvents: number;
  pdfExports: number;
  snapshotCount: number;
  lastEventAt: string | null;
}

const COUNTRY_LABELS: Record<string, string> = {
  sweden: "Sweden",
  norway: "Norway",
  germany: "Germany",
  netherlands: "Netherlands",
  france: "France",
};

const POWER_LABELS: Record<string, string> = {
  "0.0074": "7.4 kW",
  "0.011": "11 kW",
  "0.022": "22 kW",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEur(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return "-";
  return `EUR ${Math.round(num).toLocaleString("en-US")}`;
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`);
      const data = await res.json();
      if (res.ok) {
        setLead(data.lead);
        setSnapshots(data.snapshots);
        setKpis(data.kpis);
      } else {
        setError(data.error ?? "Failed to load lead data");
      }
    } catch {
      setError("Failed to load lead data");
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleToken = async (tokenId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/tokens`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, isActive: !currentActive }),
      });

      if (res.ok) {
        // Refresh data
        fetchData();
      }
    } catch {
      // Silent failure
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-muted">Loading lead details...</p>
      </div>
    );
  }

  if (error || !lead || !kpis) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-warm mb-4">{error || "Lead not found"}</p>
        <a
          href="/dashboard"
          className="text-brand-tether hover:underline text-sm"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  const latestSnapshot = snapshots[0] ?? null;
  const inputState = latestSnapshot?.input_state ?? null;
  const outputResults = latestSnapshot?.output_results ?? null;

  return (
    <div>
      {/* Back link + Header */}
      <div className="mb-8">
        <a
          href="/dashboard"
          className="text-brand-tether hover:underline text-sm mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              {lead.company_name || lead.email}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-brand-muted text-sm">{lead.email}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  lead.is_verified
                    ? "bg-brand-tether/10 text-brand-tether"
                    : "bg-brand-muted/10 text-brand-muted"
                }`}
              >
                {lead.is_verified ? "Verified" : "Pending"}
              </span>
              {lead.is_free_email && (
                <span className="text-xs text-brand-warm">Personal email</span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-brand-muted">
            <p>Created {formatDate(lead.created_at)}</p>
            {lead.verified_at && (
              <p>Verified {formatDate(lead.verified_at)}</p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          {
            label: "Total Visits",
            value: lead.total_visits,
            color: "text-brand-primary",
          },
          {
            label: "Sessions",
            value: kpis.totalSessions,
            color: "text-brand-tether",
          },
          {
            label: "Interactions",
            value: kpis.totalEvents,
            color: "text-brand-accent",
          },
          {
            label: "PDF Exports",
            value: kpis.pdfExports,
            color: "text-brand-primary",
          },
          {
            label: "Snapshots",
            value: kpis.snapshotCount,
            color: "text-brand-tether",
          },
        ].map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-brand-muted mb-1">{metric.label}</p>
            <p className={`text-3xl font-bold tabular-nums ${metric.color}`}>
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Calculator Data (from latest snapshot) */}
        <Card>
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Calculator Data
          </h2>
          {inputState ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <DataRow
                  label="Country"
                  value={
                    COUNTRY_LABELS[String(inputState.country)] ??
                    String(inputState.country ?? "-")
                  }
                />
                <DataRow
                  label="Charger Type"
                  value={
                    String(inputState.type ?? "-").charAt(0).toUpperCase() +
                    String(inputState.type ?? "-").slice(1)
                  }
                />
                <DataRow
                  label="Power Level"
                  value={
                    POWER_LABELS[String(inputState.powerMW)] ??
                    String(inputState.powerMW ?? "-")
                  }
                />
                <DataRow
                  label="Charge Points"
                  value={
                    inputState.chargers
                      ? Number(inputState.chargers).toLocaleString("en-US")
                      : "-"
                  }
                />
                <DataRow
                  label="Utilization"
                  value={
                    inputState.utilization
                      ? `${Math.round(Number(inputState.utilization) * 100)}%`
                      : "-"
                  }
                />
                <DataRow
                  label="Flex Potential"
                  value={
                    inputState.flexPotential
                      ? `${Math.round(Number(inputState.flexPotential) * 100)}%`
                      : "-"
                  }
                />
                <DataRow
                  label="Horizon"
                  value={
                    inputState.horizonMonths
                      ? `${inputState.horizonMonths} months`
                      : "-"
                  }
                />
                <DataRow
                  label="Company"
                  value={String(inputState.company || "-")}
                />
              </div>

              {outputResults && (
                <div className="border-t border-brand-secondary/50 pt-3 mt-3">
                  <p className="text-xs text-brand-muted mb-2 font-medium uppercase tracking-wide">
                    Calculated Results
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <DataRow
                      label="Total Revenue"
                      value={formatEur(outputResults.totalCPO)}
                      highlight
                    />
                    <DataRow
                      label="Per Charger"
                      value={formatEur(outputResults.perCharger)}
                    />
                    <DataRow
                      label="E-Credits"
                      value={formatEur(outputResults.ecreditCPO)}
                    />
                    <DataRow
                      label="Grid Flexibility"
                      value={formatEur(outputResults.flexCPO)}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-brand-muted pt-2">
                Last calculated {formatDate(latestSnapshot.created_at)}
              </p>
            </div>
          ) : (
            <p className="text-brand-muted text-sm py-8 text-center">
              No calculator data yet. The user hasn&apos;t used the calculator.
            </p>
          )}
        </Card>

        {/* Tokens */}
        <Card>
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Access Tokens
          </h2>
          {lead.tokens.length > 0 ? (
            <div className="space-y-3">
              {lead.tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 bg-brand-light rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          token.origin === "sales_generated"
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-brand-tether/10 text-brand-tether"
                        }`}
                      >
                        {token.origin === "sales_generated"
                          ? "Sales"
                          : "Organic"}
                      </span>
                      <span
                        className={`text-xs ${
                          token.is_active
                            ? "text-brand-tether"
                            : "text-brand-warm"
                        }`}
                      >
                        {token.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted font-mono truncate">
                      /sim/t/{token.token.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Created {formatDate(token.created_at)}
                      {token.last_used_at &&
                        ` · Last used ${formatDate(token.last_used_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/sim/t/${token.token}`
                        )
                      }
                    >
                      Copy
                    </Button>
                    <Button
                      variant={token.is_active ? "outline" : "primary"}
                      size="sm"
                      onClick={() =>
                        handleToggleToken(token.id, token.is_active)
                      }
                    >
                      {token.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-muted text-sm py-8 text-center">
              No tokens for this lead.
            </p>
          )}
        </Card>
      </div>

      {/* Contact Requests */}
      {lead.contact_requests.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Contact Requests
          </h2>
          <div className="space-y-3">
            {lead.contact_requests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between p-3 bg-brand-light rounded-lg"
              >
                <div>
                  <p className="text-sm text-brand-dark">
                    {req.message || "(No message)"}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">
                    {formatDate(req.created_at)} · Prefers{" "}
                    {req.preferred_contact}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    req.is_handled
                      ? "bg-brand-tether/10 text-brand-tether"
                      : "bg-brand-warm/10 text-brand-warm"
                  }`}
                >
                  {req.is_handled ? "Handled" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Snapshot History */}
      {snapshots.length > 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Calculation History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-secondary/50">
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Country
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Type
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Chargers
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Power
                  </th>
                  <th className="text-right py-2 px-3 text-brand-muted font-medium">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snap) => {
                  const state = snap.input_state;
                  const results = snap.output_results;
                  return (
                    <tr
                      key={snap.id}
                      className="border-b border-brand-secondary/30"
                    >
                      <td className="py-2 px-3 text-brand-muted">
                        {formatDate(snap.created_at)}
                      </td>
                      <td className="py-2 px-3 text-brand-dark capitalize">
                        {String(state?.country ?? "-")}
                      </td>
                      <td className="py-2 px-3 text-brand-dark capitalize">
                        {String(state?.type ?? "-")}
                      </td>
                      <td className="py-2 px-3 text-brand-dark tabular-nums">
                        {state?.chargers
                          ? Number(state.chargers).toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-brand-dark">
                        {POWER_LABELS[String(state?.powerMW)] ?? "-"}
                      </td>
                      <td className="py-2 px-3 text-right text-brand-dark font-medium tabular-nums">
                        {formatEur(results?.totalCPO)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Activity metadata */}
      <div className="mt-8 text-xs text-brand-muted space-y-1">
        <p>Last visit: {formatDate(lead.last_visit_at)}</p>
        <p>Last event: {formatDate(kpis.lastEventAt)}</p>
        <p>Lead ID: {lead.id}</p>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-brand-muted">{label}</p>
      <p
        className={`text-sm ${
          highlight
            ? "font-semibold text-brand-tether"
            : "font-medium text-brand-dark"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

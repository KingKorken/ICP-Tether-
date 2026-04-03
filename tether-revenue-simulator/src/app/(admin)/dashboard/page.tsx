"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

interface Lead {
  id: string;
  email: string;
  company_name: string;
  email_domain: string;
  is_free_email: boolean;
  is_verified: boolean;
  country: string | null;
  created_at: string;
  last_visit_at: string | null;
  total_visits: number;
  tokens: Array<{
    id: string;
    token: string;
    origin: string;
    is_active: boolean;
    last_used_at: string | null;
  }>;
  contact_requests: Array<{
    id: string;
    created_at: string;
    is_handled: boolean;
  }>;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/admin/leads?limit=50&offset=0");
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads);
        setTotal(data.total);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    window.open("/api/admin/export", "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-muted">Loading leads...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Lead Pipeline</h1>
          <p className="text-brand-muted text-sm mt-1">
            {total} total lead{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.location.href = "/tokens"}>
            Create Token
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-brand-warm/5 border-brand-warm/20 mb-6">
          <p className="text-brand-warm text-sm">{error}</p>
        </Card>
      )}

      {/* Lead Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-secondary/50">
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Company
                </th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Visits
                </th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Last Active
                </th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Signals
                </th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium">
                  Token
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-brand-secondary/30 hover:bg-brand-light/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <a href={`/leads/${lead.id}`} className="block group">
                      <p className="font-medium text-brand-dark group-hover:text-brand-tether transition-colors">
                        {lead.company_name || "-"}
                      </p>
                      {lead.is_free_email && (
                        <span className="text-xs text-brand-warm">
                          Personal email
                        </span>
                      )}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-brand-muted">{lead.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.is_verified
                          ? "bg-brand-tether/10 text-brand-tether"
                          : "bg-brand-muted/10 text-brand-muted"
                      }`}
                    >
                      {lead.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-brand-dark tabular-nums">
                    {lead.total_visits}
                  </td>
                  <td className="py-3 px-4 text-brand-muted">
                    {lead.last_visit_at
                      ? new Date(lead.last_visit_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {lead.contact_requests.length > 0 && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-accent/10 text-brand-accent"
                          title="Contact request submitted"
                        >
                          CTA
                        </span>
                      )}
                      {lead.tokens.some(
                        (t) => t.origin === "sales_generated"
                      ) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                          Sales
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/leads/${lead.id}`}
                        className="text-brand-primary hover:underline text-xs font-medium"
                      >
                        View
                      </a>
                      {lead.tokens[0] && (
                        <a
                          href={`/sim/t/${lead.tokens[0].token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-tether hover:underline text-xs"
                        >
                          Open Calc
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-brand-muted"
                  >
                    No leads yet. Share the landing page to start collecting data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

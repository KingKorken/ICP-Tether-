"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

interface RecentToken {
  id: string;
  token: string;
  origin: string;
  is_active: boolean;
  created_at: string;
  leads: {
    id: string;
    email: string;
    company_name: string;
  } | null;
}

export default function TokensPage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPrefill, setShowPrefill] = useState(false);
  const [country, setCountry] = useState("");
  const [chargerType, setChargerType] = useState("");
  const [powerMW, setPowerMW] = useState("");
  const [chargers, setChargers] = useState("");
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    calculatorUrl: string;
    token: string;
    lead: { id: string; email: string };
  } | null>(null);
  const [error, setError] = useState("");
  const [recentTokens, setRecentTokens] = useState<RecentToken[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentTokens();
  }, []);

  const fetchRecentTokens = async () => {
    try {
      const res = await fetch("/api/admin/leads?limit=10&offset=0&orderBy=created_at");
      const data = await res.json();
      if (res.ok && data.leads) {
        // Extract sales-generated tokens from leads
        const tokens: RecentToken[] = [];
        for (const lead of data.leads) {
          for (const token of lead.tokens ?? []) {
            if (token.origin === "sales_generated") {
              tokens.push({
                ...token,
                leads: {
                  id: lead.id,
                  email: lead.email,
                  company_name: lead.company_name,
                },
              });
            }
          }
        }
        tokens.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentTokens(tokens.slice(0, 10));
      }
    } catch {
      // Silent failure for recent tokens
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsCreating(true);

    // Build prefilled data if any fields are set
    const prefilledData: Record<string, unknown> = {};
    if (country) prefilledData.country = country;
    if (chargerType) prefilledData.type = chargerType;
    if (powerMW) prefilledData.powerMW = parseFloat(powerMW);
    if (chargers) prefilledData.chargers = parseInt(chargers);
    if (notes) prefilledData._notes = notes; // Internal notes, not used by calculator
    if (companyName) prefilledData.company = companyName;

    try {
      const res = await fetch("/api/tokens/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          companyName,
          prefilledData:
            Object.keys(prefilledData).length > 0 ? prefilledData : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setEmail("");
        setCompanyName("");
        setCountry("");
        setChargerType("");
        setPowerMW("");
        setChargers("");
        setNotes("");
        setShowPrefill(false);
        fetchRecentTokens();
      } else {
        setError(data.error ?? "Failed to create token");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = (url: string, tokenId: string) => {
    navigator.clipboard.writeText(url);
    setCopied(tokenId);
    setTimeout(() => setCopied(null), 2000);
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-brand-secondary rounded-lg text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors";
  const selectClass =
    "w-full px-3 py-2.5 border border-brand-secondary rounded-lg text-brand-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors";

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">
        Create User Account
      </h1>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Create Form */}
        <Card>
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Generate Access for a Prospect
          </h2>
          <p className="text-sm text-brand-muted mb-6">
            Create a direct link to the revenue calculator. The prospect gets
            instant access — no email verification needed.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">
                Prospect Email <span className="text-brand-warm">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="prospect@company.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className={inputClass}
                maxLength={200}
              />
            </div>

            {/* Prefill toggle */}
            <button
              type="button"
              onClick={() => setShowPrefill(!showPrefill)}
              className="text-sm text-brand-tether hover:underline flex items-center gap-1"
            >
              <span className="text-xs">{showPrefill ? "▾" : "▸"}</span>
              Pre-fill calculator values (optional)
            </button>

            {showPrefill && (
              <div className="space-y-3 p-4 bg-brand-light rounded-lg border border-brand-secondary/50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Default (Sweden)</option>
                      <option value="sweden">Sweden</option>
                      <option value="norway">Norway</option>
                      <option value="germany">Germany</option>
                      <option value="netherlands">Netherlands</option>
                      <option value="france">France</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">
                      Charger Type
                    </label>
                    <select
                      value={chargerType}
                      onChange={(e) => setChargerType(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Default (Public)</option>
                      <option value="public">Public</option>
                      <option value="residential">Residential</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">
                      Power Level
                    </label>
                    <select
                      value={powerMW}
                      onChange={(e) => setPowerMW(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Default (11 kW)</option>
                      <option value="0.0074">7.4 kW</option>
                      <option value="0.011">11 kW</option>
                      <option value="0.022">22 kW</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">
                      Charge Points
                    </label>
                    <input
                      type="number"
                      value={chargers}
                      onChange={(e) => setChargers(e.target.value)}
                      placeholder="e.g. 500"
                      min={10}
                      max={10000}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Met at conference, interested in grid flex"
                    className={inputClass}
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-brand-warm text-sm">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isCreating}
              className="w-full"
            >
              Create Account &amp; Generate Link
            </Button>
          </form>
        </Card>

        {/* Result */}
        {result && (
          <Card className="bg-brand-tether/5 border-brand-tether/20">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Account Created Successfully
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">
                  Calculator URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={result.calculatorUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-brand-secondary rounded-lg text-sm text-brand-dark"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(result.calculatorUrl, result.token)
                    }
                  >
                    {copied === result.token ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-brand-muted">
                Share this URL with the prospect. They can access the revenue
                calculator directly.
              </p>
              <a
                href={`/leads/${result.lead.id}`}
                className="text-sm text-brand-tether hover:underline inline-block"
              >
                View lead details &rarr;
              </a>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Tokens */}
      {recentTokens.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Recently Created Accounts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-secondary/50">
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Company
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Email
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Created
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTokens.map((token) => (
                  <tr
                    key={token.id}
                    className="border-b border-brand-secondary/30"
                  >
                    <td className="py-2 px-3 font-medium text-brand-dark">
                      {token.leads?.company_name || "-"}
                    </td>
                    <td className="py-2 px-3 text-brand-muted">
                      {token.leads?.email ?? "-"}
                    </td>
                    <td className="py-2 px-3 text-brand-muted">
                      {new Date(token.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          token.is_active
                            ? "bg-brand-tether/10 text-brand-tether"
                            : "bg-brand-warm/10 text-brand-warm"
                        }`}
                      >
                        {token.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleCopy(
                              `${window.location.origin}/sim/t/${token.token}`,
                              token.id
                            )
                          }
                          className="text-brand-tether hover:underline text-xs"
                        >
                          {copied === token.id ? "Copied!" : "Copy URL"}
                        </button>
                        {token.leads && (
                          <a
                            href={`/leads/${token.leads.id}`}
                            className="text-brand-primary hover:underline text-xs"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

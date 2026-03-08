"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

export default function TokensPage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    calculatorUrl: string;
    token: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsCreating(true);

    try {
      const res = await fetch("/api/tokens/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setEmail("");
        setCompanyName("");
      } else {
        setError(data.error ?? "Failed to create token");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">
        Create Sales Token
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Form */}
        <Card>
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Generate a Token for a Prospect
          </h2>
          <p className="text-sm text-brand-muted mb-6">
            Create a direct link to the calculator for a prospect. No email
            verification needed — they go straight to the calculator.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">
                Prospect Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="prospect@company.com"
                className="w-full px-3 py-2.5 border border-brand-secondary rounded-lg text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors"
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
                className="w-full px-3 py-2.5 border border-brand-secondary rounded-lg text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors"
                maxLength={200}
              />
            </div>

            {error && (
              <p className="text-brand-warm text-sm">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isCreating}
              className="w-full"
            >
              Generate Token
            </Button>
          </form>
        </Card>

        {/* Result */}
        {result && (
          <Card className="bg-brand-tether/5 border-brand-tether/20">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Token Created Successfully
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
                    onClick={() => {
                      navigator.clipboard.writeText(result.calculatorUrl);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-xs text-brand-muted">
                Share this URL with the prospect. They can access the calculator
                directly without email verification.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

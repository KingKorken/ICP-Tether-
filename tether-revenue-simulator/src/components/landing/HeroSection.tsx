"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";

export function HeroSection() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to the calculator
      window.location.href = data.redirectTo;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-brand-primary px-6">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Value Proposition */}
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-tether/10 text-brand-tether px-3 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-brand-tether rounded-full animate-pulse" />
            Free Revenue Calculator
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            How Much Revenue Are Your{" "}
            <span className="text-brand-accent">Charge Points</span>{" "}
            Leaving on the Table?
          </h1>
          <p className="text-brand-secondary text-lg leading-relaxed mb-8">
            Discover your untapped revenue from e-credits and grid flexibility.
            Our simulator uses real market data to show you exactly how much
            your EV charging network could earn with Tether.
          </p>
          <div className="flex items-center gap-6 text-sm text-brand-muted">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-tether" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Real market prices
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-tether" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              5 European markets
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-tether" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Export PDF report
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Your Calculator
          </h2>
          <p className="text-brand-muted text-sm mb-6">
            Enter your credentials to access your personalized revenue calculator.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-brand-secondary mb-1.5"
              >
                Company Name <span className="text-brand-warm">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-tether/50 focus:border-brand-tether transition-colors"
                maxLength={200}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brand-secondary mb-1.5"
              >
                Business Email <span className="text-brand-warm">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-tether/50 focus:border-brand-tether transition-colors"
                maxLength={254}
              />
            </div>

            {error && (
              <p className="text-brand-warm text-sm" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Access Revenue Calculator
            </Button>

            <p className="text-xs text-brand-muted text-center">
              Don&apos;t have access? Contact your Tether representative.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

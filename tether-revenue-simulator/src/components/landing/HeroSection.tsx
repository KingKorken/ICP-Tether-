"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";

export function HeroSection() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-brand-primary px-6">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 bg-brand-tether/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-brand-tether"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Check Your Email
          </h2>
          <p className="text-brand-secondary text-lg mb-2">
            We&apos;ve sent a magic link to{" "}
            <span className="font-semibold text-brand-accent">{email}</span>
          </p>
          <p className="text-brand-muted text-sm">
            Click the link in the email to access your personalized Revenue
            Simulator. The link expires in 15 minutes.
          </p>
        </div>
      </section>
    );
  }

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

        {/* Right: Email Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-2">
            Get Instant Access
          </h2>
          <p className="text-brand-muted text-sm mb-6">
            Enter your business email to receive a personalized calculator link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-brand-secondary mb-1.5"
              >
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company"
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
              Get Your Revenue Estimate
            </Button>

            <p className="text-xs text-brand-muted text-center">
              No account needed. We&apos;ll send you a magic link.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

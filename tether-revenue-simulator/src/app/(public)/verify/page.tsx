"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";

function VerifyContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMessage("No verification code provided.");
      return;
    }

    // The actual verification happens via the API route,
    // which redirects to the calculator on success.
    // This page handles client-side redirect.
    window.location.href = `/api/auth/verify?code=${encodeURIComponent(code)}`;
  }, [code]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-brand-warm/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-brand-warm"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-dark mb-3">
            Verification Failed
          </h2>
          <p className="text-brand-muted mb-6">{errorMessage}</p>
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/")}
          >
            Request a New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-brand-tether/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg
            className="w-8 h-8 text-brand-tether animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-brand-dark mb-3">
          Verifying Your Access...
        </h2>
        <p className="text-brand-muted">
          Please wait while we set up your Revenue Simulator.
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-light">
          <p className="text-brand-muted">Loading...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

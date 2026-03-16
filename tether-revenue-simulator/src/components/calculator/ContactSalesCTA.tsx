"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { trackEvent } from "@/lib/tracking/tracker";
import { EVENTS } from "@/lib/tracking/events";

interface ContactSalesCTAProps {
  tokenId: string;
  leadId: string;
  accessToken: string;
}

export function ContactSalesCTA({
  tokenId,
  leadId,
}: ContactSalesCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [preferredContact, setPreferredContact] = useState<"email" | "phone">(
    "email"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleOpenModal = () => {
    trackEvent({
      type: EVENTS.CONTACT_SALES_CLICKED,
      payload: {},
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [
            {
              event_type: "contact-sales.submitted",
              payload: { preferred_contact: preferredContact },
              client_sequence: Date.now(),
              client_timestamp: new Date().toISOString(),
            },
          ],
          session_id: crypto.randomUUID(),
          token_id: tokenId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      void leadId;

      setIsSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-brand-subtle/60 rounded-lg border border-brand-border/40 p-8">
        <h3 className="text-xl font-semibold text-brand-text mb-2">
          Ready to unlock this revenue?
        </h3>
        <p className="text-brand-muted text-sm mb-5 max-w-lg">
          Talk to our team about how Tether can start generating these returns
          from your existing charge point infrastructure.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={handleOpenModal}
        >
          Contact Our Sales Team
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isSubmitted ? "Message Sent" : "Contact Sales"}
        maxWidth="md"
      >
        {isSubmitted ? (
          <div className="py-4">
            <div className="w-10 h-10 bg-brand-ecredit/10 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-brand-ecredit"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-brand-text font-medium mb-1">
              We&apos;ve received your message
            </p>
            <p className="text-brand-muted text-sm mb-4">
              A member of our sales team will reach out to you shortly.
            </p>
            <button
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your fleet and what you'd like to discuss..."
                rows={4}
                maxLength={2000}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary-light transition-colors resize-none"
              />
              <p className="text-xs text-brand-muted mt-1">
                {message.length}/2000
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["email", "phone"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPreferredContact(method)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize
                      ${
                        preferredContact === method
                          ? "bg-brand-primary text-white"
                          : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                      }
                    `}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-brand-warm text-sm" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full"
            >
              Send Message
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}

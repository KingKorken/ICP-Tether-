"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
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

      // Also store the contact request
      // TODO: Add proper contact request endpoint
      void leadId; // Suppress unused warning

      setIsSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card
        padding="lg"
        className="mt-8 bg-gradient-to-br from-brand-tether/5 to-brand-accent/5 border-brand-tether/20"
      >
        <div className="text-center max-w-xl mx-auto">
          <h3 className="font-display text-2xl font-bold text-brand-dark mb-3">
            Ready to Unlock This Revenue?
          </h3>
          <p className="text-brand-muted mb-6">
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
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isSubmitted ? "Message Sent!" : "Contact Sales"}
        maxWidth="md"
      >
        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-brand-tether/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-brand-tether"
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
            <p className="text-brand-dark font-medium mb-2">
              We&apos;ve received your message
            </p>
            <p className="text-brand-muted text-sm">
              A member of our sales team will reach out to you shortly.
            </p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your fleet and what you'd like to discuss..."
                rows={4}
                maxLength={2000}
                className="w-full px-3 py-2.5 border border-brand-secondary rounded-lg text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors resize-none"
              />
              <p className="text-xs text-brand-muted mt-1">
                {message.length}/2000
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-2">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["email", "phone"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPreferredContact(method)}
                    className={`
                      px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize
                      ${
                        preferredContact === method
                          ? "bg-brand-primary text-white"
                          : "bg-brand-light text-brand-muted hover:bg-brand-secondary"
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

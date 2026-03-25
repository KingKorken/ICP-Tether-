"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { trackEvent } from "@/lib/tracking/tracker";
import { EVENTS } from "@/lib/tracking/events";

export function MethodologyPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState) {
      trackEvent({ type: EVENTS.METHODOLOGY_EXPANDED, payload: {} });
    }
  };

  return (
    <Card className="mt-8">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-brand-text">See the Math</h3>
          <p className="text-sm text-brand-muted">How we calculate your revenue estimates</p>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-5 h-5 text-brand-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="methodology-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-6 pt-6 border-t border-brand-border space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-brand-ecredit mb-2">E-Credit Revenue</h4>
                <div className="bg-brand-surface rounded-lg p-4 text-sm text-brand-muted space-y-2">
                  <p><strong className="text-brand-text">Annual kWh</strong> = Chargers x Power(kW) x Utilization x Accessible Hours x 365</p>
                  <p><strong className="text-brand-text">Effective Rate</strong> = Renewable Energy % x Multiplier(4) x Avoided CO2(0.3234 kg) x CO2 Price(0.34 EUR/kg) x Market Discount(3.5%)</p>
                  <p><strong className="text-brand-text">CPO E-Credit Revenue</strong> = Annual kWh x Effective Rate x CPO Share(40%) x Seasonal Adjustment</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-brand-warm mb-2">Grid Flexibility Revenue</h4>
                <div className="bg-brand-surface rounded-lg p-4 text-sm text-brand-muted space-y-2">
                  <p><strong className="text-brand-text">Available Capacity</strong> = Chargers x Utilization x Power(MW) x Flex Potential</p>
                  <p><strong className="text-brand-text">Monthly Flex Revenue</strong> = Sum of (mFRR Up + mFRR Down + FCR-D Up + FCR-D Down) x Accessible Hours x CPO Share(40%)</p>
                  <p>Market prices vary by month and country, based on historical auction data from ENTSO-E Transparency Platform.</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-brand-ecredit mb-2">Data Sources</h4>
                <ul className="text-sm text-brand-muted space-y-1">
                  <li>&bull; ENTSO-E Transparency Platform &mdash; Day-ahead, mFRR &amp; FCR market prices</li>
                  <li>&bull; Mimer (Svenska Kraftn&auml;t) &mdash; Swedish market fallback data</li>
                  <li>&bull; eco2grid (Green Grid Compass / 50Hertz) &mdash; Carbon intensity</li>
                  <li>&bull; Country-specific seasonality curves from ENTSO-E data</li>
                  <li>&bull; CPO revenue share: 40% (Tether standard terms)</li>
                  <li>&bull; All figures in EUR, based on 2025 historical data</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

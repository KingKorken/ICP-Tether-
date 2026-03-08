"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { trackEvent } from "@/lib/tracking/tracker";
import { EVENTS } from "@/lib/tracking/events";

export function MethodologyPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);

    if (newState) {
      trackEvent({
        type: EVENTS.METHODOLOGY_EXPANDED,
        payload: {},
      });
    }
  };

  return (
    <Card className="mt-8">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-brand-dark">
            See the Math
          </h3>
          <p className="text-sm text-brand-muted">
            How we calculate your revenue projections
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-brand-muted transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-brand-secondary/50 space-y-6">
          {/* E-Credits */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary mb-2">
              E-Credit Revenue
            </h4>
            <div className="bg-brand-light rounded-lg p-4 text-sm text-brand-muted space-y-2">
              <p>
                <strong>Annual kWh</strong> = Chargers x Power(kW) x
                Utilization x Accessible Hours x 365
              </p>
              <p>
                <strong>Effective Rate</strong> = Renewable Energy % x
                Multiplier(4) x Avoided CO2(0.3234 kg) x CO2 Price(0.34
                EUR/kg) x Market Discount(3.5%)
              </p>
              <p>
                <strong>CPO E-Credit Revenue</strong> = Annual kWh x Effective
                Rate x CPO Share(40%) x Seasonal Adjustment
              </p>
            </div>
          </div>

          {/* Grid Flexibility */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary mb-2">
              Grid Flexibility Revenue
            </h4>
            <div className="bg-brand-light rounded-lg p-4 text-sm text-brand-muted space-y-2">
              <p>
                <strong>Available Capacity</strong> = Chargers x Utilization x
                Power(MW) x Flex Potential
              </p>
              <p>
                <strong>Monthly Flex Revenue</strong> = Sum of (mFRR Up + mFRR
                Down + FCR-D Up + FCR-D Down) x Accessible Hours x CPO
                Share(40%)
              </p>
              <p>
                Market prices vary by month and country, based on real auction
                data from Nordic and European energy markets.
              </p>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary mb-2">
              Data Sources
            </h4>
            <ul className="text-sm text-brand-muted space-y-1">
              <li>
                &bull; Sweden: Real market data from Mimer/Svenska Kraftn&auml;t
              </li>
              <li>&bull; Other markets: Estimated based on regional benchmarks</li>
              <li>&bull; CPO revenue share: 40% (Tether standard terms)</li>
              <li>&bull; All figures in EUR</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

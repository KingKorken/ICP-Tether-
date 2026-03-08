/**
 * PDF Revenue Report Template
 * Uses @react-pdf/renderer for server-side branded output.
 *
 * Note: This component runs server-side only.
 * Chart images must be pre-rendered as PNGs via recharts-to-png.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { CalculationResult, SimulatorState } from "@/lib/calculator/types";
import { MARKET_DATA } from "@/lib/calculator/market-data";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0A0B14",
  },
  header: {
    marginBottom: 30,
    borderBottom: "2px solid #2D1B69",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D1B69",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6E6B8A",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D1B69",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "1px solid #E8E0F5",
  },
  label: {
    color: "#6E6B8A",
    fontSize: 10,
  },
  value: {
    fontWeight: "bold",
    fontSize: 10,
  },
  heroNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2D1B69",
    textAlign: "center",
    marginVertical: 15,
  },
  heroLabel: {
    fontSize: 11,
    color: "#6E6B8A",
    textAlign: "center",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  splitItem: {
    alignItems: "center",
  },
  splitValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0A0B14",
  },
  splitLabel: {
    fontSize: 9,
    color: "#6E6B8A",
    marginTop: 3,
  },
  chartImage: {
    width: "100%",
    marginVertical: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #E8E0F5",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#6E6B8A",
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#F5F3FA",
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 8,
    color: "#6E6B8A",
    lineHeight: 1.4,
  },
});

interface RevenueReportProps {
  state: SimulatorState;
  results: CalculationResult;
  companyName: string;
  chartImages?: {
    seasonal?: string; // Base64 PNG
    cumulative?: string; // Base64 PNG
  };
}

function formatEur(n: number): string {
  return `EUR ${Math.round(n).toLocaleString("en-US")}`;
}

export function RevenueReport({
  state,
  results,
  companyName,
  chartImages,
}: RevenueReportProps) {
  const country = MARKET_DATA[state.country];
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Revenue Simulator Report</Text>
          <Text style={styles.subtitle}>
            Prepared for {companyName || "Your Company"} &mdash; {generatedDate}
          </Text>
        </View>

        {/* Hero Number */}
        <View style={styles.section}>
          <Text style={styles.heroLabel}>Estimated Annual Revenue</Text>
          <Text style={styles.heroNumber}>{formatEur(results.totalCPO)}</Text>
          <Text style={styles.heroLabel}>
            {formatEur(results.perCharger)} per charger / year
          </Text>
        </View>

        {/* Revenue Split */}
        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>
              {formatEur(results.ecreditCPO)}
            </Text>
            <Text style={styles.splitLabel}>E-Credits Revenue</Text>
          </View>
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>
              {formatEur(results.flexCPO)}
            </Text>
            <Text style={styles.splitLabel}>Grid Flexibility Revenue</Text>
          </View>
        </View>

        {/* Configuration Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Configuration</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Market</Text>
            <Text style={styles.value}>{country.label}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Charger Type</Text>
            <Text style={styles.value}>
              {state.type === "public" ? "Public" : "Residential"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Number of Charge Points</Text>
            <Text style={styles.value}>
              {state.chargers.toLocaleString("en-US")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Charger Power</Text>
            <Text style={styles.value}>{state.powerMW * 1000} kW</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Utilization Rate</Text>
            <Text style={styles.value}>
              {Math.round(state.utilization * 100)}%
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Flexibility Potential</Text>
            <Text style={styles.value}>
              {Math.round(state.flexPotential * 100)}%
            </Text>
          </View>
        </View>

        {/* Chart Images */}
        {chartImages?.seasonal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Monthly Revenue Breakdown
            </Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't support alt */}
            <Image src={chartImages.seasonal} style={styles.chartImage} />
          </View>
        )}

        {chartImages?.cumulative && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Cumulative Revenue Timeline
            </Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't support alt */}
            <Image src={chartImages.cumulative} style={styles.chartImage} />
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This report is generated by the Tether Revenue Simulator for
            informational purposes only. Revenue projections are estimates based
            on current market data and the configuration parameters provided.
            Actual revenue may vary based on market conditions, regulatory
            changes, and operational factors. This is not a guarantee of
            earnings.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tether EV &mdash; Unlocking revenue from every charge point
          </Text>
          <Text style={styles.footerText}>
            Generated on {generatedDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default RevenueReport;

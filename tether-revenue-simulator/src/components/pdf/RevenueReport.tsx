/**
 * PDF Revenue Report — Two-page professional report
 * Page 1: Executive Summary (revenue headline, KPIs, value prop, fleet config)
 * Page 2: Investment Memo (opportunity, revenue streams, why Tether, contact)
 *
 * Uses @react-pdf/renderer for server-side PDF generation.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CalculationResult, SimulatorState } from "@/lib/calculator/types";
import { MARKET_DATA } from "@/lib/calculator/market-data";

// Brand colors
const C = {
  primary: "#1a3a2a",
  revenue: "#c78c20",
  ecredit: "#3a7d5c",
  text: "#2a3430",
  muted: "#6b7a72",
  border: "#d4dbd7",
  subtle: "#e8ede9",
  light: "#f3f5f4",
  white: "#ffffff",
  warn: "#c2572a",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: C.text, position: "relative" },

  // ---- PAGE 1 ----
  p1Header: { backgroundColor: C.primary, padding: "26px 36px 22px", color: C.white },
  p1Brand: { fontSize: 8, letterSpacing: 2, textTransform: "uppercase", opacity: 0.5, marginBottom: 4 },
  p1Title: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
  p1Subtitle: { fontSize: 10, opacity: 0.7 },
  p1Hero: { textAlign: "center", padding: "22px 36px 14px" },
  p1HeroLabel: { fontSize: 9, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 4 },
  p1HeroNumber: { fontSize: 38, fontWeight: "bold", color: C.revenue, marginBottom: 3 },
  p1HeroSub: { fontSize: 10, color: C.muted },
  p1KpiRow: { flexDirection: "row", gap: 10, padding: "0 36px", marginBottom: 10 },
  p1KpiBox: { flex: 1, backgroundColor: C.light, borderRadius: 5, padding: "11px 8px", alignItems: "center" },
  p1KpiLabel: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  p1KpiValue: { fontSize: 17, fontWeight: "bold" },
  p1KpiNote: { fontSize: 7, color: C.muted, marginTop: 2 },
  barWrap: { height: 7, backgroundColor: C.subtle, borderRadius: 4, flexDirection: "row", overflow: "hidden", margin: "6px 36px 3px" },
  barLegend: { flexDirection: "row", justifyContent: "space-between", padding: "0 36px", marginBottom: 14 },
  barLegendText: { fontSize: 7, color: C.muted },
  valueBox: { margin: "0 36px", padding: 12, backgroundColor: C.light, borderRadius: 5, marginBottom: 14 },
  valueTitle: { fontSize: 10, fontWeight: "bold", color: C.primary, marginBottom: 3 },
  valueText: { fontSize: 8, color: C.muted, lineHeight: 1.5 },
  configSection: { margin: "0 36px", paddingTop: 12, borderTop: `1px solid ${C.border}`, marginBottom: 14 },
  configTitle: { fontSize: 8, fontWeight: "bold", color: C.primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 },
  configGrid: { flexDirection: "row", flexWrap: "wrap" },
  configItem: { width: "33%", marginBottom: 5 },
  configLabel: { fontSize: 7, color: C.muted },
  configValue: { fontSize: 9, fontWeight: "bold", color: C.text },
  contactBox: { margin: "0 36px", padding: 12, backgroundColor: C.light, borderRadius: 5 },
  contactTitle: { fontSize: 9, fontWeight: "bold", color: C.primary, marginBottom: 3 },
  contactText: { fontSize: 8, color: C.muted },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, paddingTop: 7, borderTop: `1px solid ${C.border}`, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 6.5, color: C.muted },

  // ---- PAGE 2 ----
  p2Header: { padding: "26px 36px 0" },
  p2HeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  p2Brand: { fontSize: 8, letterSpacing: 2, color: C.muted, textTransform: "uppercase" },
  p2Title: { fontSize: 15, fontWeight: "bold", color: C.primary, marginTop: 4 },
  p2Meta: { textAlign: "right", fontSize: 8, color: C.muted },
  p2Conf: { fontSize: 8, color: C.warn, fontWeight: "bold", marginTop: 2 },
  p2Divider: { height: 2, backgroundColor: C.primary, marginTop: 14, marginBottom: 16 },
  section: { marginBottom: 12, padding: "0 36px" },
  sectionNum: { fontSize: 9, fontWeight: "bold", color: C.primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  sectionBody: { fontSize: 8, color: C.muted, lineHeight: 1.5 },
  kpiPair: { flexDirection: "row", gap: 10, margin: "0 36px", marginBottom: 12 },
  kpiCard: { flex: 1, padding: 11, backgroundColor: C.light, borderRadius: 5, alignItems: "center" },
  kpiCardLabel: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  kpiCardValue: { fontSize: 17, fontWeight: "bold", marginTop: 2 },
  table: { marginTop: 6 },
  tableRow: { flexDirection: "row", borderBottom: `1px solid ${C.subtle}`, paddingVertical: 4 },
  tableRowLast: { flexDirection: "row", paddingVertical: 5, borderTop: `1px solid ${C.border}`, marginTop: 2 },
  tableCell: { fontSize: 8, color: C.muted, flex: 3 },
  tableCellRight: { fontSize: 8, fontWeight: "bold", textAlign: "right", flex: 2 },
  tableCellPct: { fontSize: 8, color: C.muted, textAlign: "right", flex: 1, paddingLeft: 6 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { fontSize: 8, color: C.muted, marginRight: 5 },
  bulletText: { fontSize: 8, color: C.muted, lineHeight: 1.5, flex: 1 },
  ctaBox: { margin: "0 36px", padding: 14, backgroundColor: C.primary, borderRadius: 5, marginBottom: 6 },
  ctaTitle: { fontSize: 10, fontWeight: "bold", color: C.white, marginBottom: 5 },
  ctaText: { fontSize: 8, color: C.white, opacity: 0.8, lineHeight: 1.5 },
  ctaDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 7 },
  ctaContact: { fontSize: 9, color: C.white, fontWeight: "bold" },
  ctaContactSub: { fontSize: 8, color: C.white, opacity: 0.6, marginTop: 1 },
});

interface RevenueReportProps {
  state: SimulatorState;
  results: CalculationResult;
  companyName: string;
}

function fmt(n: number): string {
  return `EUR ${Math.round(n).toLocaleString("en-US")}`;
}

export function RevenueReport({ state, results, companyName }: RevenueReportProps) {
  const country = MARKET_DATA[state.country];
  const company = companyName || "Your Company";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const ecreditPct = Math.round((results.ecreditCPO / results.totalCPO) * 100);
  const flexPct = 100 - ecreditPct;
  const renPct = Math.round(country.resE_pct * 100);

  return (
    <Document>
      {/* PAGE 1: Executive Summary */}
      <Page size="A4" style={s.page}>
        <View style={s.p1Header}>
          <Text style={s.p1Brand}>Tether EV</Text>
          <Text style={s.p1Title}>Revenue Opportunity Report</Text>
          <Text style={s.p1Subtitle}>Prepared for {company} — {date}</Text>
        </View>

        <View style={s.p1Hero}>
          <Text style={s.p1HeroLabel}>Estimated Annual Revenue</Text>
          <Text style={s.p1HeroNumber}>{fmt(results.totalCPO)}</Text>
          <Text style={s.p1HeroSub}>{fmt(results.perCharger)} per charge point / year — zero capital investment</Text>
        </View>

        <View style={s.p1KpiRow}>
          <View style={s.p1KpiBox}>
            <Text style={s.p1KpiLabel}>E-Credits</Text>
            <Text style={{ ...s.p1KpiValue, color: C.ecredit }}>{fmt(results.ecreditCPO)}</Text>
            <Text style={s.p1KpiNote}>{ecreditPct}% of total</Text>
          </View>
          <View style={s.p1KpiBox}>
            <Text style={s.p1KpiLabel}>Grid Flexibility</Text>
            <Text style={{ ...s.p1KpiValue, color: C.revenue }}>{fmt(results.flexCPO)}</Text>
            <Text style={s.p1KpiNote}>{flexPct}% of total</Text>
          </View>
          <View style={s.p1KpiBox}>
            <Text style={s.p1KpiLabel}>Per Charger</Text>
            <Text style={{ ...s.p1KpiValue, color: C.primary }}>{fmt(results.perCharger)}</Text>
            <Text style={s.p1KpiNote}>annual</Text>
          </View>
        </View>

        <View style={s.barWrap}>
          <View style={{ width: `${ecreditPct}%`, backgroundColor: C.ecredit }} />
          <View style={{ width: `${flexPct}%`, backgroundColor: C.revenue }} />
        </View>
        <View style={s.barLegend}>
          <Text style={s.barLegendText}>E-Credits {ecreditPct}%</Text>
          <Text style={s.barLegendText}>Grid Flexibility {flexPct}%</Text>
        </View>

        <View style={s.valueBox}>
          <Text style={s.valueTitle}>Why This Matters for {company}</Text>
          <Text style={s.valueText}>
            Your {state.chargers.toLocaleString()} charge points in {country.label} ({renPct}% renewable energy share) generate valuable energy data and grid-connected capacity every day. With Tether, this untapped value converts into two new revenue streams — e-credits from carbon credit markets and grid flexibility from Nordic ancillary service markets. No hardware changes, no upfront costs, revenue within weeks. Every month you wait, this value goes uncaptured.
          </Text>
        </View>

        <View style={s.configSection}>
          <Text style={s.configTitle}>Fleet Configuration</Text>
          <View style={s.configGrid}>
            <View style={s.configItem}><Text style={s.configLabel}>Market</Text><Text style={s.configValue}>{country.label}</Text></View>
            <View style={s.configItem}><Text style={s.configLabel}>Charger Type</Text><Text style={s.configValue}>{state.type === "public" ? "Public" : "Residential"}</Text></View>
            <View style={s.configItem}><Text style={s.configLabel}>Power</Text><Text style={s.configValue}>{state.powerMW * 1000} kW</Text></View>
            <View style={s.configItem}><Text style={s.configLabel}>Charge Points</Text><Text style={s.configValue}>{state.chargers.toLocaleString()}</Text></View>
            <View style={s.configItem}><Text style={s.configLabel}>Utilization</Text><Text style={s.configValue}>{Math.round(state.utilization * 100)}%</Text></View>
            <View style={s.configItem}><Text style={s.configLabel}>Horizon</Text><Text style={s.configValue}>{state.horizonMonths} months</Text></View>
          </View>
        </View>

        <View style={s.contactBox}>
          <Text style={s.contactTitle}>Your Tether Contact</Text>
          <Text style={s.contactText}>Tim Buhrow — tim.buhrow@alumni.esade.edu</Text>
          <Text style={s.contactText}>tether.energy — Schedule a call to discuss next steps</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Projections are estimates based on current market data. Results may vary.</Text>
          <Text style={s.footerText}>© 2026 Tether EV</Text>
        </View>
      </Page>

      {/* PAGE 2: Investment Memo */}
      <Page size="A4" style={s.page}>
        <View style={s.p2Header}>
          <View style={s.p2HeaderRow}>
            <View>
              <Text style={s.p2Brand}>Tether EV</Text>
              <Text style={s.p2Title}>Revenue Opportunity{"\n"}Memorandum</Text>
            </View>
            <View>
              <Text style={s.p2Meta}>{company}</Text>
              <Text style={s.p2Meta}>{date}</Text>
              <Text style={s.p2Conf}>Confidential</Text>
            </View>
          </View>
          <View style={s.p2Divider} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionNum}>I. The Opportunity</Text>
          <Text style={s.sectionBody}>
            {company} operates {state.chargers.toLocaleString()} {state.type} charge points in {country.label}, a market with {renPct}% renewable energy penetration and active ancillary service markets (mFRR, FCR-D). Every charge point generates energy consumption data with carbon credit value, and provides grid-connected capacity that can participate in frequency regulation markets. Today, this value goes entirely uncaptured. Tether&apos;s platform enables {company} to monetize these existing assets through two distinct, additive revenue streams — with zero capital expenditure and no modifications to existing hardware or charging operations.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionNum}>II. Revenue Potential</Text>
        </View>
        <View style={s.kpiPair}>
          <View style={s.kpiCard}>
            <Text style={s.kpiCardLabel}>Total Annual Revenue</Text>
            <Text style={{ ...s.kpiCardValue, color: C.revenue }}>{fmt(results.totalCPO)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiCardLabel}>Revenue Per Charger</Text>
            <Text style={{ ...s.kpiCardValue, color: C.primary }}>{fmt(results.perCharger)}/yr</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionNum}>III. Revenue Streams</Text>
          <View style={s.table}>
            <View style={s.tableRow}>
              <Text style={s.tableCell}>E-Credits (Carbon Credit Generation)</Text>
              <Text style={{ ...s.tableCellRight, color: C.ecredit }}>{fmt(results.ecreditCPO)}</Text>
              <Text style={s.tableCellPct}>{ecreditPct}%</Text>
            </View>
            <View style={s.tableRow}>
              <Text style={s.tableCell}>Grid Flexibility (mFRR / FCR-D)</Text>
              <Text style={{ ...s.tableCellRight, color: C.revenue }}>{fmt(results.flexCPO)}</Text>
              <Text style={s.tableCellPct}>{flexPct}%</Text>
            </View>
            <View style={s.tableRowLast}>
              <Text style={{ ...s.tableCell, fontWeight: "bold", color: C.primary }}>Total Annual Revenue</Text>
              <Text style={{ ...s.tableCellRight, color: C.primary }}>{fmt(results.totalCPO)}</Text>
              <Text style={s.tableCellPct}>100%</Text>
            </View>
          </View>
          <Text style={{ ...s.sectionBody, marginTop: 6 }}>
            E-Credits are generated from the renewable energy contribution of your charging volume, producing tradeable carbon credits on European markets. Grid Flexibility revenue comes from participating in Nordic mFRR (up/down regulation) and FCR-D (frequency containment) markets — providing automated grid balancing services through your existing charging infrastructure without impacting customer-facing operations.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionNum}>IV. Why Tether</Text>
          <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Zero capital investment — revenue from existing infrastructure, no hardware changes</Text></View>
          <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Transparent 40% revenue share to CPO under Tether standard commercial terms</Text></View>
          <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Fast integration — revenue starts within 4-6 weeks of contract signature</Text></View>
          <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Automated market optimization — continuous monitoring of Nordic energy markets to maximize yield</Text></View>
          <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Monthly reporting dashboard with real-time revenue tracking and market analytics</Text></View>
          <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Zero operational impact — charging services for end customers remain completely unaffected</Text></View>
        </View>

        <View style={s.ctaBox}>
          <Text style={s.ctaTitle}>Ready to Capture This Revenue?</Text>
          <Text style={s.ctaText}>
            Schedule a 30-minute call to review the technical integration path, commercial terms, and timeline. Your fleet of {state.chargers.toLocaleString()} charge points could be generating {fmt(results.totalCPO)} annually within 6 weeks.
          </Text>
          <View style={s.ctaDivider} />
          <Text style={s.ctaContact}>Tim Buhrow</Text>
          <Text style={s.ctaContactSub}>tim.buhrow@alumni.esade.edu — tether.energy</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Confidential. Projections based on current {country.label} energy market data.</Text>
          <Text style={s.footerText}>© 2026 Tether EV</Text>
        </View>
      </Page>
    </Document>
  );
}

export default RevenueReport;

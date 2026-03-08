import { notFound } from "next/navigation";
import { getActiveToken, getLatestSnapshot } from "@/lib/db/queries";
import { isValidAccessToken } from "@/lib/tokens/validation";
import { SimulatorClient } from "./SimulatorClient";
import type { SimulatorState } from "@/lib/calculator/types";
import { DEFAULT_STATE } from "@/lib/calculator/types";

export const metadata = {
  title: "Revenue Simulator — Tether",
  robots: "noindex, nofollow", // Calculator pages are gated
};

interface SimulatorPageProps {
  params: Promise<{ token: string }>;
}

export default async function SimulatorPage({ params }: SimulatorPageProps) {
  const { token: accessToken } = await params;

  // Validate token format
  if (!isValidAccessToken(accessToken)) {
    notFound();
  }

  // Validate token in database
  const token = await getActiveToken(accessToken);
  if (!token) {
    notFound();
  }

  // Load latest snapshot (saved state) if it exists
  let initialState: SimulatorState = DEFAULT_STATE;
  const snapshot = await getLatestSnapshot(token.id);
  if (snapshot?.input_state) {
    const saved = snapshot.input_state as Partial<SimulatorState>;
    initialState = {
      ...DEFAULT_STATE,
      ...saved,
    };
  }

  // If this is a sales-generated token with prefilled data, use it
  if (token.prefilled_data && !snapshot) {
    const prefilled = token.prefilled_data as Partial<SimulatorState>;
    initialState = {
      ...DEFAULT_STATE,
      ...prefilled,
    };
  }

  // Get company name from lead data
  const companyName =
    initialState.company || (token.leads as { company_name?: string })?.company_name || "";

  return (
    <SimulatorClient
      accessToken={accessToken}
      tokenId={token.id}
      leadId={token.lead_id}
      initialState={{ ...initialState, company: companyName }}
      hasExistingSnapshot={!!snapshot}
    />
  );
}

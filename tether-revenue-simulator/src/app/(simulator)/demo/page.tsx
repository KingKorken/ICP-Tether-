import { SimulatorClient } from "../sim/t/[token]/SimulatorClient";
import { DEFAULT_STATE } from "@/lib/calculator/types";

export const metadata = {
  title: "Demo — Revenue Simulator — Tether",
  robots: "noindex, nofollow",
};

export default function DemoPage() {
  return (
    <SimulatorClient
      accessToken="demo"
      tokenId="demo-token"
      leadId="demo-lead"
      initialState={{ ...DEFAULT_STATE, company: "Demo Company" }}
      hasExistingSnapshot={false}
      isDemoMode
    />
  );
}

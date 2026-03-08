import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  magicLinkUrl: string;
  companyName: string;
}

export function MagicLinkEmail({
  magicLinkUrl,
  companyName,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Access the Tether Revenue Simulator</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>
            Your Revenue Simulator is Ready
          </Heading>
          <Text style={text}>
            Hi{companyName ? ` (${companyName})` : ""},
          </Text>
          <Text style={text}>
            Click the link below to access the Tether Revenue Simulator and
            discover your EV charging revenue potential from e-credits and grid
            flexibility.
          </Text>
          <Section style={buttonContainer}>
            <Link href={magicLinkUrl} style={button}>
              Open Revenue Simulator
            </Link>
          </Section>
          <Text style={textSmall}>
            This link expires in 15 minutes and can only be used once. After
            clicking, you&apos;ll get a permanent link you can bookmark.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Tether EV &mdash; Unlocking revenue from every charge point.
          </Text>
          <Text style={footerSmall}>
            If you didn&apos;t request this link, you can safely ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const body = {
  backgroundColor: "#F5F3FA",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const heading = {
  color: "#2D1B69",
  fontSize: "28px",
  fontWeight: "700" as const,
  letterSpacing: "-0.02em",
  lineHeight: "1.2",
  margin: "0 0 24px",
};

const text = {
  color: "#0A0B14",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const textSmall = {
  color: "#6E6B8A",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "16px 0 0",
};

const buttonContainer = {
  margin: "32px 0",
};

const button = {
  backgroundColor: "#00C896",
  borderRadius: "8px",
  color: "#FFFFFF",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600" as const,
  letterSpacing: "-0.01em",
  padding: "14px 32px",
  textDecoration: "none",
};

const hr = {
  borderColor: "#E8E0F5",
  margin: "32px 0",
};

const footer = {
  color: "#2D1B69",
  fontSize: "14px",
  fontWeight: "600" as const,
  margin: "0 0 8px",
};

const footerSmall = {
  color: "#6E6B8A",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

export default MagicLinkEmail;

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  accessToken?: string;
  tokenId?: string;
  leadId?: string;
  isVerified?: boolean;
}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters in production"
    );
  }
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret ?? "development-secret-must-be-at-least-32-chars!!",
  cookieName: "tether_sim_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

/**
 * Get the current session from cookies.
 * Note: cookies() is async in Next.js 15+.
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

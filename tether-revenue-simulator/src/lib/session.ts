import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  accessToken?: string;
  tokenId?: string;
  leadId?: string;
  isVerified?: boolean;
}

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      console.warn("SESSION_SECRET is missing or too short — session features will not work");
    }
    return "development-secret-must-be-at-least-32-chars!!";
  }
  return secret;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: "tether_sim_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

/**
 * Get the current session from cookies.
 * Note: cookies() is async in Next.js 15+.
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

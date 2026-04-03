import { createServerClient } from "./server";

// =============================================
// Lead queries
// =============================================

/**
 * Find or create a lead by email (atomic upsert to prevent race conditions).
 * Returns the lead record — either existing or newly created.
 */
export async function upsertLead(params: {
  email: string;
  companyName: string;
  isFreeEmail: boolean;
}) {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc("upsert_lead", {
    p_email: params.email,
    p_company_name: params.companyName,
    p_is_free_email: params.isFreeEmail,
  });

  // Fallback to manual upsert if RPC not set up yet
  if (error?.code === "42883") {
    // function does not exist
    const { data: existingLead } = await supabase
      .from("leads")
      .select("*")
      .eq("email", params.email)
      .single();

    if (existingLead) {
      await supabase
        .from("leads")
        .update({
          last_visit_at: new Date().toISOString(),
          total_visits: existingLead.total_visits + 1,
        })
        .eq("id", existingLead.id);
      return existingLead;
    }

    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        email: params.email,
        company_name: params.companyName,
        is_free_email: params.isFreeEmail,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newLead;
  }

  if (error) throw error;
  return data;
}

/**
 * Mark a lead as verified after magic-link confirmation.
 */
export async function verifyLead(leadId: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("leads")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) throw error;
}

/**
 * Get a lead by email.
 */
export async function getLeadByEmail(email: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

// =============================================
// Token queries
// =============================================

/**
 * Create a new token for a lead.
 */
export async function createToken(params: {
  leadId: string;
  origin: "organic" | "sales_generated";
  verificationCode?: string;
  verificationCodeExpiresAt?: string;
  prefilledData?: Record<string, unknown>;
}) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tokens")
    .insert({
      lead_id: params.leadId,
      origin: params.origin,
      verification_code: params.verificationCode,
      verification_code_expires_at: params.verificationCodeExpiresAt,
      prefilled_data: params.prefilledData ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Look up a token by its access value. Returns null if not found or inactive.
 */
export async function getActiveToken(token: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tokens")
    .select("*, leads(*)")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/**
 * Find token by verification code and validate it.
 * Returns null if code is invalid, expired, or too many attempts.
 */
export async function verifyMagicLinkCode(code: string) {
  const supabase = createServerClient();

  const { data: token, error } = await supabase
    .from("tokens")
    .select("*, leads(*)")
    .eq("verification_code", code)
    .eq("is_active", true)
    .single();

  if (error || !token) return null;

  // Check expiry
  if (
    token.verification_code_expires_at &&
    new Date(token.verification_code_expires_at) < new Date()
  ) {
    return null;
  }

  // Check attempt limit
  if (token.verification_attempts >= 5) {
    return null;
  }

  // Increment attempts
  await supabase
    .from("tokens")
    .update({
      verification_attempts: token.verification_attempts + 1,
    })
    .eq("id", token.id);

  // Clear the verification code (one-time use)
  await supabase
    .from("tokens")
    .update({
      verification_code: null,
      verification_code_expires_at: null,
    })
    .eq("id", token.id);

  return token;
}

/**
 * Update last_used_at on token access.
 */
export async function touchToken(tokenId: string) {
  const supabase = createServerClient();

  await supabase
    .from("tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);
}

/**
 * Get token(s) for a lead.
 */
export async function getTokensForLead(leadId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// =============================================
// Session queries
// =============================================

/**
 * Create a new session.
 */
export async function createSession(params: {
  tokenId: string;
  userAgent?: string;
  referrer?: string;
  deviceType?: string;
}) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      token_id: params.tokenId,
      user_agent: params.userAgent,
      referrer: params.referrer,
      device_type: params.deviceType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// Event queries
// =============================================

/**
 * Batch insert events.
 */
export async function insertEvents(
  events: Array<{
    token_id: string;
    session_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    client_sequence?: number;
    client_timestamp?: string;
  }>
) {
  const supabase = createServerClient();

  const { error } = await supabase.from("events").insert(events);

  if (error) throw error;
}

// =============================================
// Snapshot queries
// =============================================

/**
 * Save a calculator state snapshot (version-guarded).
 */
export async function saveSnapshot(params: {
  tokenId: string;
  sessionId?: string;
  inputState: Record<string, unknown>;
  outputResults: Record<string, unknown>;
  clientVersion: number;
}) {
  const supabase = createServerClient();

  // Get the latest snapshot's version for this token
  const { data: existing } = await supabase
    .from("snapshots")
    .select("client_version")
    .eq("token_id", params.tokenId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Only save if client version is newer
  if (existing && existing.client_version >= params.clientVersion) {
    return null; // Stale save, skip
  }

  const { data, error } = await supabase
    .from("snapshots")
    .insert({
      token_id: params.tokenId,
      session_id: params.sessionId ?? null,
      input_state: params.inputState,
      output_results: params.outputResults,
      client_version: params.clientVersion,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the latest snapshot for a token.
 */
export async function getLatestSnapshot(tokenId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .eq("token_id", tokenId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// =============================================
// Contact request queries
// =============================================

/**
 * Create a contact request (rate limited: max 2 per token per day).
 */
export async function createContactRequest(params: {
  tokenId: string;
  leadId: string;
  message: string;
  preferredContact: "email" | "phone";
}) {
  const supabase = createServerClient();

  // Check rate limit: max 2 per token per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("contact_requests")
    .select("*", { count: "exact", head: true })
    .eq("token_id", params.tokenId)
    .gte("created_at", oneDayAgo);

  if (count !== null && count >= 2) {
    throw new Error("Rate limit exceeded: max 2 contact requests per day");
  }

  const { data, error } = await supabase
    .from("contact_requests")
    .insert({
      token_id: params.tokenId,
      lead_id: params.leadId,
      message: params.message,
      preferred_contact: params.preferredContact,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// Admin queries
// =============================================

/**
 * Get all leads with basic engagement data for admin dashboard.
 */
export async function getLeadsForAdmin(params?: {
  orderBy?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createServerClient();

  let query = supabase
    .from("leads")
    .select(
      `
      *,
      tokens(id, token, origin, is_active, created_at, last_used_at),
      contact_requests(id, created_at, is_handled)
    `,
      { count: "exact" }
    )
    .order(params?.orderBy ?? "last_visit_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (params?.limit) query = query.limit(params.limit);
  if (params?.offset) query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { leads: data ?? [], total: count ?? 0 };
}

/**
 * Log an admin action.
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServerClient();

  await supabase.from("admin_audit_log").insert({
    admin_id: params.adminId,
    action: params.action,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? null,
  });
}

/**
 * Get detailed lead data including tokens, contacts, and engagement stats.
 */
export async function getLeadDetail(leadId: string) {
  const supabase = createServerClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      tokens(id, token, origin, is_active, created_at, last_used_at, prefilled_data),
      contact_requests(id, message, preferred_contact, is_handled, created_at)
    `
    )
    .eq("id", leadId)
    .single();

  if (error) throw error;
  return lead;
}

/**
 * Get all snapshots for a lead (via their tokens).
 * Returns the calculator inputs and results for each snapshot.
 */
export async function getLeadSnapshots(leadId: string) {
  const supabase = createServerClient();

  // First get all token IDs for this lead
  const { data: tokens, error: tokenError } = await supabase
    .from("tokens")
    .select("id")
    .eq("lead_id", leadId);

  if (tokenError) throw tokenError;
  if (!tokens || tokens.length === 0) return [];

  const tokenIds = tokens.map((t) => t.id);

  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select("id, token_id, input_state, output_results, client_version, created_at")
    .in("token_id", tokenIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return snapshots ?? [];
}

/**
 * Get engagement KPIs for a lead (aggregated across all their tokens).
 */
export async function getLeadEngagementKPIs(leadId: string) {
  const supabase = createServerClient();

  // Get all token IDs for this lead
  const { data: tokens, error: tokenError } = await supabase
    .from("tokens")
    .select("id")
    .eq("lead_id", leadId);

  if (tokenError) throw tokenError;
  if (!tokens || tokens.length === 0) {
    return {
      totalSessions: 0,
      totalEvents: 0,
      pdfExports: 0,
      snapshotCount: 0,
      lastEventAt: null,
    };
  }

  const tokenIds = tokens.map((t) => t.id);

  // Parallel queries for KPIs
  const [sessions, events, pdfExports, snapshots] = await Promise.all([
    supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .in("token_id", tokenIds),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("token_id", tokenIds),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("token_id", tokenIds)
      .eq("event_type", "pdf.exported"),
    supabase
      .from("snapshots")
      .select("*", { count: "exact", head: true })
      .in("token_id", tokenIds),
  ]);

  // Get most recent event timestamp
  const { data: lastEvent } = await supabase
    .from("events")
    .select("created_at")
    .in("token_id", tokenIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    totalSessions: sessions.count ?? 0,
    totalEvents: events.count ?? 0,
    pdfExports: pdfExports.count ?? 0,
    snapshotCount: snapshots.count ?? 0,
    lastEventAt: lastEvent?.created_at ?? null,
  };
}

/**
 * Activate or deactivate a token.
 */
export async function setTokenActive(tokenId: string, isActive: boolean) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("tokens")
    .update({ is_active: isActive })
    .eq("id", tokenId);

  if (error) throw error;
}

/**
 * Get recently created sales tokens (for the tokens page).
 */
export async function getRecentSalesTokens(limit = 10) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tokens")
    .select(
      `
      id, token, origin, is_active, created_at,
      leads(id, email, company_name)
    `
    )
    .eq("origin", "sales_generated")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

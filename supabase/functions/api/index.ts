import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FARE-ERP Edge Function Backend API
// Deployed as: supabase/functions/api/index.ts
// Purpose: Acts as the server-side backend layer required by the course.
//          All data mutations route through this function, which enforces
//          authentication and role-based authorization before touching the DB.
//
// Routes (all require Authorization: Bearer <access_token>):
//   GET  /api/me             — Current user profile
//   GET  /api/equipment      — Paginated equipment list
//   POST /api/checkout       — Equipment checkout (admin/staff only)
//   POST /api/return         — Equipment return (admin/staff only)
//   POST /api/maintenance    — Create maintenance record (admin/staff only)
//   GET  /api/transactions   — Loan transaction list (role-filtered)
//   GET  /api/audit-logs     — Audit log (admin only)
// =============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

// Build a Supabase client that uses the caller's JWT for RLS enforcement
function buildClientForCaller(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Build a service-role client for admin-level RPC calls
function buildServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getUserAndRole(client: SupabaseClient) {
  const { data: { user }, error: authErr } = await client.auth.getUser();
  if (authErr || !user) return { user: null, role: null, profile: null };

  const { data: profile } = await client
    .from("users")
    .select("*, role:roles(name)")
    .eq("user_auth_id", user.id)
    .single();

  const role = (profile as { role?: { name?: string } })?.role?.name ?? null;
  return { user, role, profile };
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

async function handleMe(client: SupabaseClient) {
  const { user, role, profile } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);
  return json({ user_id: user.id, role, profile });
}


//okii

async function handleEquipment(client: SupabaseClient, url: URL) {
  const { user, role } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);

  const sportId = url.searchParams.get("sport_id");
  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;

  let query = client
    .from("equipment")
    .select("*, sport:sports(*)", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("name");

  if (sportId) query = query.eq("sport_id", sportId);
  if (status) query = query.eq("status", status);

  const { data, error: dbErr, count } = await query;
  if (dbErr) return error(dbErr.message, 500);

  return json({ data, total: count, page, limit, role });
}

async function handleCheckout(client: SupabaseClient, body: unknown) {
  const { user, role } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);
  if (!["admin", "staff"].includes(role ?? "")) {
    return error("FORBIDDEN: Only admin or staff may perform checkouts.", 403);
  }

  const { athlete_id, items, expected_return_date, remarks } =
    body as {
      athlete_id: string;
      items: { equipment_id: string; quantity: number; condition?: string }[];
      expected_return_date: string;
      remarks?: string;
    };

  if (!athlete_id || !items?.length || !expected_return_date) {
    return error("Missing required fields: athlete_id, items, expected_return_date");
  }

  // Get approved_by user id from the app users table
  const svcClient = buildServiceClient();
  const { data: approver } = await svcClient
    .from("users")
    .select("id")
    .eq("user_auth_id", user.id)
    .single();

  const { data, error: rpcErr } = await svcClient.rpc("checkout_equipment", {
    p_athlete_id: athlete_id,
    p_items: items,
    p_expected_return: expected_return_date,
    p_approved_by: approver?.id ?? null,
    p_remarks: remarks ?? null,
  });

  if (rpcErr) return error(rpcErr.message, 422);
  return json(data, 201);
}

async function handleReturn(client: SupabaseClient, body: unknown) {
  const { user, role } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);
  if (!["admin", "staff"].includes(role ?? "")) {
    return error("FORBIDDEN: Only admin or staff may process returns.", 403);
  }

  const { transaction_id, items } = body as {
    transaction_id: string;
    items: { item_id: string; returned_quantity: number; condition_after?: string }[];
  };

  if (!transaction_id || !items?.length) {
    return error("Missing required fields: transaction_id, items");
  }

  const svcClient = buildServiceClient();
  const { data: receiver } = await svcClient
    .from("users")
    .select("id")
    .eq("user_auth_id", user.id)
    .single();

  const { data, error: rpcErr } = await svcClient.rpc("return_borrowed_items", {
    p_transaction_id: transaction_id,
    p_items: items,
    p_received_by: receiver?.id ?? null,
  });

  if (rpcErr) return error(rpcErr.message, 422);
  return json(data);
}

async function handleMaintenance(client: SupabaseClient, body: unknown) {
  const { user, role } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);
  if (!["admin", "staff"].includes(role ?? "")) {
    return error("FORBIDDEN: Only admin or staff may create maintenance records.", 403);
  }

  const { equipment_id, issue_description, scheduled_date, cost } = body as {
    equipment_id: string;
    issue_description: string;
    scheduled_date: string;
    cost?: number;
  };

  if (!equipment_id || !issue_description || !scheduled_date) {
    return error("Missing required fields: equipment_id, issue_description, scheduled_date");
  }

  const svcClient = buildServiceClient();
  const { data: reporter } = await svcClient
    .from("users")
    .select("id")
    .eq("user_auth_id", user.id)
    .single();

  const { data, error: dbErr } = await svcClient
    .from("maintenance_records")
    .insert({
      equipment_id,
      reported_by: reporter?.id,
      issue_description,
      scheduled_date,
      cost: cost ?? 0,
    })
    .select()
    .single();

  if (dbErr) return error(dbErr.message, 422);
  return json(data, 201);
}

async function handleTransactions(client: SupabaseClient, url: URL) {
  const { user, role } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);

  const statusFilter = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;

  // RLS on borrowing_transactions already enforces role-specific visibility
  let query = client
    .from("borrowing_transactions")
    .select(
      "*, athlete:athletes(*, user:users(*)), approver:users(*), items:borrowing_items(*, equipment:equipment(*))",
      { count: "exact" }
    )
    .range(offset, offset + limit - 1)
    .order("borrow_date", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error: dbErr, count } = await query;
  if (dbErr) return error(dbErr.message, 500);

  return json({ data, total: count, page, limit, role });
}

async function handleAuditLogs(client: SupabaseClient, url: URL) {
  const { user, role } = await getUserAndRole(client);
  if (!user) return error("Unauthorized", 401);
  if (role !== "admin") return error("FORBIDDEN: Audit logs are admin-only.", 403);

  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 200);
  const offset = (page - 1) * limit;

  const { data, error: dbErr, count } = await client
    .from("audit_logs")
    .select("*, performer:users(*)", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (dbErr) return error(dbErr.message, 500);
  return json({ data, total: count, page, limit });
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "");
  const method = req.method;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return error("Missing Authorization header", 401);

  const client = buildClientForCaller(authHeader);
  let body: unknown = {};
  if (method === "POST" || method === "PUT") {
    try {
      body = await req.json();
    } catch {
      return error("Invalid JSON body");
    }
  }

  // Route dispatch
  if (path === "/me" && method === "GET") return handleMe(client);
  if (path === "/equipment" && method === "GET") return handleEquipment(client, url);
  if (path === "/checkout" && method === "POST") return handleCheckout(client, body);
  if (path === "/return" && method === "POST") return handleReturn(client, body);
  if (path === "/maintenance" && method === "POST") return handleMaintenance(client, body);
  if (path === "/transactions" && method === "GET") return handleTransactions(client, url);
  if (path === "/audit-logs" && method === "GET") return handleAuditLogs(client, url);

  return json(
    {
      name: "FARE-ERP Backend API",
      version: "1.0.0",
      routes: [
        "GET /api/me",
        "GET /api/equipment",
        "POST /api/checkout",
        "POST /api/return",
        "POST /api/maintenance",
        "GET /api/transactions",
        "GET /api/audit-logs",
      ],
    },
    200
  );
});

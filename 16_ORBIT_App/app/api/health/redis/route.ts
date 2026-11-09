import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only diagnostic; no keys, credentials, hostnames or data are returned. */
export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      { ok: false, component: "redis", code: "REDIS_CONFIGURATION_MISSING", configured: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    // ping is read-only and does not alter any Studio Brain records.
    const result = await Redis.fromEnv().ping();
    return NextResponse.json(
      { ok: result === "PONG", component: "redis", code: result === "PONG" ? "OK" : "REDIS_UNEXPECTED_RESPONSE", configured: true },
      { status: result === "PONG" ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const err = error as Error & { cause?: { code?: string } };
    const allowedCodes = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "CERT_HAS_EXPIRED"]);
    const causeCode = allowedCodes.has(err.cause?.code || "") ? err.cause!.code : "UPSTREAM_UNREACHABLE";
    return NextResponse.json(
      { ok: false, component: "redis", configured: true, code: "REDIS_CONNECT_FAILED", causeCode },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

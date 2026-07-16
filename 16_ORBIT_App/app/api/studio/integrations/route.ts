import { NextRequest, NextResponse } from "next/server";
import { listIntegrations, runIntegrationSync } from "@/lib/studioBrain";
import { IntegrationId } from "@/lib/types";
import { requireEnum } from "@/lib/validation";

export const dynamic = "force-dynamic";

const INTEGRATION_IDS: IntegrationId[] = ["github", "vercel", "redis", "drive", "calendar"];

export async function GET() {
  try {
    const integrations = await listIntegrations();
    return NextResponse.json(integrations);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: string };
    const id = requireEnum(body.id, INTEGRATION_IDS, "id");
    const state = await runIntegrationSync(id);
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

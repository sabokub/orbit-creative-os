import { NextRequest, NextResponse } from "next/server";
import { listAgentDefinitions } from "@/lib/agents/registry";
import { memoryService } from "@/lib/agents/server";
import { MemoryEntry } from "@/lib/agents/contracts";

export const dynamic = "force-dynamic";

/**
 * GET: the agent roster for a project — each agent's static definition plus
 * its current state derived from memory (latest non-superseded output).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entries = await memoryService().list(params.id);
    const latestByRole = new Map<string, MemoryEntry>();
    for (const e of entries) {
      if (!e.agentRole || e.status === "superseded") continue;
      const prev = latestByRole.get(e.agentRole);
      if (!prev || e.createdAt > prev.createdAt) latestByRole.set(e.agentRole, e);
    }

    const agents = listAgentDefinitions().map((def) => {
      const current = latestByRole.get(def.role);
      return {
        role: def.role,
        title: def.title,
        description: def.description,
        produces: def.produces,
        dependencies: def.dependencies,
        status: current?.status ?? "not_run",
        memoryId: current?.id,
        summary: current?.content,
        updatedAt: current?.updatedAt,
      };
    });

    return NextResponse.json(agents);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { ClaudeCodeReportSchema } from "@/lib/sync/contracts";
import { syncService, verifyIngestSecret } from "@/lib/sync/server";
import { assertReasonablePayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Authenticated Claude Code progress ingestion. Verifies a shared secret
 * (X-Orbit-Secret header or `secret` body field, checked against
 * ORBIT_INGEST_SECRET — server-only), validates the payload with Zod, refuses
 * duplicates, and appends a journal entry. Returns exactly what changed.
 *
 * A Claude claim is never treated as verified proof: entries land as
 * "declared" (see VerificationLevel). GitHub-based verification is layered on
 * later.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const provided = req.headers.get("x-orbit-secret") ?? (typeof body.secret === "string" ? body.secret : null);
    if (!verifyIngestSecret(provided)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const report = ClaudeCodeReportSchema.parse(body.report ?? body);

    const project = await getProject(report.projectId);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const { duplicate, entry } = await syncService().ingestClaudeCodeReport(report);
    if (duplicate) {
      return NextResponse.json({ duplicate: true, changed: [] }, { status: 200 });
    }
    return NextResponse.json(
      {
        duplicate: false,
        entryId: entry?.id,
        changed: {
          journalEntry: entry?.id,
          tasksCompleted: entry?.tasksCompleted ?? [],
          tasksCreated: entry?.tasksCreated ?? [],
          filesChanged: entry?.filesChanged ?? [],
          commit: entry?.commitSha,
          branch: entry?.branch,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

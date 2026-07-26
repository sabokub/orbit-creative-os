import { NextResponse } from "next/server";
import { applyConversationUpdates20260726 } from "@/lib/applyConversationUpdates20260726";

export async function POST() {
  try {
    return NextResponse.json(await applyConversationUpdates20260726());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 500 }
    );
  }
}

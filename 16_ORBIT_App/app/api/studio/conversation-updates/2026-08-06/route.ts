import { NextResponse } from "next/server";
import { applyConversationUpdates20260806 } from "@/lib/applyConversationUpdates20260806";

export async function POST() {
  try {
    return NextResponse.json(await applyConversationUpdates20260806());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 500 }
    );
  }
}

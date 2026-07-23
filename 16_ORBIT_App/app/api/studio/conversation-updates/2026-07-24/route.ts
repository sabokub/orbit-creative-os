import { NextResponse } from "next/server";
import { applyConversationUpdates20260724 } from "@/lib/applyConversationUpdates20260724";

export async function POST() {
  try {
    return NextResponse.json(await applyConversationUpdates20260724());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 500 }
    );
  }
}

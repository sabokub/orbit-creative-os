import { NextResponse } from "next/server";
import { applyConversationUpdates20260810 } from "@/lib/applyConversationUpdates20260810";

export async function POST() {
  try {
    return NextResponse.json(await applyConversationUpdates20260810());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 500 }
    );
  }
}

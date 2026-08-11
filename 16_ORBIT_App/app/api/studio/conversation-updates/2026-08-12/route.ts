import { NextResponse } from "next/server";
import { applyConversationUpdates20260812 } from "@/lib/applyConversationUpdates20260812";

export async function POST() {
  try {
    return NextResponse.json(await applyConversationUpdates20260812());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 500 }
    );
  }
}

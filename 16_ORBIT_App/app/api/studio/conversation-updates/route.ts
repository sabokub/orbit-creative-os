import { NextResponse } from "next/server";
import { applyLatestConversationUpdates } from "@/lib/applyConversationUpdates";

export async function POST() {
  try {
    const result = await applyLatestConversationUpdates();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 500 }
    );
  }
}

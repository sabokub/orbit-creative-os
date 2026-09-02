import { NextResponse } from "next/server";
import { applyLaunchRecovery20260902 } from "@/lib/applyLaunchRecovery20260902";

export async function POST() {
  try {
    return NextResponse.json(await applyLaunchRecovery20260902());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Launch recovery update failed" },
      { status: 500 }
    );
  }
}

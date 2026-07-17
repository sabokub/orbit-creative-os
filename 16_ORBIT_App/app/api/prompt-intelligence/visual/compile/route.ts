import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { compileVisualPrompts } from "@/lib/promptIntelligence/visual/engine";
export async function POST(request:NextRequest){try{return NextResponse.json(compileVisualPrompts(await request.json()));}catch(error){return NextResponse.json({error:error instanceof ZodError?error.flatten():error instanceof Error?error.message:"Invalid request"},{status:400});}}

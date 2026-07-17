Exit code: 0
Wall time: 1.5 seconds
Output:
import { CompiledVisualPrompt, GenerationRecord, PromptLearning, VisualReview } from "./contracts";

/** Provider-neutral fallback: the prompt can be copied out and its result imported later. */
export function createExternalGeneration(prompt: CompiledVisualPrompt): GenerationRecord {
  return { id:`generation-${prompt.id}`,promptId:prompt.id,projectId:prompt.projectId,generator:prompt.generator,mode:"external",status:"awaiting-external",createdAt:new Date().toISOString() };
}
export function attachExternalAsset(record:GenerationRecord,assetUrl:string):GenerationRecord { if(!assetUrl.trim())throw new Error("An asset URL or stable local reference is required");return {...record,assetUrl,status:"complete"}; }
export function captureReview(generationId:string,input:Omit<VisualReview,"id"|"generationId"|"createdAt">):VisualReview{return{id:`review-${generationId}-${Date.now()}`,generationId,...input,createdAt:new Date().toISOString()};}
/** Learning is always proposed, never silently promoted to an active project rule. */
export function proposeLearning(projectId:string,generator:CompiledVisualPrompt["generator"],review:VisualReview,observation:string,scope:PromptLearning["scope"]="asset"):PromptLearning{return{id:`learning-${review.id}`,projectId,generator,scope,observation,approved:false,sourceReviewId:review.id};}
export function appendPromptVersion(history:CompiledVisualPrompt[],next:CompiledVisualPrompt):CompiledVisualPrompt[]{return history.some(p=>p.id===next.id)?history:[...history,next];}


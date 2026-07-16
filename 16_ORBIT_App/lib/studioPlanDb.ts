import "server-only";
import { Redis } from "@upstash/redis";
import { DEFAULT_STUDIO_PLAN, PlanPriority, PlanStatus, StudioPlan } from "./studioPlan";

const STUDIO_PLAN_KEY = "orbit-hub:studio-plan";
function hasRedisEnv(){return Boolean((process.env.KV_REST_API_URL&&process.env.KV_REST_API_TOKEN)||(process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN))}
function client():Redis{if(!hasRedisEnv())throw new Error("Aucune base Redis connectée pour le plan 24March.");return Redis.fromEnv()}
function normalizeStatus(value:unknown):PlanStatus{return value==="done"||value==="in-progress"||value==="review"||value==="todo"?value:"todo"}
function normalizePriority(value:unknown):PlanPriority{return value==="high"||value==="medium"||value==="low"?value:"medium"}
function mergeById<T extends {id:string}>(stored:T[]|undefined,defaults:T[]):T[]{const map=new Map(defaults.map(item=>[item.id,item]));for(const item of stored||[])map.set(item.id,{...(map.get(item.id)||{}),...item} as T);return [...map.values()]}
function normalizePlan(plan:StudioPlan):StudioPlan{
 const priorities=mergeById(plan.priorities,DEFAULT_STUDIO_PLAN.priorities).map((item,index)=>({...item,status:normalizeStatus(item.status),priority:normalizePriority(item.priority),order:item.order??index+1,durationMinutes:item.durationMinutes??60}));
 const contentQueue=mergeById(plan.contentQueue,DEFAULT_STUDIO_PLAN.contentQueue).map((item,index)=>({...item,status:normalizeStatus(item.status),priority:normalizePriority(item.priority),timing:item.timing||"À planifier",order:item.order??index+1,durationMinutes:item.durationMinutes??30}));
 return {...DEFAULT_STUDIO_PLAN,...plan,priorities,contentQueue,decisions:mergeById(plan.decisions,DEFAULT_STUDIO_PLAN.decisions),sitePages:mergeById(plan.sitePages,DEFAULT_STUDIO_PLAN.sitePages),tracks:mergeById(plan.tracks,DEFAULT_STUDIO_PLAN.tracks)};
}
export async function getStudioPlan():Promise<StudioPlan>{const redis=client();const stored=await redis.get<StudioPlan>(STUDIO_PLAN_KEY);if(stored){const normalized=normalizePlan(stored);await redis.set(STUDIO_PLAN_KEY,normalized);return normalized}await redis.set(STUDIO_PLAN_KEY,DEFAULT_STUDIO_PLAN);return DEFAULT_STUDIO_PLAN}
export async function saveStudioPlan(plan:StudioPlan):Promise<StudioPlan>{const nextPlan=normalizePlan({...plan,updatedAt:new Date().toISOString()});await client().set(STUDIO_PLAN_KEY,nextPlan);return nextPlan}

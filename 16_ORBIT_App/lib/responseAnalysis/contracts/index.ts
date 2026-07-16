import { WorkflowStep } from "../../types";
import { WEBSITE_CONTRACT } from "./website";
import { CONTENT_CONTRACT, CREATIVE_CONTRACT, IMAGES_CONTRACT, REVIEW_CONTRACT, STRATEGY_CONTRACT } from "./stubs";
import { ModuleContract } from "./types";

export * from "./types";
export { WEBSITE_CONTRACT } from "./website";

const CONTRACTS: Record<WorkflowStep, ModuleContract> = {
  strategy: STRATEGY_CONTRACT,
  creative: CREATIVE_CONTRACT,
  website: WEBSITE_CONTRACT,
  content: CONTENT_CONTRACT,
  images: IMAGES_CONTRACT,
  review: REVIEW_CONTRACT,
};

export function getModuleContract(step: WorkflowStep): ModuleContract {
  return CONTRACTS[step];
}

export function allModuleContracts(): ModuleContract[] {
  return Object.values(CONTRACTS);
}

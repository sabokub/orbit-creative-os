import { describe, expect, it } from "vitest";
import { PROMPT_TARGET_MODELS } from "../knowledge/schema";
import { allModelProfiles, getModelProfile } from "./modelProfiles";

describe("Model-specific adaptation profiles", () => {
  it("has exactly one profile per declared target model", () => {
    expect(allModelProfiles()).toHaveLength(PROMPT_TARGET_MODELS.length);
    for (const model of PROMPT_TARGET_MODELS) {
      expect(getModelProfile(model).targetModel).toBe(model);
    }
  });

  it("image/video profiles favor negative constraints and camera vocabulary; text profiles don't", () => {
    expect(getModelProfile("openai-image").useNegativeConstraints).toBe(true);
    expect(getModelProfile("openai-image").useCameraVocabulary).toBe(true);
    expect(getModelProfile("nano-banana-image").useCameraVocabulary).toBe(true);
    expect(getModelProfile("sora-video").useCameraVocabulary).toBe(true);
    expect(getModelProfile("openai-text").useCameraVocabulary).toBe(false);
    expect(getModelProfile("claude-text").useCameraVocabulary).toBe(false);
  });

  it("image/video profiles never claim an unconfirmed API parameter — they carry an explicit caveat instead", () => {
    for (const model of ["openai-image", "nano-banana-image", "sora-video"] as const) {
      expect(getModelProfile(model).caveat).toBeTruthy();
    }
  });

  it("every profile declares a section order covering the section ids it actually uses", () => {
    for (const profile of allModelProfiles()) {
      expect(profile.sectionOrderHint.length).toBeGreaterThan(0);
    }
  });
});

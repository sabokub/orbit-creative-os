import { BrandProfile, ProjectBrief, WorkflowStep } from "./types";

export const STEP_LABELS: Record<WorkflowStep, string> = {
  strategy: "Stratégie de marque",
  creative: "Direction créative",
  website: "Site internet",
  content: "Contenu réseaux",
  images: "Prompts image",
  review: "Review critique",
};

export const STEP_ORDER: WorkflowStep[] = [
  "strategy",
  "creative",
  "website",
  "content",
  "images",
  "review",
];

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value || "(non renseigné)"),
    template
  );
}

const STRATEGY_TEMPLATE = `Act as Orbit Brand. Build the positioning for this project. Use this structure: diagnosis, audience insight, positioning, promise, message pillars, risks, next actions.

Brand Profile (identité fixe — ne pas réinventer, seulement affiner pour ce livrable):
Name: {{brand_name}}
Activity: {{brand_activity}}
Audience: {{brand_audience}}
Offer: {{brand_offer}}
Existing positioning: {{brand_positioning}}
Brand promise: {{brand_promise}}
Message pillars: {{brand_pillars}}

Project Brief (contexte spécifique à ce livrable):
Project: {{project_name}}
Goal: {{project_goal}}
Specific context: {{specific_context}}
Success criteria: {{success_criteria}}`;

const CREATIVE_TEMPLATE = `Act as Orbit Creative. Translate this strategy into a visual territory with colour behaviour, lighting language, composition language, styling language and creative risks.

Brand Profile:
Visual direction: {{brand_visual_direction}}
Photography direction: {{brand_photography}}
Colors: {{brand_colors}}
Avoid: {{brand_avoid}}

Project Brief:
Project: {{project_name}}
Specific context: {{specific_context}}
References: {{references}}

Strategy (paste the output of the previous step here):
{{strategy_output}}`;

const WEBSITE_TEMPLATE = `Act as Orbit Website, working with Orbit Brand and Orbit Creative context already established.

Goal: produce a complete, ready-to-use website structure and copywriting for the project below. Do not skip strategy — if positioning is weak or missing, state the assumption you're making and proceed.

Brand Profile (identité fixe de la marque, valable pour tous les livrables):
Name: {{brand_name}}
Activity: {{brand_activity}}
Audience: {{brand_audience}}
Offer: {{brand_offer}}
Positioning: {{brand_positioning}}
Visual direction: {{brand_visual_direction}}
Tone of voice: {{brand_tone}}
Colors: {{brand_colors}}
Website direction: {{brand_website_direction}}
Avoid: {{brand_avoid}}

Project Brief (contexte spécifique à ce livrable):
Project: {{project_name}}
Goal: {{project_goal}}
Specific context: {{specific_context}}
Deliverable: {{deliverable_type}}
Channels: {{channels}}

Strategy + creative direction (paste previous outputs here):
{{strategy_output}}
{{creative_output}}

Produce, in this exact order, with full copywriting (no placeholders):
1. Web positioning
2. Hero promise
3. Sitemap
4. Homepage structure
5. Section copywriting
6. CTA
7. Proof elements
8. Offers reformulated for web
9. FAQ (5-8 Q&A)
10. Hero image direction
11. Image prompts per section
12. SEO basics (meta title, meta description)
13. UX writing tone

Output format: Markdown, with ## for each of the 13 items.`;

const CONTENT_TEMPLATE = `Act as Orbit Content, working with Orbit Brand and Orbit Creative context already established.

Goal: produce a complete, ready-to-use 30-day social content system for the project below.

Brand Profile:
Name: {{brand_name}}
Audience: {{brand_audience}}
Offer: {{brand_offer}}
Tone of voice: {{brand_tone}}
Visual direction: {{brand_visual_direction}}
Content direction: {{brand_content_direction}}
Avoid: {{brand_avoid}}

Project Brief:
Project: {{project_name}}
Goal: {{project_goal}}
Specific context: {{specific_context}}
Channels: {{channels}}

Strategy + creative direction (paste previous outputs here):
{{strategy_output}}
{{creative_output}}

Produce, in this exact order:
1. Content pillars (4-5)
2. Recurring formats per pillar
3. 30 post ideas (numbered, tagged with pillar)
4. 10 reel ideas (hook + concept)
5. 10 hooks
6. 5 caption examples, full text
7. Visual prompts for the 5 captions + 10 reels (short direction)
8. 30-day calendar (table: day, channel, format, topic, pillar)
9. Reuse logic
10. Channel goals (per channel listed above)

Output format: Markdown, with ## for each of the 10 items, and a Markdown table for item 8.`;

const IMAGES_TEMPLATE = `Act as Orbit Image, working with Orbit Creative context already established.

Goal: produce complete, production-ready image prompts for the visual needs of this project, all coherent with a single Visual DNA.

Brand Profile:
Visual direction: {{brand_visual_direction}}
Photography direction: {{brand_photography}}
Colors: {{brand_colors}}
Image prompt rules: {{brand_image_rules}}
Avoid: {{brand_avoid}}

Project Brief:
Project: {{project_name}}
Specific context: {{specific_context}}
Deliverable: {{deliverable_type}}

Creative direction (paste previous output here):
{{creative_output}}

Website + content outputs to illustrate (paste relevant sections here):
{{website_output}}
{{content_output}}

For each visual need (hero, website sections, Instagram post, Pinterest pin, moodboard), produce a full image brief using this exact structure:
Subject / Environment / Composition / Lighting / Materials / Colour behaviour / Styling / Camera logic / Output format / Negative constraints.

Then produce 2-3 variations for the hero and one flagship social post, and a 5-criteria review checklist.

Output format: Markdown, one ## section per visual need.`;

const REVIEW_TEMPLATE = `Act as Orbit Critic.

Goal: review the output below and return a grounded, prioritized, actionable critique.

Brand Profile (reference DNA to review against):
Name: {{brand_name}}
Positioning: {{brand_positioning}}
Visual direction: {{brand_visual_direction}}
Tone of voice: {{brand_tone}}
Avoid: {{brand_avoid}}

Project Brief:
Project: {{project_name}}
What to review: {{review_target}}
Objective: {{project_goal}}
Success criteria: {{success_criteria}}

Output to review:
{{review_input}}

Produce, in this exact order:
1. Overall verdict
2. Score (X/10, with justification)
3. Strengths (2-4, specific)
4. Issues (ordered by impact)
5. Severity per issue (Low / Medium / High / Critical)
6. Risks
7. Recommended fixes
8. Approval status: Approved (score >= 8, no Critical) / Needs revision (5-7, or Medium/High issue) / Blocked (< 5, or any Critical issue)

Output format: Markdown, with ## for each of the 8 items.`;

const TEMPLATES: Record<WorkflowStep, string> = {
  strategy: STRATEGY_TEMPLATE,
  creative: CREATIVE_TEMPLATE,
  website: WEBSITE_TEMPLATE,
  content: CONTENT_TEMPLATE,
  images: IMAGES_TEMPLATE,
  review: REVIEW_TEMPLATE,
};

export function buildPrompt(
  step: WorkflowStep,
  brand: BrandProfile,
  projectName: string,
  brief: ProjectBrief,
  priorOutputs: Partial<Record<WorkflowStep, string>>,
  reviewTarget?: string
): string {
  const values: Record<string, string> = {
    brand_name: brand.name,
    brand_activity: brand.activity,
    brand_audience: brand.audience,
    brand_offer: brand.offer,
    brand_positioning: brand.positioning,
    brand_promise: brand.brandPromise,
    brand_pillars: brand.messagePillars.map((p) => `- ${p}`).join("\n"),
    brand_visual_direction: brand.visualDirection,
    brand_tone: brand.toneOfVoice,
    brand_colors: brand.colors,
    brand_photography: brand.photographyDirection,
    brand_content_direction: brand.contentDirection,
    brand_website_direction: brand.websiteDirection,
    brand_image_rules: brand.imagePromptRules,
    brand_avoid: brand.avoid.map((a) => `- ${a}`).join("\n"),
    project_name: projectName,
    project_goal: brief.projectGoal,
    specific_context: brief.specificContext,
    deliverable_type: brief.deliverableType,
    references: brief.references,
    constraints: brief.constraints,
    channels: brief.channels,
    format: brief.format,
    success_criteria: brief.successCriteria,
    strategy_output: priorOutputs.strategy || "",
    creative_output: priorOutputs.creative || "",
    website_output: priorOutputs.website || "",
    content_output: priorOutputs.content || "",
    review_target: reviewTarget || "",
    review_input: reviewTarget ? priorOutputs[reviewTarget as WorkflowStep] || "" : "",
  };
  return fill(TEMPLATES[step], values);
}

export function detectReviewStatus(reviewText: string): "Approved" | "Needs revision" | "Blocked" {
  const lower = reviewText.toLowerCase();
  if (lower.includes("blocked")) return "Blocked";
  if (lower.includes("needs revision")) return "Needs revision";
  if (lower.includes("approved")) return "Approved";
  return "Needs revision";
}

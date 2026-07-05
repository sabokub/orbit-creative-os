import { Brief, WorkflowStep } from "./types";

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

Project context:
Name: {{project_name}}
Activity: {{activity}}
Audience: {{audience}}
Offer: {{offer}}
Positioning goal: {{positioning_goal}}
Competitors: {{competitors}}
Constraints: budget {{budget}}, timeline {{timeline}}
Success criteria: {{success_criteria}}`;

const CREATIVE_TEMPLATE = `Act as Orbit Creative. Translate this strategy into a visual territory with colour behaviour, lighting language, composition language, styling language and creative risks.

Project: {{project_name}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
Accent colors: {{colors_accent}}
References: {{references}}

Strategy (paste the output of the previous step here):
{{strategy_output}}`;

const WEBSITE_TEMPLATE = `Act as Orbit Website, working with Orbit Brand and Orbit Creative context already established.

Goal: produce a complete, ready-to-use website structure and copywriting for the project below. Do not skip strategy — if positioning is weak or missing, state the assumption you're making and proceed.

Project context:
Name: {{project_name}}
Activity: {{activity}}
Audience: {{audience}}
Offer: {{offer}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
Accent colors: {{colors_accent}}
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

Project: {{project_name}}
Audience: {{audience}}
Offer: {{offer}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
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
10. Channel goals (Instagram, TikTok, Pinterest)

Output format: Markdown, with ## for each of the 10 items, and a Markdown table for item 8.`;

const IMAGES_TEMPLATE = `Act as Orbit Image, working with Orbit Creative context already established.

Goal: produce complete, production-ready image prompts for the visual needs of this project, all coherent with a single Visual DNA.

Project: {{project_name}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
Accent colors: {{colors_accent}} (accent only, never dominant)

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

Project: {{project_name}}
What to review: {{review_target}}
Objective: {{positioning_goal}}
Target audience: {{audience}}
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
  brief: Brief,
  priorOutputs: Partial<Record<WorkflowStep, string>>,
  reviewTarget?: string
): string {
  const values: Record<string, string> = {
    ...brief,
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

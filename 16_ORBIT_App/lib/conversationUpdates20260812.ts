export const CONVERSATION_UPDATE_2026_08_12 =
  "orbit-hub:migrations:conversation-update-2026-08-12";

export const VISUAL_QA_2026_08_12 = {
  status: "visual_benchmark_v1_baseline_active",
  ownership: [
    "11_VISUAL_QA_SYSTEM reste le référentiel de règles QA ; ne pas y saisir les résultats de tests.",
    "Les résultats sont saisis dans 13_VISUAL_BENCHMARK_PROMPTS / Google Sheet.",
    "Ne pas modifier les règles QA pendant la collecte du baseline V1.",
  ],
  firstPass: [
    "First-pass = génération initiale, sans correction manuelle ni itération corrective.",
    "Chaque image reçoit PASS, BORDERLINE ou FAIL.",
    "Le first-pass doit satisfaire à la fois le brief du prompt et la direction artistique 24March.",
    "Échec du brief ou de la DA = FAIL.",
    "PASS uniquement si l’image est publiable telle quelle.",
  ],
  benchmarkProtocol: [
    "Le benchmark V1 contient 50 tests.",
    "Terminer les 50 tests sans changer les règles ni le système en cours de route afin d’obtenir un baseline comparable.",
    "Une analyse intermédiaire est possible, mais les corrections structurelles attendent la fin du baseline.",
    "Après baseline, corriger le système puis relancer les mêmes 50 tests pour mesurer le delta.",
    "T01–T30 : champ Risque testé vide.",
    "RT01–RT20 : champ Risque testé prérempli et inchangé ; il nomme la dérive volontairement testée.",
  ],
  glossary: [
    "Bruit visuel = quantité de sollicitations concurrentes ; cible 3–5/10, avec un héros dominant et un accompagnant.",
    "Bruit visuel 7–10/10 = fourre-tout / FAIL ; 0–1/10 = trop vide ou trop sage / FAIL.",
    "Singularité = niveau de personnalité propre, immédiatement reconnaissable ; cible 6–8/10.",
    "Singularité <5 = banal ou safe ; 10 = gimmick forcé.",
    "Blacklist = critère précis à noter PASS/BORDERLINE/FAIL.",
    "Cause principale = raison dominante expliquant l’échec global ; elle peut correspondre à une blacklist sans s’y réduire.",
  ],
  socialContent: [
    "Éviter une posture excluante ou anti-Pinterest ; expliquer plutôt la promesse comme Pinterest en mieux, plus personnel et mieux dirigé.",
    "Le contenu doit donner envie de rejoindre l’aventure 24March, pas simplement expliquer le service.",
    "Ton naturel, incarné, avec slang possible quand il sert le rythme.",
    "Chaque épisode doit remettre brièvement le contexte puis teaser l’épisode suivant.",
    "Ne pas utiliser la narration : ces éléments fonctionnent individuellement mais pas ensemble.",
  ],
} as const;

export type StudioUpdateItemKey20260812 =
  | "visualQa"
  | "benchmark"
  | "contentTone";

export interface ConversationDecisionSeed20260812 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260812;
}

export const CONVERSATION_DECISIONS_2026_08_12: ConversationDecisionSeed20260812[] = [
  {
    question: "Où saisir les résultats du benchmark visuel ?",
    context: "Le référentiel QA et les résultats doivent rester séparés.",
    options: ["13_VISUAL_BENCHMARK_PROMPTS / Google Sheet", "11_VISUAL_QA_SYSTEM"],
    resolution: "13_VISUAL_BENCHMARK_PROMPTS / Google Sheet",
    relatedItemKey: "visualQa",
  },
  {
    question: "Que signifie first-pass ?",
    context: "Le benchmark doit mesurer la capacité réelle du système avant correction.",
    options: ["Génération initiale sans correction", "Meilleure version après plusieurs itérations"],
    resolution: "Génération initiale sans correction",
    relatedItemKey: "benchmark",
  },
  {
    question: "Que doit satisfaire un PASS first-pass ?",
    context: "Une image peut remplir le texte du prompt tout en ratant la DA 24March.",
    options: ["Brief + DA 24March + publiable telle quelle", "Brief uniquement"],
    resolution: "Brief + DA 24March + publiable telle quelle",
    relatedItemKey: "benchmark",
  },
  {
    question: "Quand modifier les règles après les premiers tests ?",
    context: "Changer le système au milieu du benchmark détruirait la comparabilité du baseline V1.",
    options: ["Après les 50 tests du baseline", "Dès les premiers échecs"],
    resolution: "Après les 50 tests du baseline",
    relatedItemKey: "benchmark",
  },
  {
    question: "Comment utiliser le champ Risque testé ?",
    context: "Le champ sert uniquement aux scénarios Red-Team.",
    options: ["Vide T01–T30, prérempli RT01–RT20", "Toujours rempli"],
    resolution: "Vide T01–T30, prérempli RT01–RT20",
    relatedItemKey: "benchmark",
  },
  {
    question: "Comment parler de Pinterest dans le contenu 24March ?",
    context: "La communication ne doit pas exclure les personnes qui utilisent Pinterest.",
    options: ["Pinterest en mieux, plus personnel et dirigé", "Pas Pinterest"],
    resolution: "Pinterest en mieux, plus personnel et dirigé",
    relatedItemKey: "contentTone",
  },
  {
    question: "Quelle structure conserver entre les épisodes vidéo ?",
    context: "La série doit rester suivable et créer une continuité.",
    options: ["Remise en contexte + teaser du prochain épisode", "Épisodes totalement autonomes sans teaser"],
    resolution: "Remise en contexte + teaser du prochain épisode",
    relatedItemKey: "contentTone",
  },
];

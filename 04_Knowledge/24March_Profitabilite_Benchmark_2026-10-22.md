# 24MARCH Studio — Benchmark coûts & rentabilité

**Date de référence :** 22 octobre 2026  
**État :** BASELINE / suivi interne (non validé comme modèle économique définitif)  
**Périmètre :** offres de décoration digitale, automatisation IA maximale avec arbitrages et validations humaines conservés.  
**Prochaine comparaison :** après trois projets tests complets et chronométrés.

## 1. Décision opérationnelle (22 octobre 2026)

- Produire au maximum avec l'IA : analyse, proposition, sourcing, planches, visuels, contrôles préparatoires.
- Conserver à la propriétaire les décisions humaines essentielles : direction artistique, refus/approbation, choix produits, acceptation des livrables.
- Ne pas prendre un objectif d'automatisation pour une mesure de temps réellement atteinte.
- Suivre séparément **R&D non facturée** et **prestations client facturées**. Maya est un test fictif, pas un client encaissé.
- Aucun changement de prix ni de plafond IA décidé à cette date.

## 2. Tarifs affichés au 22 octobre 2026

Source : `sabokub/24march-studio-site`, `lib/services.ts` sur `main`.

| Catégorie | Prix public |
|---|---:|
| Petite pièce | 319 € |
| Pièce standard, dont salon Maya | 349 € |
| Grande pièce | 399 € |

**Attention au périmètre :** le site promet notamment moodboard, plan 2D, sélection mobilier/décoration et shopping list. Le test Maya n'évalue pour l'instant que la direction textuelle, pas tous ces livrables.

## 3. Coûts réellement enregistrés : Maya V3, salon 19,4 m²

Test : `test-client-01-maya-v2` (nom historique), profil synthétique V3, budget mobilier fictif 1 900 €. Pas de facture émise ni paiement reçu.

| Opération | Modèle | Coût enregistré, USD | Résultat |
|---|---|---:|---|
| Observer initial | Claude Sonnet 5.5 | 0,0504 $ | Terminé |
| Director initial | Claude Sonnet 5.5 | 0,1278 $ | Direction r0 produite, refusée |
| Critic initial | Claude Opus 5.5 | 0,2812 $ | Verdict : revise |
| Director révision r1 | Claude Sonnet 5.5 | 0,2033 $ | Tronqué : max_tokens |
| **TOTAL historique Maya** | | **0,6627 $** | **0 image, aucun livrable validé** |

Détails du dernier appel : 21 641 tokens d'entrée, 16 000 tokens de sortie, `stop_reason=max_tokens`. Réponse brute sauvegardée mais direction esthétique refusée ; ne pas traiter cette sortie comme livrable. Aucun appel Critic r1 ni génération d'image.

Preuves (dépôt de production privé) :
- [Council usage](https://github.com/sabokub/24march-client-platform/blob/experiment/atelier-v3-council/studio/runs/test-client-01-maya-v2/council_usage.json)
- [Revision r1 usage](https://github.com/sabokub/24march-client-platform/blob/experiment/atelier-v3-council/studio/runs/test-client-01-maya-v2/rounds/r1/usage.json)
- [Réponse r1 refusée](https://github.com/sabokub/24march-client-platform/blob/experiment/atelier-v3-council/studio/runs/test-client-01-maya-v2/rounds/r1/director.raw.txt)

**Interprétation :** dépense réelle non nulle, résultat incomplet. Pas de marge client calculable sur Maya, puisque projet R&D non vendu et temps humain non mesuré.

## 4. Hypothèses des simulations commerciales (à vérifier sur factures)

- Charges micro : **25,6 % du CA** (hypothèse historique de simulation, régime et situation fiscale à confirmer).
- Stripe : **1,5 % du paiement + 0,25 €** (hypothèse).
- Coût IA texte + visuels retenu au départ : **3 € / projet** (objectif, pas coût mesuré).
- Infrastructure simulée : soit **5 € / projet**, soit **45 € / mois pour 5 projets = 9 € / projet** dans le second scénario.
- Valorisation illustrative du temps humain : **25 € / heure** (non validée comme rémunération cible).
- Exclusions des estimations : impôt sur le revenu, éventuelle CFE, autres frais non mesurés, TVA si applicable, abonnements non attribués et écart USD/EUR. Évaluer sur les bons taux au moment de facturer.
- **Ne pas mélanger dollars de coût Anthropic avec euros sans conversion à la date réelle.**

## 5. Simulation initiale (IA 3 €, infrastructure 5 € par projet)

Montant restant après cotisations supposées, Stripe, IA et infrastructure, **avant valorisation du travail** :

| Offre | Prix | Reste arrondi | Temps supposé | Équivalent horaire |
|---|---:|---:|---:|---:|
| Petite | 319 € | 224 € | 4 h | 56 €/h |
| Standard | 349 € | 246 € | 5 h | 49 €/h |
| Grande | 399 € | 283 € | 6 h 30 | 43 €/h |

## 6. Scénarios salon standard 349 € (infrastructure 9 €/projet)

| Hypothèse | Projet fluide | Complexe | Difficile |
|---|---:|---:|---:|
| Temps humain actif | 5 h | 8 h | 12 h |
| Coût IA estimé | 3 € | 5 € | 8 € |
| Reste après charges, paiement, IA et infra | 242 € | 240 € | 237 € |
| Revenu équivalent par heure | 48 €/h | 30 €/h | 20 €/h |
| Reste économique après valorisation à 25 €/h | **+117 €** | **+40 €** | **−63 €** |

**Lecture :** sensibilité à la durée beaucoup plus forte qu'à quelques euros de tokens. Tous ces temps sont fictifs : ne pas les enregistrer comme performances réelles.

Formule de suivi :  
`reste_avant_travail = prix * (1 - taux_cotisations) - (prix * taux_stripe + fixe_stripe) - cout_IA_EUR - infrastructure_allouee_EUR - autres_frais_EUR`  
`reste_economique = reste_avant_travail - heures_humaines_actives * cout_horaire_interne`

## 7. Prochain test et relevé réel

Comparer au moins trois projets tests représentatifs, de complexités différentes. Pour chaque dossier consigner :
- ID, date, catégorie, prix **réellement encaissé** (ou statut R&D non facturée).
- Temps humain actif par étape : briefing, sélection/LOCK, contrôle, correction, livraison.
- Temps d'attente IA distinct du temps humain.
- Modèles, tokens entrée/sortie, montants fournisseur **réellement facturés**, devise et taux de conversion.
- Nombre de directions refusées, appels échoués, images produites, éditions et révisions.
- Coût exact des générations Higgsfield, autres APIs, frais de paiement et infrastructure allouée.
- Livrables conformes au périmètre commercial, validations humaines, temps final.
- CA, charges, coût de travail, marge réelle et taux de réussite au premier essai.
- Motifs des échecs et choix de poursuite/arrêt.

**Statuts de preuve :** ACTUAL (facture/usage mesuré), SIMULATION (hypothèse), TARGET (objectif), REJECTED (sortie refusée). Ne jamais fusionner ces statuts.

## 8. Décisions non prises / points ouverts

- Budget IA maximal par dossier : **non fixé**.
- Nombre d'itérations incluses : **non fixé**.
- Prix publics actuels : **inchangés**.
- Valeur horaire cible : **non fixée**.
- Coût image Sunburst actuel et coût infrastructure réellement facturé : **à mesurer**.
- Process Maya r1 : **bloqué après sortie tronquée et refus esthétique ; aucune relance payante automatique**.

**But de comparaison :** rentabilité du projet **livré et validé**, pas seulement coût unitaire d'un appel IA.

**Sources métier :** [Directive MASTER 24March](https://docs.google.com/document/d/1ezs4R1a4VsJjBeSL32-stjxsQExz29hOAk2D15tTP5M), [08 workflow client actuel](https://docs.google.com/document/d/1LUtSsKBiRvMLpKU7DefjsXtv0uObgToIBDyAxByTQu8/edit?usp=drivesdk), [06 rentabilité](https://docs.google.com/document/d/1mdSMXQ4C1eW7KVlWev-Ag8itoYw4mIleC98cuko7dEA/edit?usp=drivesdk).

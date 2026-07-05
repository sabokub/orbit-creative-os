# Use Case — Créer un brand kit avec ORBIT

## Objectif

Utiliser ORBIT pour créer un brand kit complet, structuré et cohérent.

## Résultat attendu

Un brand kit doit contenir au minimum :

- Positionnement
- Audience
- Promesse de marque
- Piliers de message
- Ton de voix
- Territoire visuel
- Couleurs
- Typographies
- Direction photo
- Direction graphique
- Règles d'usage
- Prompts image si besoin
- Checklist de review

---

# Workflow recommandé

## 1. Démarrer ORBIT

Dans ChatGPT, commence avec le prompt de démarrage :

`13_ChatGPT_Runtime/Start_Here.md`

Puis annonce clairement :

```text
/orbit-start
Je veux créer un brand kit complet pour [nom du projet].
```

---

## 2. Remplir le brief projet

Utilise :

`13_ChatGPT_Runtime/Orbit_Project_Intake.md`

À fournir :

- nom du projet
- activité
- audience
- offre
- style souhaité
- références
- concurrents
- contraintes
- livrables attendus

---

## 3. Créer la stratégie de marque

Commande :

```text
/brand
Crée la stratégie de marque pour ce projet avant de passer au visuel.
```

ORBIT doit produire :

1. diagnostic
2. audience insight
3. positionnement
4. promesse
5. raisons de croire
6. piliers de message
7. risques
8. prochaines actions

Fichiers utiles :

- `02_Agents/Manuals/Brand_Strategist_Manual.md`
- `10_Prompt_Library/Strategy_Prompts.md`
- `05_Templates/Brand_Strategy_Template.md`

---

## 4. Créer la direction créative

Commande :

```text
/creative
Traduis cette stratégie en territoire visuel et direction créative.
```

ORBIT doit produire :

1. diagnostic créatif
2. territoire visuel
3. visual DNA
4. traduction des références
5. règles de direction artistique
6. red flags
7. prochaines actions

Fichiers utiles :

- `02_Agents/Manuals/Creative_Director_Manual.md`
- `06_Frameworks/Visual_Territory.md`
- `06_Frameworks/Visual_DNA.md`
- `09_Framework_Examples/Visual_Territory_Examples.md`
- `10_Prompt_Library/Creative_Prompts.md`

---

## 5. Générer les éléments du brand kit

Commande :

```text
/creative
À partir de cette stratégie et de ce territoire visuel, crée le brand kit complet.
```

Demande un livrable structuré avec :

## Brand foundations

- Mission
- Vision
- Valeurs
- Positionnement
- Audience
- Promesse
- Piliers de message

## Verbal identity

- Ton de voix
- Mots à utiliser
- Mots à éviter
- Phrases types
- Bio courte
- Bio longue
- Tagline options

## Visual identity

- Direction artistique
- Palette couleur
- Rôle de chaque couleur
- Typographies recommandées
- Règles de composition
- Direction photo
- Direction illustration ou iconographie
- Texture et matière

## Usage rules

- À faire
- À éviter
- Exemples d'application
- Checklist avant publication

---

## 6. Créer les prompts image du brand kit

Commande :

```text
/image
Crée les prompts image nécessaires pour visualiser ce brand kit.
```

Prompts utiles :

- moodboard de marque
- hero visual
- post Instagram
- page site web
- scène intérieure si projet spatial
- mockup carte / affiche / social post

Fichiers utiles :

- `10_Prompt_Library/Image_Prompts.md`
- `02_Agents/Manuals/Image_Director_Manual.md`

---

## 7. Faire la review critique

Commande :

```text
/orbit-review
Passe ce brand kit par Orbit Critic et identifie ce qui doit être amélioré.
```

ORBIT doit vérifier :

- clarté
- différenciation
- cohérence
- crédibilité
- reconnaissance visuelle
- applicabilité
- risques de banalité

Fichiers utiles :

- `02_Agents/Manuals/Critic_Manual.md`
- `10_Prompt_Library/Review_Prompts.md`
- `13_ChatGPT_Runtime/Runtime_Quality_Gate.md`

---

# Prompt complet prêt à copier

```text
/orbit-start
Je veux créer un brand kit complet pour mon projet.

Projet : [nom]
Activité : [description]
Audience : [cible]
Offre : [service ou produit]
Objectif : créer une identité claire, différenciante et exploitable
Style souhaité : [mots-clés]
Références : [liens ou descriptions]
À éviter : [directions à éviter]
Livrable attendu : brand kit complet avec stratégie, ton de voix, territoire visuel, couleurs, typographies, direction photo, règles d'usage et prompts image.

Procède dans cet ordre :
1. stratégie de marque
2. direction créative
3. brand kit structuré
4. prompts image
5. review critique
```

---

# Règle importante

Ne commence jamais par les couleurs ou les typographies.

ORBIT doit d'abord définir :

1. ce que la marque doit faire comprendre
2. à qui elle parle
3. ce qui la rend différente
4. quelle perception elle doit créer

Ensuite seulement, le brand kit visuel peut être produit.

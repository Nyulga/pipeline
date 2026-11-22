---
name: securite
description: Vérifie la sécurité du repo en lecture seule : secrets, fichiers sensibles, failles évidentes. À utiliser avant une mise en production ou quand je demande un contrôle de sécurité.
tools: Read, Grep, Glob, Bash
model: inherit
---

Tu fais un contrôle de sécurité du projet Pipeline, **en lecture seule**. Le repo GitHub est **public** : tout ce qui est commité, et tout l'historique, est visible de tous.

## Lecture seule
- Commandes autorisées : `git ls-files`, `git log`, `git show`, `git grep`, `git check-ignore`, `git status`, `pnpm audit`, `pnpm lint`, `pnpm test`, et les vérifications de `.claude/rules/*.md`.
- Interdit :
  - modifier, créer ou supprimer un fichier ;
  - commit, push, checkout ou reset ;
  - réécrire l'historique ;
  - lancer `pnpm audit --fix` ou une mise à jour de dépendance ;
  - toute requête réseau autre que `pnpm audit`.
- **N'affiche jamais un secret trouvé en entier** : donne le fichier, la ligne et les 4 premiers caractères suivis de `…`. Ne lis pas le contenu des fichiers `.env*` locaux. Vérifie seulement qu'ils sont ignorés et jamais commités.

## Ce que tu vérifies
1. **Secrets dans le code et dans l'historique**
   - Cherche dans les fichiers suivis (`git grep`) et dans tout l'historique (`git log -p --all`) :
     - les jetons Turso (`DATABASE_AUTH_TOKEN`, les JWT `eyJ…`) ;
     - les URL `libsql://` et `*.turso.io` ;
     - les clés d'API (`sk-`, `ghp_`, `AKIA`…) ;
     - les mots de passe et les clés privées (`-----BEGIN`).
   - Un secret présent seulement dans l'historique reste exposé : signale-le comme bloquant. Il faut le révoquer, et la réécriture de l'historique ne suffit pas.
2. **Fichiers sensibles**
   - `.gitignore` couvre `.env*`, `*.db`, `*.sqlite`, `.vercel` et les fichiers de réglages locaux (`.claude/settings.local.json`).
   - Aucun de ces fichiers n'est suivi (`git ls-files`), ni ne l'a été dans l'historique.
   - `pipeline.db` contient de vraies données de contacts : il ne doit jamais être commité.
3. **Configuration**
   - Les secrets sont lus via `process.env` dans `src/data` uniquement.
   - Aucune variable `NEXT_PUBLIC_*` ne contient de secret.
   - Aucun accès à la base ne part vers le client : le test d'architecture et les composants `"use client"` sont à vérifier.
4. **Failles évidentes dans le code**
   - **Injection SQL** : chaque requête de `src/data` passe ses valeurs en `args`, jamais en concaténation ni en gabarit avec une saisie.
   - **Entrées des Server Actions et des routes** (`src/app/actions.ts`, `src/app/**/route.ts`) : elles sont validées (type, longueur, format) avant d'atteindre la base.
   - **XSS** : aucun `dangerouslySetInnerHTML`, ni `href` construit depuis une saisie sans contrôle (`javascript:`).
   - **Export CSV** : les débuts de formule (`= + - @`, tabulation, CR) sont neutralisés et les valeurs échappées.
   - **En-têtes** : `Content-Disposition` et le nom du fichier ne sont pas construits depuis une saisie.
   - **Erreurs** : aucune trace, requête SQL ou valeur d'environnement renvoyée à l'utilisateur.
   - **Accès** : l'app n'a pas d'authentification, et c'est hors périmètre d'après `INTENT.md`. Signale quand même, en information, que les données et l'export sont accessibles à toute personne qui connaît l'URL publique.
5. **Dépendances** : `pnpm audit --prod`, en résumant les vulnérabilités `high` et `critical`, avec le paquet concerné et la version corrigée.

## Rapport
Classe les constats par gravité :
- `bloquant` : un secret exposé, une donnée personnelle commitée, une injection exploitable ;
- `important` ;
- `mineur` ;
- `info`.

Pour chaque constat :
- **Emplacement** : `fichier:ligne`, ou le commit pour l'historique.
- **Risque** : ce qu'un tiers pourrait faire, en une phrase.
- **Correction** : l'action à mener. Pour un secret : le révoquer chez le fournisseur d'abord, puis le retirer.

Termine par une liste de contrôle cochée, un point par section ci-dessus, puis par un verdict : « prêt pour la production » ou « à corriger d'abord ». S'il n'y a aucun constat, dis-le clairement, sans en inventer.

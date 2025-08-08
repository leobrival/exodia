## Fix: bgDark non appliqué en dark mode depuis `src/lib/project-themes.ts`

### Problème
- Les classes dark sont construites dynamiquement (`dark:${theme.bgDark}`), ce que Tailwind ne peut pas analyser statiquement.
- Résultat: les variantes `dark:` ne sont pas générées pour toutes les couleurs, donc pas appliquées.
- Même souci potentiel avec `.../75` composé dynamiquement.

### Hypothèse
- Mettre les variantes `dark:` littéralement dans les chaînes du thème et retirer la concaténation côté composants corrigera la génération CSS.
- Remplacer les `/75` dynamiques par `opacity-75` pour éviter des classes non détectées.

### Plan (MVP)
- [ ] Éditer `src/lib/project-themes.ts`:
  - [ ] Préfixer chaque `bgDark` avec `dark:` (ex: `bg-blue-950` -> `dark:bg-blue-950`).
  - [ ] Préfixer chaque `textDark` avec `dark:` (ex: `text-white` -> `dark:text-white`).
- [ ] Mettre à jour les usages:
  - [ ] `src/components/project/project-card.tsx`
    - [ ] Remplacer `... ${theme.bgLight} dark:${theme.bgDark}` par `... ${theme.bgLight} ${theme.bgDark}`.
    - [ ] Remplacer `... ${theme.textLight} dark:${theme.textDark}` par `... ${theme.textLight} ${theme.textDark}`.
    - [ ] Remplacer `text-sm ${theme.textLight}/75 dark:${theme.textDark}/75` par `text-sm opacity-75 ${theme.textLight} ${theme.textDark}`.
  - [ ] `src/components/project/project-list-item.tsx`
    - [ ] Remplacer `... ${theme.bgLight} dark:${theme.bgDark}` par `... ${theme.bgLight} ${theme.bgDark}`.
- [ ] Vérification manuelle:
  - [ ] Basculer le dark mode via le toggle et vérifier toutes les variantes (quelques thèmes au hasard).

### Notes
- Cette approche garantit que Tailwind « voit » les classes `dark:*` dans le code source.
- Pas de régression attendue en light mode.
- Tests unitaires non pertinents ici (styles utilitaires Tailwind). Vérification manuelle et visuelle suffisante.

# Graph Report - baseline  (2026-07-07)

## Corpus Check
- 48 files · ~17,132 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 308 nodes · 707 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6b738eb2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_store.ts|store.ts]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_types.ts|types.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_session.ts|session.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_Baseline|Baseline]]
- [[_COMMUNITY_BottomNav.tsx|BottomNav.tsx]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_page.tsx|page.tsx]]

## God Nodes (most connected - your core abstractions)
1. `read()` - 27 edges
2. `write()` - 16 edges
3. `compilerOptions` - 16 edges
4. `Reveal()` - 12 edges
5. `applyUpdates()` - 12 edges
6. `generatePlan()` - 11 edges
7. `Profile` - 11 edges
8. `AgentUpdates` - 10 edges
9. `Snapshot` - 10 edges
10. `todayISO()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Body` --references--> `AgentSnapshot`  [EXTRACTED]
  src/app/api/agent/route.ts → src/lib/agent/schema.ts
- `SettingsPage()` --calls--> `defaultProfile()`  [EXTRACTED]
  src/app/settings/page.tsx → src/lib/defaults.ts
- `buildSnapshot()` --calls--> `todayISO()`  [EXTRACTED]
  src/lib/agent/apply.ts → src/lib/store.ts
- `applyUpdates()` --calls--> `todayISO()`  [EXTRACTED]
  src/lib/agent/apply.ts → src/lib/store.ts
- `scoreExercise()` --calls--> `tennisFirst()`  [EXTRACTED]
  src/lib/engine/session.ts → src/lib/defaults.ts

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.09
Nodes (19): TYPE_COLOR, TYPE_COLOR, BlockList(), CountUp(), Props, Props, StatTile(), Disclaimer() (+11 more)

### Community 1 - "store.ts"
Cohesion: 0.12
Nodes (42): GOAL_LABELS, SettingsPage(), CommandBar(), Step, agentModel(), applyUpdates(), buildSnapshot(), defaultProfile() (+34 more)

### Community 2 - "devDependencies"
Cohesion: 0.06
Nodes (33): dependencies, animejs, @anthropic-ai/sdk, framer-motion, gsap, lenis, next, react (+25 more)

### Community 3 - "index.ts"
Cohesion: 0.12
Nodes (28): SEED_MEMORY, tennisFirst(), buildWhy(), generatePlan(), pct(), TITLES, computeReadiness(), DayFlags (+20 more)

### Community 4 - "types.ts"
Cohesion: 0.11
Nodes (26): Body, jsonError(), POST(), DEF, MetricDef, METRICS, AgentSnapshot, AgentUpdates (+18 more)

### Community 5 - "page.tsx"
Cohesion: 0.14
Nodes (12): AREAS, CheckinPage(), scale(), Tennis, CATS, SRC_CLASS, SRC_LABEL, Option (+4 more)

### Community 6 - "layout.tsx"
Cohesion: 0.13
Nodes (13): baloo, metadata, nunito, viewport, Greeting(), MobileNav(), NAV, NavItem (+5 more)

### Community 7 - "session.ts"
Cohesion: 0.15
Nodes (25): buildBlocks(), cooldown(), mobilitySession(), patternArea(), pick(), pool(), PoolOpts, powerSession() (+17 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Baseline"
Cohesion: 0.33
Nodes (5): Baseline, How it works, Roadmap, Run it, Stack

### Community 10 - "BottomNav.tsx"
Cohesion: 0.40
Nodes (3): Item, ITEMS, stroke

### Community 15 - "page.tsx"
Cohesion: 0.27
Nodes (7): NutritionPage(), PLACEHOLDER_TARGETS, SAMPLE_MEALS, sumMacros(), todayISO(), Meal, NutritionDay

## Knowledge Gaps
- **95 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadProfile()` connect `store.ts` to `page.tsx`, `page.tsx`, `layout.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `generatePlan()` connect `index.ts` to `page.tsx`, `store.ts`, `page.tsx`, `session.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Profile` connect `types.ts` to `page.tsx`, `store.ts`, `index.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12156862745098039 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
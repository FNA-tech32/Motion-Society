# Graph Report - baseline  (2026-07-07)

## Corpus Check
- 40 files · ~13,340 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 271 nodes · 538 edges · 15 communities (12 shown, 3 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `read()` - 27 edges
2. `write()` - 16 edges
3. `compilerOptions` - 16 edges
4. `generatePlan()` - 10 edges
5. `Snapshot` - 10 edges
6. `pick()` - 9 edges
7. `scripts` - 8 edges
8. `Reveal()` - 8 edges
9. `pool()` - 8 edges
10. `buildBlocks()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --calls--> `defaultProfile()`  [EXTRACTED]
  src/lib/store.ts → src/lib/defaults.ts
- `scoreExercise()` --calls--> `tennisFirst()`  [EXTRACTED]
  src/lib/engine/session.ts → src/lib/defaults.ts
- `generatePlan()` --calls--> `buildBlocks()`  [EXTRACTED]
  src/lib/engine/index.ts → src/lib/engine/session.ts
- `Snapshot` --references--> `MemoryFact`  [EXTRACTED]
  src/lib/store.ts → src/lib/types.ts
- `Snapshot` --references--> `Profile`  [EXTRACTED]
  src/lib/store.ts → src/lib/types.ts

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.07
Nodes (21): DEF, MetricDef, METRICS, TYPE_COLOR, BlockList(), CountUp(), Props, Props (+13 more)

### Community 1 - "store.ts"
Cohesion: 0.13
Nodes (33): addMeal(), addMemories(), addMemory(), addMetric(), bootstrap(), deleteMemory(), EMPTY, getAiKey() (+25 more)

### Community 2 - "devDependencies"
Cohesion: 0.06
Nodes (33): dependencies, animejs, @anthropic-ai/sdk, framer-motion, gsap, lenis, next, react (+25 more)

### Community 3 - "index.ts"
Cohesion: 0.13
Nodes (28): tennisFirst(), buildWhy(), generatePlan(), pct(), TITLES, computeReadiness(), DayFlags, detectTennis() (+20 more)

### Community 4 - "types.ts"
Cohesion: 0.11
Nodes (19): BY_ID, EXERCISES, PLACEHOLDER_TARGETS, SAMPLE_MEALS, Snapshot, AISettings, CalendarEvent, Checkin (+11 more)

### Community 5 - "page.tsx"
Cohesion: 0.13
Nodes (16): AREAS, CheckinPage(), scale(), Tennis, GOAL_LABELS, OnboardingPage(), Greeting(), Option (+8 more)

### Community 6 - "layout.tsx"
Cohesion: 0.14
Nodes (12): baloo, metadata, nunito, viewport, MobileNav(), NAV, NavItem, s (+4 more)

### Community 7 - "session.ts"
Cohesion: 0.23
Nodes (20): buildBlocks(), cooldown(), mobilitySession(), patternArea(), pick(), pool(), PoolOpts, powerSession() (+12 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Baseline"
Cohesion: 0.33
Nodes (5): Baseline, How it works, Roadmap, Run it, Stack

### Community 10 - "BottomNav.tsx"
Cohesion: 0.40
Nodes (3): Item, ITEMS, stroke

## Knowledge Gaps
- **89 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadProfile()` connect `page.tsx` to `page.tsx`, `store.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `generatePlan()` connect `index.ts` to `page.tsx`, `page.tsx`, `session.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `WorkoutPlan` connect `page.tsx` to `store.ts`, `index.ts`, `types.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07422402159244265 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1251778093883357 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
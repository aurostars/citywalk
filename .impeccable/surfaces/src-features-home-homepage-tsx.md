---
version: 1
slug: "src-features-home-homepage-tsx"
primary_target: "src/features/home/HomePage.tsx"
related_targets: ["src/components/AppShell.tsx","src/index.css"]
---

## Scope

- Primary target: `src/features/home/HomePage.tsx`
- Related surfaces: `src/components/AppShell.tsx`, `src/index.css`
- Visitor mode: Operate

## Audience And Job

Beijing university students use the page shortly before a weekend to turn broad interests and a spending limit into one practical plan without searching several platforms.

## Primary Action

Choose one or more activity types, choose a budget, then generate a weekend plan in the same page.

## Proof And Content

- Curated Beijing activity fixtures
- A visible weekend weather summary
- Transparent recommendation reasons
- Route cost, duration, venue, and party-size fit
- Local team, check-in, and guide interactions

All activity and weather content is synthetic prototype data. No commercial or live-data claims are permitted.

## Chosen Direction

An interactive city magazine: cool paper surfaces, charcoal typography, a single lime accent, asymmetric editorial image rhythm, and compact utility controls. The interface must feel authored and local while remaining fast to scan and operate.

## Memorable Moment

The first-visit preference panel transforms in place into a personalized Beijing weekend edition. The motion communicates the result of the user's choice and never becomes decoration.

## Approved Composition

- Approval key: `user-approved:editorial-guide+progressive-home:2026-09-15`
- Visual direction: `editorial-guide`
- Interaction direction: `progressive-home`
- Approved companion source: `/Users/bytedance/Downloads/github/citywalk/.superpowers/brainstorm/92601-1789477726/content/visual-direction.html`
- Approved flow source: `/Users/bytedance/Downloads/github/citywalk/.superpowers/brainstorm/92601-1789477726/content/home-interaction-flow.html`

## Implementation Fidelity

| Ingredient | Medium | Requirement |
| --- | --- | --- |
| Beijing hero scene | Generated raster URL | Large editorial crop with explicit dimensions and descriptive alt text |
| Activity photography | Generated raster URLs | Distinct subject-specific images, not repeated placeholders |
| Editorial layout | Semantic HTML and CSS Grid | Asymmetric desktop rhythm, strict single-column mobile fallback |
| Preference controls | Semantic fieldsets and inputs | Multi-select activity types, single-select budget |
| Iconography | Phosphor Icons | One icon family and consistent weight |
| State transition | Motion | Transform and opacity only, with reduced-motion fallback |
| Weather and recommendation rationale | Semantic HTML | Compact, legible, and clearly tied to the result |
| Loading and empty states | Semantic HTML and CSS | Match final layout dimensions and preserve context |

## Constraints

- Keep the first visit to one screen on common desktop and mobile viewports.
- Do not add login, payment, chat, real APIs, or photo persistence.
- Preserve clear keyboard focus, WCAG AA contrast, system theming, and local-only state.
- Use no visible em-dash or en-dash characters.

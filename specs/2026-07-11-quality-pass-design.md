# Playbook quality pass

## Scope

Improve the Cloudflare Playbook without changing its repository, Worker, custom-domain routes, VitePress base path, or relationship to the main site.

## Frontend

- Keep the VitePress default theme and existing visual identity.
- Increase long-form and card copy readability.
- Give mobile Playbooks submenu links a 44px minimum target.
- Respect `prefers-reduced-motion` for hover and transition effects.
- Limit the page outline to useful section depth instead of exposing the full deep hierarchy.

## Content

- Preserve commands, product names, links, limits, dates, and technical meaning.
- Rewrite the hero, navigation summaries, section introductions, and repeated summaries in a direct technical voice.
- Remove repeated templates such as “一句话记住”, “不是……而是……”, “本质/核心”, empty transitions, and generic “闭环” claims when a concrete description is available.
- Keep lists and tables where they serve scanning or instruction.

## Verification

- Run `pnpm check` and `git diff --check`.
- Verify desktop and mobile rendering, local search, mobile navigation, cross-Playbook links, dark mode, reduced motion, and console health.
- Push `main`, deploy the independent Worker, and smoke-test the production route.

---
name: shorty-stats-report
description: Generate or refresh the Shorty Telegram summarization bot HTML stats dashboard from the production Postgres database. Use when Codex needs to build weekly charts for bot additions/removals and summary counts (total, free, premium), especially into a root-level `shorty-stats-report.html` file for the last 52 calendar weeks or another week-based period.
---

# Shorty Stats Report

## Overview

Generate a static HTML dashboard with weekly metrics from production data. Prefer the bundled script so the report stays reproducible and does not require hand-editing SQL or HTML.

## Workflow

1. Run `scripts/generate_report.mjs` from the project root.
2. Let the script read project `.env`, query production via SSH, and write the HTML file.
3. Open the generated file locally to verify the graphs render.

Default command:

```bash
bun .codex/skills/shorty-stats-report/scripts/generate_report.mjs
```

Useful options:

```bash
bun .codex/skills/shorty-stats-report/scripts/generate_report.mjs --weeks 52
bun .codex/skills/shorty-stats-report/scripts/generate_report.mjs --as-of 2026-03-19
bun .codex/skills/shorty-stats-report/scripts/generate_report.mjs --out docs/shorty-stats.html
```

## Inputs

- Expect the project `.env` to contain `PROD_SSH_SERVER`, `PROD_DATABASE_NAME`, `PROD_POSTGRES_USER`, and `PROD_POSTGRES_PASSWORD`.
- Expect the production Postgres container on the server to be `summarize-tg-bot-db`.
- Default output path is project-root `shorty-stats-report.html`.

## Metrics

- Bot additions/removals come from daily aggregates in `Statistic`.
- Summary counts come from `Summary`, where `usedPremium = true` means premium and `false` means free.
- The default period is the last 52 calendar weeks including the current week. The current week may be partial.
- For exact semantics and SQL shape, read `references/metrics.md`.

## Verification

- Confirm the script prints the output file path and totals.
- Open the generated HTML locally. If a visual check matters, use the `playwright` skill to capture a screenshot.
- If the user asked for a different chart set, adjust the SQL or template instead of editing the generated HTML by hand.

## Resources

- `scripts/generate_report.mjs`: fetch production metrics and build the HTML dashboard.
- `references/metrics.md`: document the metric sources and default date logic.
- `assets/report-template.html`: HTML template with placeholders filled by the script.

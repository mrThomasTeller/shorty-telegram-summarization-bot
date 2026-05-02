# Metrics

## Source tables

- `Statistic`
  - `date`
  - `addedToChats`
  - `removedFromChats`
- `Summary`
  - `date`
  - `usedPremium`

## Metric mapping

- Bot additions per week: `sum(Statistic.addedToChats)`
- Bot removals per week: `sum(Statistic.removedFromChats)`
- Total summaries per week: `count(Summary.*)`
- Free summaries per week: `count(*) where usedPremium = false`
- Premium summaries per week: `count(*) where usedPremium = true`

## Default period

- Use the last 52 calendar weeks including the current week.
- Start at Monday of the oldest week in the window.
- End the query at Monday after the current week.
- Show the current week as partial if the `as-of` date is not Sunday of that week.

## Query shape

- Build a week series with `generate_series`.
- Left join weekly aggregates from `Statistic` and `Summary`.
- Fill missing weeks with zeroes.
- Return rows ordered by week ascending.

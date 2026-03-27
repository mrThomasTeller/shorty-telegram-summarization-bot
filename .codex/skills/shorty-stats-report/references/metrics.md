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

- Bot additions per month: `sum(Statistic.addedToChats)`
- Bot removals per month: `sum(Statistic.removedFromChats)`
- Total summaries per month: `count(Summary.*)`
- Free summaries per month: `count(*) where usedPremium = false`
- Premium summaries per month: `count(*) where usedPremium = true`

## Default period

- Use the last 12 calendar months including the current month.
- Start at the first day of the oldest month in the window.
- End the query at the first day of the next month after the current month.
- Show the current month as partial if the `as-of` date is not the last day of that month.

## Query shape

- Build a month series with `generate_series`.
- Left join monthly aggregates from `Statistic` and `Summary`.
- Fill missing months with zeroes.
- Return rows ordered by month ascending.

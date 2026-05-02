#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CONTAINER_NAME = "summarize-tg-bot-db";

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectRoot();
  const skillRoot = path.resolve(projectRoot, ".codex/skills/shorty-stats-report");
  const templatePath = path.join(skillRoot, "assets", "report-template.html");
  const envPath = path.join(projectRoot, ".env");

  const env = parseDotenv(envPath);
  const required = [
    "PROD_SSH_SERVER",
    "PROD_DATABASE_NAME",
    "PROD_POSTGRES_USER",
    "PROD_POSTGRES_PASSWORD",
  ];

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing ${key} in ${envPath}`);
    }
  }

  const asOfDate = args.asOf ? parseDateArg(args.asOf) : new Date();
  const currentWeekStart = startOfWeek(asOfDate);
  const startWeek = args.start
    ? startOfWeek(parseDateArg(args.start))
    : addWeeks(currentWeekStart, -(args.weeks - 1));
  const endExclusive = addWeeks(currentWeekStart, 1);

  const rows = fetchMetrics({
    sshServer: env.PROD_SSH_SERVER,
    dbName: env.PROD_DATABASE_NAME,
    dbUser: env.PROD_POSTGRES_USER,
    dbPassword: env.PROD_POSTGRES_PASSWORD,
    startWeek,
    endExclusive,
    currentWeekStart,
  });

  const report = {
    generatedAt: formatIsoDate(asOfDate),
    periodLabel: `${formatWeekLabel(startWeek)} - ${formatWeekLabel(currentWeekStart)}`,
    data: rows,
  };

  const subtitle = buildSubtitle({
    startWeek,
    currentWeekStart,
    asOfDate,
    weeks: rows.length,
  });

  const periodRange = `${formatDotDate(startWeek)} - ${formatDotDate(asOfDate)}`;
  const template = fs.readFileSync(templatePath, "utf8");
  const html = template
    .replace("__SUBTITLE__", escapeHtml(subtitle))
    .replace("__PERIOD_RANGE__", escapeHtml(periodRange))
    .replace("__REPORT_JSON__", JSON.stringify(report));

  const outputPath = path.isAbsolute(args.out)
    ? args.out
    : path.resolve(projectRoot, args.out);

  fs.writeFileSync(outputPath, html);

  const totals = rows.reduce(
    (acc, item) => {
      acc.added += item.added;
      acc.removed += item.removed;
      acc.total += item.total;
      acc.free += item.free;
      acc.premium += item.premium;
      return acc;
    },
    { added: 0, removed: 0, total: 0, free: 0, premium: 0 }
  );

  console.log(`Saved report to ${outputPath}`);
  console.log(
    `Period: ${formatWeekLabel(startWeek)} - ${formatWeekLabel(currentWeekStart)}`
  );
  console.log(
    `Totals: added=${totals.added}, removed=${totals.removed}, total=${totals.total}, free=${totals.free}, premium=${totals.premium}`
  );
}

function parseArgs(argv) {
  const options = {
    weeks: 52,
    out: "shorty-stats-report.html",
    asOf: null,
    start: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--weeks") {
      options.weeks = Number(argv[++i]);
    } else if (arg === "--out") {
      options.out = argv[++i];
    } else if (arg === "--as-of") {
      options.asOf = argv[++i];
    } else if (arg === "--start") {
      options.start = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(options.weeks) || options.weeks <= 0) {
    throw new Error("--weeks must be a positive integer");
  }

  return options;
}

function resolveProjectRoot() {
  const cwdRoot = path.resolve(process.cwd());
  if (fs.existsSync(path.join(cwdRoot, ".env")) && fs.existsSync(path.join(cwdRoot, "package.json"))) {
    return cwdRoot;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, "../../../../");
}

function parseDotenv(filePath) {
  const env = {};
  const text = fs.readFileSync(filePath, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index < 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function parseDateArg(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

function startOfWeek(date) {
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return addDays(date, -daysSinceMonday);
}

function addDays(date, delta) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta, 12, 0, 0, 0);
}

function addWeeks(date, delta) {
  return addDays(date, delta * 7);
}

function endOfWeek(weekStart) {
  return addDays(weekStart, 6);
}

function formatIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDotDate(date) {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join(".");
}

function formatHumanDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(" г.", "");
}

function formatWeekLabel(weekStart) {
  return `${formatDotDate(weekStart)} - ${formatDotDate(endOfWeek(weekStart))}`;
}

function buildSubtitle({ startWeek, currentWeekStart, asOfDate, weeks }) {
  const periodText = `Понедельный отчёт за ${weeks} календарных недель: с ${formatWeekLabel(
    startWeek
  )} по ${formatWeekLabel(currentWeekStart)}.`;

  if (formatIsoDate(asOfDate) !== formatIsoDate(endOfWeek(currentWeekStart))) {
    return `${periodText} Текущая неделя неполная: данные актуальны по состоянию на ${formatHumanDate(asOfDate)}.`;
  }

  return `${periodText} Данные актуальны по состоянию на ${formatHumanDate(asOfDate)}.`;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function fetchMetrics({ sshServer, dbName, dbUser, dbPassword, startWeek, endExclusive, currentWeekStart }) {
  const sql = `
WITH weeks AS (
  SELECT generate_series(date '${formatIsoDate(startWeek)}', date '${formatIsoDate(
    currentWeekStart
  )}', interval '1 week')::date AS week_start
),
stats AS (
  SELECT
    date_trunc('week', date)::date AS week_start,
    sum("addedToChats")::int AS added,
    sum("removedFromChats")::int AS removed
  FROM "Statistic"
  WHERE date >= date '${formatIsoDate(startWeek)}' AND date < date '${formatIsoDate(endExclusive)}'
  GROUP BY 1
),
summaries AS (
  SELECT
    date_trunc('week', date)::date AS week_start,
    count(*)::int AS total,
    count(*) FILTER (WHERE NOT "usedPremium")::int AS free,
    count(*) FILTER (WHERE "usedPremium")::int AS premium
  FROM "Summary"
  WHERE date >= date '${formatIsoDate(startWeek)}' AND date < date '${formatIsoDate(endExclusive)}'
  GROUP BY 1
)
SELECT json_agg(row_to_json(t) ORDER BY t.week_start)
FROM (
  SELECT
    w.week_start,
    to_char(w.week_start, 'YYYY-MM-DD') AS week,
    coalesce(stats.added, 0) AS added,
    coalesce(stats.removed, 0) AS removed,
    coalesce(summaries.total, 0) AS total,
    coalesce(summaries.free, 0) AS free,
    coalesce(summaries.premium, 0) AS premium
  FROM weeks w
  LEFT JOIN stats USING (week_start)
  LEFT JOIN summaries USING (week_start)
  ORDER BY w.week_start
) t;
`.trim();

  const remoteCommand = [
    "docker exec -i",
    `-e PGPASSWORD=${shellQuote(dbPassword)}`,
    CONTAINER_NAME,
    "psql",
    `-U ${shellQuote(dbUser)}`,
    `-d ${shellQuote(dbName)}`,
    "-v ON_ERROR_STOP=1 -t -A -f -",
  ].join(" ");

  const result = spawnSync("ssh", ["-o", "BatchMode=yes", sshServer, remoteCommand], {
    input: sql,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Failed to fetch metrics from production");
  }

  const json = result.stdout.trim();
  if (!json) {
    throw new Error("Production query returned empty output");
  }

  return JSON.parse(json);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

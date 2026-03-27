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
  const currentMonthStart = startOfMonth(asOfDate);
  const startMonth = args.start
    ? parseMonthArg(args.start)
    : addMonths(currentMonthStart, -(args.months - 1));
  const endExclusive = addMonths(currentMonthStart, 1);

  const rows = fetchMetrics({
    sshServer: env.PROD_SSH_SERVER,
    dbName: env.PROD_DATABASE_NAME,
    dbUser: env.PROD_POSTGRES_USER,
    dbPassword: env.PROD_POSTGRES_PASSWORD,
    startMonth,
    endExclusive,
    currentMonthStart,
  });

  const report = {
    generatedAt: formatIsoDate(asOfDate),
    periodLabel: `${formatMonthYear(startMonth, true)} - ${formatMonthYear(currentMonthStart, true)}`,
    data: rows,
  };

  const subtitle = buildSubtitle({
    startMonth,
    currentMonthStart,
    asOfDate,
    months: rows.length,
  });

  const periodRange = `${formatDotDate(startMonth)} - ${formatDotDate(asOfDate)}`;
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
    `Period: ${formatMonthYear(startMonth, true)} - ${formatMonthYear(currentMonthStart, true)}`
  );
  console.log(
    `Totals: added=${totals.added}, removed=${totals.removed}, total=${totals.total}, free=${totals.free}, premium=${totals.premium}`
  );
}

function parseArgs(argv) {
  const options = {
    months: 12,
    out: "shorty-stats-report.html",
    asOf: null,
    start: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--months") {
      options.months = Number(argv[++i]);
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

  if (!Number.isInteger(options.months) || options.months <= 0) {
    throw new Error("--months must be a positive integer");
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
    throw new Error(`Invalid --as-of date: ${value}`);
  }
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid --as-of date: ${value}`);
  }
  return date;
}

function parseMonthArg(value) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new Error(`Invalid --start month: ${value}`);
  }
  const date = new Date(`${value}-01T12:00:00`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid --start month: ${value}`);
  }
  return startOfMonth(date);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1, 12, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
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

function formatMonthYear(date, capitalize) {
  const text = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(" г.", "");

  return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
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

function buildSubtitle({ startMonth, currentMonthStart, asOfDate, months }) {
  const periodText = `Помесячный отчёт за ${months} календарных месяцев: с ${formatMonthYear(
    startMonth,
    false
  )} по ${formatMonthYear(currentMonthStart, false)}.`;

  if (formatIsoDate(asOfDate) !== formatIsoDate(endOfMonth(currentMonthStart))) {
    return `${periodText} ${formatMonthYear(currentMonthStart, true)} неполный: данные актуальны по состоянию на ${formatHumanDate(asOfDate)}.`;
  }

  return `${periodText} Данные актуальны по состоянию на ${formatHumanDate(asOfDate)}.`;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function fetchMetrics({ sshServer, dbName, dbUser, dbPassword, startMonth, endExclusive, currentMonthStart }) {
  const sql = `
WITH months AS (
  SELECT generate_series(date '${formatIsoDate(startMonth)}', date '${formatIsoDate(
    currentMonthStart
  )}', interval '1 month')::date AS month_start
),
stats AS (
  SELECT
    date_trunc('month', date)::date AS month_start,
    sum("addedToChats")::int AS added,
    sum("removedFromChats")::int AS removed
  FROM "Statistic"
  WHERE date >= date '${formatIsoDate(startMonth)}' AND date < date '${formatIsoDate(endExclusive)}'
  GROUP BY 1
),
summaries AS (
  SELECT
    date_trunc('month', date)::date AS month_start,
    count(*)::int AS total,
    count(*) FILTER (WHERE NOT "usedPremium")::int AS free,
    count(*) FILTER (WHERE "usedPremium")::int AS premium
  FROM "Summary"
  WHERE date >= date '${formatIsoDate(startMonth)}' AND date < date '${formatIsoDate(endExclusive)}'
  GROUP BY 1
)
SELECT json_agg(row_to_json(t) ORDER BY t.month_start)
FROM (
  SELECT
    m.month_start,
    to_char(m.month_start, 'YYYY-MM') AS month,
    coalesce(stats.added, 0) AS added,
    coalesce(stats.removed, 0) AS removed,
    coalesce(summaries.total, 0) AS total,
    coalesce(summaries.free, 0) AS free,
    coalesce(summaries.premium, 0) AS premium
  FROM months m
  LEFT JOIN stats USING (month_start)
  LEFT JOIN summaries USING (month_start)
  ORDER BY m.month_start
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

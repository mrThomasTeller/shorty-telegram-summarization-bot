#!/usr/bin/env bun

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(import.meta.dirname, "../../../..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "shorty-weekly-report-"));
const binDir = path.join(tempDir, "bin");
const outputPath = path.join(tempDir, "report.html");
const sqlPath = path.join(tempDir, "captured.sql");

fs.mkdirSync(binDir);

const fakeSshPath = path.join(binDir, "ssh");
fs.writeFileSync(
  fakeSshPath,
  `#!/usr/bin/env bash
set -euo pipefail
cat > ${shellQuote(sqlPath)}
printf '%s\\n' '[{"week_start":"2026-04-27","week":"2026-04-27","added":7,"removed":2,"total":30,"free":20,"premium":10}]'
`
);
fs.chmodSync(fakeSshPath, 0o755);

const result = spawnSync(
  "bun",
  [
    ".codex/skills/shorty-stats-report/scripts/generate_report.mjs",
    "--weeks",
    "1",
    "--as-of",
    "2026-05-02",
    "--out",
    outputPath,
  ],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
    },
    encoding: "utf8",
  }
);

assert.equal(result.status, 0, result.stderr || result.stdout);

const sql = fs.readFileSync(sqlPath, "utf8");
assert.match(sql, /generate_series\(date '2026-04-27'/);
assert.match(sql, /date_trunc\('week', date\)/);
assert.doesNotMatch(sql, /date_trunc\('month', date\)/);

const html = fs.readFileSync(outputPath, "utf8");
assert.match(html, /Гранулярность: по неделям/);
assert.match(html, /Недельные цифры/);
assert.match(html, /В среднем в неделю/);
assert.match(html, /return `\$\{formatShortDate\(start\)\}`;/);
assert.match(html, /"week":"2026-04-27"/);
assert.doesNotMatch(html, /Гранулярность: по месяцам/);
assert.doesNotMatch(html, /formatShortDate\(start\)\}-\$\{formatShortDate\(end\)/);

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

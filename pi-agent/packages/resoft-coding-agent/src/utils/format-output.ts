import type { Issue, IncrementalReviewResult } from "@resoft/agent-core";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
} as const;

type ColorName = keyof typeof COLORS;

function c(color: ColorName, text: string): string {
  return COLORS[color] + text + COLORS.reset;
}

/** Format severity badge with ANSI color */
export function severityBadge(severity: string): string {
  switch (severity) {
    case "error":
      return c("red", "❌ ERROR");
    case "warning":
      return c("yellow", "⚠️  WARN ");
    case "info":
      return c("cyan", "ℹ️  INFO ");
    default:
      return severity;
  }
}

/** Print a padded table row */
function tableRow(cols: string[], widths: number[]): string {
  return cols.map((col, i) => col.padEnd(widths[i] || 10)).join(" ");
}

/** Print formatted issue list with ANSI colors */
export function printIssues(issues: Issue[]): void {
  if (issues.length === 0) {
    console.log(c("green", "\n✅ No issues found!\n"));
    return;
  }

  console.log(`\n${c("bold", `Issues (${issues.length})`)}\n`);
  console.log(
    tableRow(["Line", "Severity", "Issue", "Suggestion"], [6, 10, 35, 40])
  );
  console.log("─".repeat(91));

  for (const issue of issues) {
    const line = issue.line ? String(issue.line).padStart(4) : "   - ";
    console.log(
      `${c("dim", line)} ${severityBadge(issue.severity)} ${issue.description
        .substring(0, 33)
        .padEnd(35)} ${(issue.suggestion ?? "").substring(0, 38)}`
    );
  }
  console.log();
}

/** Print incremental review summary with ANSI formatting */
export function printReviewSummary(result: IncrementalReviewResult): void {
  console.log(`\n${c("bold", "═══ Review Summary ═══")}\n`);
  console.log(`  File:         ${c("cyan", result.filePath)}`);
  console.log(`  Duration:     ${result.durationMs}ms`);
  console.log(`  Blocks checked: ${result.blocksChecked}  |  skipped: ${result.blocksSkipped}`);
  console.log();

  // Issue counts
  const total = result.totalIssues;
  const newIssues = result.newIssues;
  const resolved = result.resolvedIssues;
  const barWidth = 30;

  console.log(`  Total:   ${total}`);
  if (resolved > 0) console.log(`  ${c("green", `Resolved: ${resolved}`)}`);
  if (newIssues > 0) console.log(`  ${c("yellow", `New:      ${newIssues}`)}`);

  // Rule summary
  if (Object.keys(result.ruleSummary).length > 0) {
    console.log(`\n  ${c("bold", "By Rule:")}`);
    for (const [ruleId, count] of Object.entries(result.ruleSummary)) {
      const bar = "█".repeat(Math.min(count, barWidth));
      console.log(`    ${ruleId.padEnd(20)} ${c("yellow", bar)} ${count}`);
    }
  }
}

/** Print diff blocks as colored output */
export function printDiffBlocks(
  blocks: Array<{
    startLine: number;
    endLine: number;
    content: string;
    filePath: string;
  }>
): void {
  if (blocks.length === 0) {
    console.log(c("dim", "\n  (no changes detected)\n"));
    return;
  }

  console.log(`\n${c("bold", "═══ Changed Blocks ═══")}\n`);
  for (const block of blocks) {
    console.log(
      c("cyan", `  ${block.filePath}:${block.startLine}-${block.endLine}`)
    );
    const lines = block.content.split("\n").slice(0, 10);
    for (let i = 0; i < lines.length; i++) {
      const lineNum = block.startLine + i;
      console.log(
        `  ${c("dim", String(lineNum).padStart(4))} │ ${lines[i]}`
      );
    }
    if (block.content.split("\n").length > 10) {
      console.log(`  ${c("dim", "     │ ...")}`);
    }
    console.log();
  }
}

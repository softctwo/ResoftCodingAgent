import type { Issue, CodingRule, ETLPlatform } from "../types.ts";
import { DiffTracker, type DiffBlock } from "./diff-tracker.ts";

export interface IncrementalReviewResult {
  filePath: string;
  totalIssues: number;
  newIssues: number;
  resolvedIssues: number;
  issues: Issue[];
  blocksChecked: number;
  blocksSkipped: number;
  durationMs: number;
  ruleSummary: Record<string, number>; // ruleId → count
}

export class IncrementalRuleEngine {
  private diffTracker = new DiffTracker();
  private platform: ETLPlatform = "sql";
  private rules: CodingRule[] = [];

  constructor(platform: ETLPlatform, rules: CodingRule[]) {
    this.platform = platform;
    this.rules = rules.filter(
      (r) => !r.platforms || r.platforms.includes(platform),
    );
  }

  /** Review a file incrementally — only changed lines */
  reviewFile(
    filePath: string,
    content: string,
  ): IncrementalReviewResult {
    const startTime = Date.now();
    const prevSnapshot = this.diffTracker.getSnapshot(filePath);
    const prevIssues = prevSnapshot?.issues ?? [];
    const prevIssueIds = new Set(prevIssues.map((i) => i.id));

    // Get only changed blocks
    const changedBlocks = this.diffTracker.getChangedBlocks(filePath, content);
    const allLines = content.split("\n");

    const issues: Issue[] = [];
    const ruleSummary: Record<string, number> = {};
    let blocksChecked = 0;
    let blocksSkipped = 0;

    for (const block of changedBlocks) {
      if (block.content.length === 0) {
        blocksSkipped++;
        continue;
      }
      blocksChecked++;

      for (const rule of this.rules) {
        if (!this.ruleMatches(rule, block, allLines, filePath)) continue;

        if (rule.pattern) {
          try {
            const regex = new RegExp(rule.pattern, "gi");
            const matches = block.content.match(regex);
            if (matches) {
              const issue: Issue = {
                id: `${rule.id}-${block.startLine}`,
                description: rule.description,
                severity: rule.severity,
                line: block.startLine,
                suggestion: rule.suggestion,
                ruleId: rule.id,
              };
              issues.push(issue);
              ruleSummary[rule.id] = (ruleSummary[rule.id] || 0) + 1;
            }
          } catch {
            // Invalid regex — skip
          }
        }

        // Pattern-less rules: always flag on changed blocks (warning level)
        if (!rule.pattern && rule.severity === "warning") {
          const issue: Issue = {
            id: `${rule.id}-${block.startLine}`,
            description: rule.description,
            severity: rule.severity,
            line: block.startLine,
            suggestion: rule.suggestion,
            ruleId: rule.id,
          };
          issues.push(issue);
          ruleSummary[rule.id] = (ruleSummary[rule.id] || 0) + 1;
        }
      }
    }

    // Carry forward previous issues that were not in changed blocks
    for (const prevIssue of prevIssues) {
      if (!issues.some((i) => i.id === prevIssue.id)) {
        issues.push(prevIssue);
      }
    }

    // Update snapshot
    this.diffTracker.updateSnapshot(filePath, content, issues);

    const newIssueIds = new Set(issues.map((i) => i.id));
    const newIssues = issues.filter((i) => !prevIssueIds.has(i.id)).length;
    const resolvedIssues = prevIssues.filter(
      (i) => !newIssueIds.has(i.id),
    ).length;

    return {
      filePath,
      totalIssues: issues.length,
      newIssues,
      resolvedIssues,
      issues,
      blocksChecked,
      blocksSkipped,
      durationMs: Date.now() - startTime,
      ruleSummary,
    };
  }

  private ruleMatches(
    rule: CodingRule,
    block: DiffBlock,
    _allLines: string[],
    _filePath: string,
  ): boolean {
    if (rule.platforms && !rule.platforms.includes(this.platform)) return false;
    return true;
  }

  /** Review entire file (forces full re-check) */
  reviewFileFull(
    filePath: string,
    content: string,
  ): IncrementalReviewResult {
    // Remove snapshot to force full review
    this.diffTracker.removeFile(filePath);
    return this.reviewFile(filePath, content);
  }

  /** Get aggregate stats for all tracked files */
  getStats(): { trackedFiles: number; totalIssues: number } {
    const files = this.diffTracker.getTrackedFiles();
    let totalIssues = 0;
    for (const f of files) {
      const snap = this.diffTracker.getSnapshot(f);
      if (snap) totalIssues += snap.issues.length;
    }
    return { trackedFiles: files.length, totalIssues };
  }

  /** Batch review multiple files */
  reviewBatch(
    files: Array<{ path: string; content: string }>,
  ): IncrementalReviewResult[] {
    return files.map((f) => this.reviewFile(f.path, f.content));
  }

  /** Reset tracking for a single file */
  resetFile(filePath: string): void {
    this.diffTracker.removeFile(filePath);
  }

  /** Reset all tracking state */
  reset(): void {
    this.diffTracker.clear();
  }
}

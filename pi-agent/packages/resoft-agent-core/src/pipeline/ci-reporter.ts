import type { IncrementalReviewResult } from "../rules/incremental-engine.ts";
import type { Issue } from "../types.ts";

export type CIOutputFormat = "text" | "json" | "sarif" | "checkstyle";

export interface CIReportOptions {
  format: CIOutputFormat;
  minSeverity?: "error" | "warning" | "info";
  failOnError?: boolean;
  failOnWarning?: boolean;
}

export interface CIReportResult {
  exitCode: number;
  output: string;
  summary: {
    totalFiles: number;
    totalIssues: number;
    errors: number;
    warnings: number;
    infos: number;
    filesWithErrors: string[];
  };
}

interface IndexedIssue {
  issue: Issue;
  filePath: string;
}

export class CIReporter {
  private results: IncrementalReviewResult[] = [];

  addResult(result: IncrementalReviewResult): void {
    this.results.push(result);
  }

  generate(options: CIReportOptions): CIReportResult {
    // Attach filePath to each issue from its parent result
    const indexedIssues: IndexedIssue[] = [];
    for (const r of this.results) {
      for (const issue of r.issues) {
        indexedIssues.push({ issue, filePath: r.filePath });
      }
    }

    const severityRank: Record<string, number> = { error: 0, warning: 1, info: 2 };
    const minRank = options.minSeverity ? severityRank[options.minSeverity] ?? 2 : 2;

    const filtered = indexedIssues.filter((ii) => {
      const rank = severityRank[ii.issue.severity] ?? 2;
      return rank <= minRank;
    }).sort((a, b) => {
      const ra = severityRank[a.issue.severity] ?? 2;
      const rb = severityRank[b.issue.severity] ?? 2;
      return ra - rb;
    });

    const errors = filtered.filter((ii) => ii.issue.severity === "error");
    const warnings = filtered.filter((ii) => ii.issue.severity === "warning");
    const infos = filtered.filter((ii) => ii.issue.severity === "info");

    let exitCode = 0;
    if (options.failOnError && errors.length > 0) exitCode = 1;
    if (options.failOnWarning && warnings.length > 0) exitCode = 1;

    const summary = {
      totalFiles: this.results.length,
      totalIssues: filtered.length,
      errors: errors.length,
      warnings: warnings.length,
      infos: infos.length,
      filesWithErrors: [
        ...new Set(
          this.results
            .filter((r) => r.issues.some((i) => i.severity === "error"))
            .map((r) => r.filePath),
        ),
      ],
    };

    let output = "";
    switch (options.format) {
      case "json":
        output = this.formatJSON(filtered, summary);
        break;
      case "sarif":
        output = this.formatSARIF(filtered, summary);
        break;
      case "checkstyle":
        output = this.formatCheckstyle(filtered, summary);
        break;
      default:
        output = this.formatText(filtered, summary);
    }

    return { exitCode, output, summary };
  }

  private formatText(issues: IndexedIssue[], summary: CIReportResult["summary"]): string {
    let out = `\n===== Resoft CI Review =====\n`;
    out += `Files: ${summary.totalFiles} | Issues: ${summary.totalIssues}\n`;
    out += `Errors: ${summary.errors} | Warnings: ${summary.warnings} | Info: ${summary.infos}\n\n`;

    for (const { issue, filePath } of issues) {
      const sev = issue.severity.toUpperCase().padEnd(7);
      const line = issue.line ?? 0;
      out += `  ${sev} ${filePath}:${line}  ${issue.description}\n`;
      if (issue.suggestion) out += `    → ${issue.suggestion}\n`;
    }

    out += `\n${summary.errors > 0 ? "❌ FAILED" : "✅ PASSED"}\n`;
    return out;
  }

  private formatJSON(issues: IndexedIssue[], summary: CIReportResult["summary"]): string {
    const out = issues.map(({ issue, filePath }) => ({
      id: issue.id,
      ruleId: issue.ruleId ?? issue.id,
      severity: issue.severity,
      filePath,
      line: issue.line,
      description: issue.description,
      suggestion: issue.suggestion,
    }));
    return JSON.stringify({ summary, issues: out }, null, 2);
  }

  private formatSARIF(issues: IndexedIssue[], _summary: CIReportResult["summary"]): string {
    const results = issues.map(({ issue, filePath }) => ({
      ruleId: issue.ruleId ?? issue.id,
      level:
        issue.severity === "error"
          ? "error"
          : issue.severity === "warning"
            ? "warning"
            : "note",
      message: { text: issue.description },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: filePath },
            region: { startLine: issue.line ?? 1 },
          },
        },
      ],
    }));

    return JSON.stringify(
      {
        version: "2.1.0",
        $schema:
          "https://json.schemastore.org/sarif-2.1.0.json",
        runs: [
          {
            tool: {
              driver: {
                name: "ResoftCodingAgent",
                informationUri:
                  "https://github.com/softctwo/ResoftCodingAgent",
              },
            },
            results,
          },
        ],
      },
      null,
      2,
    );
  }

  private formatCheckstyle(issues: IndexedIssue[], _summary: CIReportResult["summary"]): string {
    const byFile: Record<string, IndexedIssue[]> = {};
    for (const ii of issues) {
      const f = ii.filePath ?? "unknown";
      if (!byFile[f]) byFile[f] = [];
      byFile[f].push(ii);
    }

    let xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<checkstyle version="10.0">\n';
    for (const [file, fileIssues] of Object.entries(byFile)) {
      xml += `  <file name="${file}">\n`;
      for (const { issue } of fileIssues) {
        const sev =
          issue.severity === "error"
            ? "error"
            : issue.severity === "warning"
              ? "warning"
              : "info";
        xml += `    <error line="${issue.line ?? 0}" severity="${sev}" message="${issue.description}" source="${issue.ruleId ?? ""}"/>\n`;
      }
      xml += `  </file>\n`;
    }
    xml += "</checkstyle>";
    return xml;
  }
}

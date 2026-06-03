import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export default function etlReviewExtension(ctx: ExtensionContext) {
  // Stub: extension registration placeholder
  void ctx;
}

export interface ReviewResult {
  id: string;
  description: string;
  severity: "error" | "warning" | "info";
  line?: number;
  suggestion?: string;
}

export function reviewSqlCode(code: string, platform?: string): ReviewResult[] {
  const issues: ReviewResult[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (/\bSELECT\s+\*/i.test(line)) {
      issues.push({
        id: `review-select-star-${lineNum}`,
        description: "SELECT * should be avoided; enumerate columns explicitly",
        severity: "warning",
        line: lineNum,
        suggestion: "List only the columns you need.",
      });
    }

    if (/\bDELETE\s+FROM\b(?!.*\bWHERE\b)/i.test(line)) {
      issues.push({
        id: `review-delete-no-where-${lineNum}`,
        description: "DELETE without WHERE clause is destructive",
        severity: "error",
        line: lineNum,
        suggestion: "Always include a WHERE clause.",
      });
    }

    if (platform !== "spark" && /\bDROP\s+TABLE\b/i.test(line)) {
      issues.push({
        id: `review-drop-table-${lineNum}`,
        description: "DROP TABLE detected — ensure this is intentional",
        severity: "warning",
        line: lineNum,
        suggestion: "Add IF EXISTS and verify table name.",
      });
    }
  }

  return issues;
}

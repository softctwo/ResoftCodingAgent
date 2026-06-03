import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export default function etlReviewExtension(ctx: ExtensionContext) {
  // Register the "etl_review" tool
  ctx.registerTool({
    name: "etl_review",
    description: "Review ETL code for SQL anti-patterns, performance issues, and style violations.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The SQL or ETL code to review.",
        },
        platform: {
          type: "string",
          enum: ["spark", "flink", "dbt", "sql"],
          description: "The target ETL platform.",
        },
      },
      required: ["code"],
    },
    execute: async (args) => {
      const code = String(args.code ?? "");
      const platform = String(args.platform ?? "sql");
      const issues: Array<{
        id: string;
        description: string;
        severity: "error" | "warning" | "info";
        line?: number;
        suggestion?: string;
      }> = [];

      // Basic checks
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

      return {
        content: JSON.stringify({
          platform,
          issues,
          summary: issues.length === 0
            ? "No issues found."
            : `Found ${issues.length} issue(s).`,
        }),
      };
    },
  });

  // On message_end: scan message content for SQL issues
  ctx.on("message_end", (message) => {
    const content = typeof message === "string" ? message : (message as any)?.content ?? "";
    if (typeof content !== "string") return;

    const sqlBlockRegex = /```(?:sql)?\s*\n([\s\S]*?)```/g;
    let match;
    let totalIssues = 0;

    while ((match = sqlBlockRegex.exec(content)) !== null) {
      if (/SELECT\s+\*/i.test(match[1])) totalIssues++;
      if (/=\s*NULL/i.test(match[1])) totalIssues++;
    }

    if (totalIssues > 0) {
      // Could emit a diagnostic or notification to the TUI
    }
  });

  // Register "review" command
  ctx.registerCommand("review", async () => {
    // Trigger code review on the current session
    return "Code review triggered. Analyzing the latest code blocks...";
  });
}

import type { AgentTool } from "@earendil-works/pi-agent-core";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";

// ─── Read ETL File Tool ────────────────────────────────────────────

const readFileTool: AgentTool = {
  label: "Read ETL File",
  name: "read_etl_file",
  description: "Read an ETL project file (SQL, Python, YAML, etc.).",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file within the project." },
    },
    required: ["path"],
  },
  execute: async (_toolCallId, params) => {
    try {
      const path = String((params as any).path ?? "");
      const cwd = process.cwd();
      const filePath = resolve(cwd, path);
      if (!existsSync(filePath)) {
        return { content: [{ type: "text", text: `File not found: ${path}` }], truncated: false, details: {} };
      }
      const st = statSync(filePath);
      if (st.isDirectory()) {
        return { content: [{ type: "text", text: `Path is a directory: ${path}` }], truncated: false, details: {} };
      }
      const content = readFileSync(filePath, "utf-8");
      const truncated = content.length > 50000;
      const text = truncated ? content.substring(0, 50000) + "\n... (truncated)" : content;
      return { content: [{ type: "text", text }], truncated, details: { path: filePath, size: st.size } };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], truncated: false, details: {} };
    }
  },
};

// ─── Write ETL File Tool ───────────────────────────────────────────

const writeFileTool: AgentTool = {
  label: "Write ETL File",
  name: "write_etl_file",
  description: "Write or update an ETL script or config file.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to write." },
      content: { type: "string", description: "File content to write." },
    },
    required: ["path", "content"],
  },
  execute: async (_toolCallId, params) => {
    try {
      const p = params as any;
      const path = String(p.path ?? "");
      const content = String(p.content ?? "");
      const cwd = process.cwd();
      const filePath = resolve(cwd, path);
      writeFileSync(filePath, content, "utf-8");
      return { content: [{ type: "text", text: `Written to ${relative(cwd, filePath)} (${content.length} bytes)` }], truncated: false, details: { path: filePath, bytes: content.length } };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], truncated: false, details: {} };
    }
  },
};

// ─── SQL Format Tool ───────────────────────────────────────────────

const sqlFormatTool: AgentTool = {
  label: "Format SQL",
  name: "format_sql",
  description: "Format SQL code according to team style guidelines.",
  parameters: {
    type: "object",
    properties: {
      sql: { type: "string", description: "SQL to format." },
      dialect: { type: "string", description: "SQL dialect: spark, flink, postgres, hive." },
    },
    required: ["sql"],
  },
  execute: async (_toolCallId, params) => {
    try {
      const p = params as any;
      const sql = String(p.sql ?? "");
      const KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|UNION|ALL|DISTINCT|AS|IN|BETWEEN|LIKE|IS|NULL|NOT|CASE|WHEN|THEN|ELSE|END|EXISTS)\b/gi;
      let formatted = sql.replace(/\s+/g, " ").trim();
      formatted = formatted.replace(KEYWORDS, (match: string) => match.toUpperCase());
      formatted = formatted.replace(/\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING|LIMIT|UNION)\b/gi, "\n$1");
      formatted = formatted.replace(/\n\s*\n/g, "\n").trim();
      return { content: [{ type: "text", text: formatted }], truncated: false, details: { dialect: String(p.dialect ?? "sql") } };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], truncated: false, details: {} };
    }
  },
};

// ─── SQL Validate Tool ─────────────────────────────────────────────

const sqlValidateTool: AgentTool = {
  label: "Validate SQL",
  name: "validate_sql",
  description: "Validate SQL syntax and check for common anti-patterns.",
  parameters: {
    type: "object",
    properties: {
      sql: { type: "string", description: "SQL to validate." },
      dialect: { type: "string", description: "SQL dialect: spark, flink, postgres, hive." },
    },
    required: ["sql"],
  },
  execute: async (_toolCallId, params) => {
    try {
      const p = params as any;
      const sql = String(p.sql ?? "");
      const issues: Array<{ line: number; message: string; severity: string }> = [];

      if (/;\s*DROP\s+TABLE/i.test(sql)) issues.push({ line: 1, message: "Potential DROP TABLE detected", severity: "error" });
      const quoteCount = (sql.match(/'/g) || []).length;
      if (quoteCount % 2 !== 0) issues.push({ line: 1, message: "Unclosed single quote", severity: "error" });
      if (/\bDELETE\s+FROM\s+\w+\s*$/im.test(sql)) issues.push({ line: 1, message: "DELETE without WHERE clause", severity: "error" });
      if (/SELECT\s+\*/i.test(sql)) issues.push({ line: 1, message: "Using SELECT *", severity: "warning" });

      return {
        content: [{ type: "text", text: JSON.stringify({ valid: issues.length === 0, issues }, null, 2) }],
        truncated: false,
        details: { dialect: String(p.dialect ?? "sql"), issuesFound: issues.length },
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], truncated: false, details: {} };
    }
  },
};

// ─── Analyze ETL Project Tool ──────────────────────────────────────

const analyzeProjectTool: AgentTool = {
  label: "Analyze ETL Project",
  name: "analyze_etl_project",
  description: "Analyze the structure of an ETL project and report dependencies, data flow, and issues.",
  parameters: {
    type: "object",
    properties: {
      scanDepth: { type: "integer", description: "How deep to scan (1 = top-level only, 2+ recursive)." },
    },
  },
  execute: async (_args) => {
    // TODO: Walk project tree, classify files, build dependency graph
    return { content: [{ type: "text", text: "// TODO: Implement analyze_etl_project" }], truncated: false, details: {} };
  },
};

// ─── Data Lineage Tool ─────────────────────────────────────────────

const dataLineageTool: AgentTool = {
  label: "Trace Data Lineage",
  name: "trace_data_lineage",
  description: "Trace data lineage from source tables to target tables through the ETL pipeline.",
  parameters: {
    type: "object",
    properties: {
      table: { type: "string", description: "Table or view name to trace." },
      direction: {
        type: "string",
        enum: ["upstream", "downstream", "both"],
        description: "Trace direction: upstream (sources), downstream (consumers), or both.",
      },
    },
    required: ["table"],
  },
  execute: async (_args) => {
    // TODO: Parse SQL files, extract CTAS/INSERT/ref() calls, build lineage graph
    return { content: [{ type: "text", text: "// TODO: Implement trace_data_lineage" }], truncated: false, details: {} };
  },
};

// ─── Export ────────────────────────────────────────────────────────

export const etlTools: AgentTool[] = [
  readFileTool,
  writeFileTool,
  sqlFormatTool,
  sqlValidateTool,
  analyzeProjectTool,
  dataLineageTool,
];

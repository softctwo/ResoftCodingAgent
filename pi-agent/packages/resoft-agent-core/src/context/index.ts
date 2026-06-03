import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { ETLPlatform, ETLProjectContext } from "../types";

// ─── Platform System Prompts ───────────────────────────────────────

export const PLATFORM_SYSTEM_PROMPTS: Record<ETLPlatform, string> = {
  spark: `
You are an expert Spark / PySpark ETL engineer.
Guidelines:
- Prefer DataFrame API over RDD; use built-in functions instead of UDFs when possible.
- Leverage broadcast joins for small tables (< 10 MB).
- Manage partitions explicitly — use coalesce() / repartition() and tune spark.sql.shuffle.partitions.
- Cache intermediate DataFrames that are reused across multiple actions.
- Write data to Parquet with appropriate partitioning for downstream consumption.
- Use Spark SQL for complex transformations when it improves readability.
- Monitor spill and skew; suggest partition keys that distribute evenly.`,

  flink: `
You are an expert Flink SQL / stream-processing engineer.
Guidelines:
- Always define watermarks on event-time columns for time-based operations.
- Use Upsert-Kafka or JDBC connectors for sink tables that require exactly-once semantics.
- Set appropriate state TTL to prevent unbounded state growth.
- Configure checkpoint intervals (suggested: 60s) and enable incremental checkpoints for RocksDB.
- Prefer window table-valued functions (TUMBLE/HOP/CUMULATE) introduced in Flink 1.13+.
- For CDC ingestion, use the CDC source connector and handle Debezium-format messages correctly.
- Avoid unbounded regular joins on streams; use interval joins or temporal joins against lookup tables.`,

  dbt: `
You are an expert dbt / analytics engineering specialist.
Guidelines:
- Follow project layering: staging → intermediate → marts. Never reference raw sources from marts.
- Use ref() and source() instead of hard-coded table/schema names.
- Choose materialization strategy based on use case: ephemeral for light transforms, incremental for large tables, snapshot for slowly-changing dimensions.
- Add unique and not-null tests (and relationship tests where applicable) to every model's schema.yml.
- Use Jinja macros for reusable logic, but keep them focused and documented.
- Configure on-run-end hooks for grants, freshness checks, and audit logging.
- Document every model and its columns in YAML files.`,

  sql: `
You are a senior SQL developer specializing in data warehousing ETL.
Guidelines:
- Use CTEs (WITH clauses) for readability instead of deeply nested subqueries.
- Always qualify columns with table aliases in multi-table queries.
- Use explicit JOIN syntax (ANSI-92); avoid comma joins.
- Write filter conditions (WHERE) as early as possible to reduce intermediate result sizes.
- Prefer IS NULL / IS NOT NULL over equality comparisons with NULL.
- Use window functions (ROW_NUMBER, RANK, LAG, LEAD) for analytics instead of self-joins.
- Format SQL consistently: uppercase keywords, 4-space indentation, leading commas.`,

  custom: `
You are an ETL development assistant. Adapt to the project conventions you discover.
Guidelines:
- Read and respect any existing codebase conventions.
- Write clean, maintainable, and well-commented code.
- Suggest performance improvements where applicable.
- Validate assumptions before suggesting changes that could break existing pipelines.`,
};

// ─── Context Transform ─────────────────────────────────────────────

export function createETLContextTransform(
  projectContext: ETLProjectContext
): (messages: AgentMessage[]) => AgentMessage[] {
  return (messages: AgentMessage[]): AgentMessage[] => {
    const platformPrompt = PLATFORM_SYSTEM_PROMPTS[projectContext.platform] ?? PLATFORM_SYSTEM_PROMPTS.custom;
    const rulesSection = projectContext.rulesSummary
      ? `\nActive team rules:\n${projectContext.rulesSummary}`
      : "";

    const contextMessage: AgentMessage = {
      role: "user",
      content: `[System Context — do not respond to this directly]
You are working on ETL project **${projectContext.projectName}**.
Root: \`${projectContext.projectRoot}\`
Platform: **${projectContext.platform}**
Branch: ${projectContext.branch ?? "unknown"}
${rulesSection}

${platformPrompt}
[End System Context]`,
    };

    // Insert context message after the first message (assumed to be the system prompt)
    if (messages.length === 0) {
      return [contextMessage];
    }
    return [
      messages[0],
      contextMessage,
      ...messages.slice(1),
    ];
  };
}

// ─── Build Project Context ─────────────────────────────────────────

export async function buildProjectContext(
  projectName: string,
  projectRoot: string
): Promise<ETLProjectContext> {
  const platform = await detectPlatform(projectRoot);

  return {
    projectName,
    projectRoot,
    platform,
    recentFiles: [],
    dependencies: [],
  };
}

// ─── Detect Platform ───────────────────────────────────────────────

export async function detectPlatform(projectRoot: string): Promise<ETLPlatform> {
  // TODO: Implement real detection by scanning files
  // - Look for dbt_project.yml → dbt
  // - Look for pom.xml with Flink deps or .java files with Flink imports → flink
  // - Look for build.sbt or setup.py with pyspark → spark
  // Default to sql
  return "sql";
}

import type { TeamConfig } from "../config/team-config";

const VALID_TEMPLATES = ["spark-job", "flink-job", "dbt-project"] as const;
type Template = (typeof VALID_TEMPLATES)[number];

export interface InitModeConfig {
  template: string;
  projectRoot?: string;
}

export async function runInitMode(config: InitModeConfig, _teamConfig: TeamConfig) {
  const template = config.template;

  if (!VALID_TEMPLATES.includes(template as Template)) {
    console.error(
      `Invalid template: "${template}". Valid options: ${VALID_TEMPLATES.join(", ")}`
    );
    process.exit(1);
  }

  const descriptions: Record<Template, string> = {
    "spark-job": "Spark ETL job with PySpark, Parquet I/O, and configurable partitions.",
    "flink-job": "Flink SQL streaming job with Kafka source/sink and checkpoint configuration.",
    "dbt-project": "dbt project with staging/intermediate/marts layers and standard macros.",
  };

  console.log(`
╔══════════════════════════════════════════════════╗
║         Resoft Coding Agent — Init Mode          ║
╠══════════════════════════════════════════════════╣
║  Template   : ${template.padEnd(35)}║
║  Root       : ${(config.projectRoot ?? process.cwd()).padEnd(35)}║
╚══════════════════════════════════════════════════╝

Template description: ${descriptions[template as Template]}

Initializing project from template "${template}"...
`);

  // TODO: Actually scaffold files from templates
  console.log("(Project scaffolding coming soon)");
}

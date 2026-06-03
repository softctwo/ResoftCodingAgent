#!/usr/bin/env node
import { Command } from "commander";
import { main } from "./main.ts";
import type { MainConfig } from "./main.ts";

const program = new Command();

program
  .name("resoft")
  .description("Resoft Coding Agent — Data ETL Development Assistant")
  .version("0.1.0");

// ─── chat ──────────────────────────────────────────────────────────

program
  .command("chat")
  .description("Start interactive ETL coding session")
  .option("-p, --platform <platform>", "ETL platform: spark, flink, dbt, sql, custom", "sql")
  .option("-n, --name <name>", "Project name", "etl-project")
  .option("--no-review", "Disable automatic code review")
  .option("--team-config <path>", "Path to team config directory")
  .action(async (options) => {
    const config: MainConfig = {
      mode: "chat",
      chat: {
        platform: options.platform,
        projectName: options.name,
        autoReview: options.review !== false,
      },
      teamConfigPath: options.teamConfig,
    };
    await main(config);
  });

// ─── review ────────────────────────────────────────────────────────

program
  .command("review [file]")
  .description("Review ETL code for issues")
  .option("-p, --platform <platform>", "Target platform", "sql")
  .option("--incremental", "Incremental review (only changed lines)")
  .option("--team-config <path>", "Path to team config directory")
  .action(async (file, options) => {
    const config: MainConfig = {
      mode: "review",
      review: {
        file,
        platform: options.platform,
        incremental: options.incremental ?? false,
      },
      teamConfigPath: options.teamConfig,
    };
    await main(config);
  });

// ─── ci ────────────────────────────────────────────────────────────

program
  .command("ci")
  .description("CI/CD pipeline mode — review files with exit codes")
  .option("--files <files>", "Comma or space-separated list of files")
  .option("-p, --platform <platform>", "Target platform", "sql")
  .option("--format <format>", "Output format: text, json, sarif, checkstyle", "text")
  .option("--min-severity <severity>", "Minimum severity: error, warning, info", "warning")
  .option("--fail-on-error", "Exit with non-zero code on errors", true)
  .option("--no-fail-on-error", "Exit 0 even on errors")
  .option("--fail-on-warning", "Exit with non-zero code on warnings")
  .option("--team-config <path>", "Path to team config directory")
  .action(async (options) => {
    const files = options.files
      ? options.files.split(/[,\s]+/).filter(Boolean)
      : [];

    const { loadTeamConfig } = await import("./config/team-config.ts");
    const teamConfig = await loadTeamConfig(options.teamConfig);
    const allRules = teamConfig.rules.flatMap((rs) => rs.rules);

    const { runCIMode } = await import("./modes/ci-mode.ts");
    await runCIMode(
      {
        files,
        platform: options.platform,
        format: options.format,
        minSeverity: options.minSeverity,
        failOnError: options.failOnError,
        failOnWarning: options.failOnWarning,
      },
      allRules,
    );
  });

// ─── init ──────────────────────────────────────────────────────────

program
  .command("init <template>")
  .description("Initialize a new ETL project from template")
  .option("--team-config <path>", "Path to team config directory")
  .action(async (template, options) => {
    const config: MainConfig = {
      mode: "init",
      init: { template },
      teamConfigPath: options.teamConfig,
    };
    await main(config);
  });

// ─── skill ─────────────────────────────────────────────────────────

program
  .command("skill <action> [name]")
  .description("Manage skills: list, enable, disable, detect")
  .option("--team-config <path>", "Path to team config directory")
  .action(async (action, name, options) => {
    const validActions = ["list", "enable", "disable", "detect"];
    if (!validActions.includes(action)) {
      console.error(`Invalid action: "${action}". Use: ${validActions.join(", ")}`);
      process.exit(1);
    }

    if (action === "detect") {
      const { runSkillDetect } = await import("./modes/skill-detect.ts");
      await runSkillDetect(name);
      return;
    }

    const config: MainConfig = {
      mode: "skill",
      skill: {
        action: action as "list" | "enable" | "disable",
        name,
      },
      teamConfigPath: options.teamConfig,
    };
    await main(config);
  });

// ─── stats ─────────────────────────────────────────────────────────

program
  .command("stats <action>")
  .description("Usage statistics: summary, daily, export, pricing")
  .option("-d, --days <n>", "Number of days", "7")
  .option("-o, --output <file>", "Output file for export")
  .option("--data-dir <dir>", "Stats data directory")
  .action(async (action, options) => {
    const validActions = ["summary", "daily", "export", "pricing"];
    if (!validActions.includes(action)) {
      console.error(`Invalid action: "${action}". Use: ${validActions.join(", ")}`);
      process.exit(1);
    }
    const { runStatsMode } = await import("./modes/stats-mode.ts");
    runStatsMode({
      action,
      days: parseInt(options.days),
      output: options.output,
      dataDir: options.dataDir,
    });
  });

// ─── dashboard ─────────────────────────────────────────────────────

program
  .command("dashboard")
  .description("Start the team dashboard web server")
  .option("-p, --port <port>", "Port to listen on", "3456")
  .option("-h, --host <host>", "Host to bind", "127.0.0.1")
  .option("--open", "Open in browser")
  .option("--team-config <path>", "Path to team config directory")
  .action(async (options) => {
    const { DashboardServer } = await import("./dashboard/index.ts");

    const server = new DashboardServer({
      port: parseInt(options.port),
      host: options.host,
    });

    await server.start();

    if (options.open) {
      const { exec } = await import("node:child_process");
      const url = `http://${options.host}:${options.port}`;
      const cmd =
        process.platform === "darwin"
          ? `open "${url}"`
          : process.platform === "win32"
            ? `start "" "${url}"`
            : `xdg-open "${url}"`;
      exec(cmd);
    }

    console.log("Press Ctrl+C to stop.");
  });

// ─── template ───────────────────────────────────────────────────────

program
  .command("template <action>")
  .description("Manage code templates: list, search, render, export")
  .option("--platform <platform>", "Filter by platform")
  .option("--category <category>", "Filter by category")
  .option("--tag <tag>", "Filter by tag")
  .option("-k, --keyword <keyword>", "Search keyword")
  .option("-i, --id <id>", "Template ID")
  .option("--vars <json>", "JSON string of variable values")
  .option("-o, --output <file>", "Output file for export")
  .action(async (action, options) => {
    const validActions = ["list", "search", "render", "export"];
    if (!validActions.includes(action)) {
      console.error(`Invalid action: "${action}". Use: ${validActions.join(", ")}`);
      process.exit(1);
    }
    const { runTemplateMode } = await import("./modes/template-mode.ts");
    runTemplateMode({
      action: action as "list" | "search" | "render" | "export",
      platform: options.platform,
      category: options.category,
      tag: options.tag,
      keyword: options.keyword,
      id: options.id,
      vars: options.vars,
      output: options.output,
    });
  });

program.parse(process.argv);

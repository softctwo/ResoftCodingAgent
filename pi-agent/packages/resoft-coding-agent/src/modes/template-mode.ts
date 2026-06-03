import { TemplateEngine, BUILTIN_TEMPLATES } from "@resoft/agent-core";
import type { TemplateCodeTemplate } from "@resoft/agent-core";
import type { ETLPlatform } from "@resoft/agent-core";
import { writeFileSync } from "node:fs";

export interface TemplateModeConfig {
  action: "list" | "search" | "render" | "export";
  keyword?: string;
  platform?: string;
  category?: string;
  tag?: string;
  id?: string;
  vars?: string;
  output?: string;
}

export function runTemplateMode(config: TemplateModeConfig) {
  const engine = new TemplateEngine();
  for (const t of BUILTIN_TEMPLATES) engine.register(t);

  switch (config.action) {
    case "list": {
      const templates = engine.list({
        platform: config.platform as ETLPlatform | undefined,
        category: config.category,
        tag: config.tag,
      });
      console.log(`\n📋 Templates (${templates.length})\n`);
      console.log(
        `${"ID".padEnd(25)} ${"Name".padEnd(25)} ${"Platform".padEnd(8)} ${"Category".padEnd(15)} ${"Vars"}`
      );
      console.log("─".repeat(90));
      for (const t of templates) {
        console.log(
          `${t.id.padEnd(25)} ${t.name.padEnd(25)} ${t.platform.padEnd(8)} ${t.category.padEnd(15)} ${t.variables.length}`
        );
      }
      console.log(`\n💡 Use "resoft template render <id>" to generate code from a template.`);
      break;
    }

    case "search": {
      if (!config.keyword) {
        console.error('Provide a keyword: resoft template search "jdbc"');
        process.exit(1);
      }
      const results = engine.search(config.keyword);
      console.log(`\n🔍 Results for "${config.keyword}" (${results.length})\n`);
      for (const t of results) {
        console.log(`  ${t.id.padEnd(25)} ${t.name}`);
        console.log(`    ${t.description.substring(0, 80)}`);
        console.log();
      }
      break;
    }

    case "render": {
      if (!config.id) {
        console.error("Provide a template ID: resoft template render spark-read-jdbc");
        process.exit(1);
      }

      // Parse variables
      let variables: Record<string, string> = {};
      if (config.vars) {
        try {
          variables = JSON.parse(config.vars);
        } catch {
          console.error("Invalid vars JSON. Use: --vars '{\"KEY\":\"value\"}'");
          process.exit(1);
        }
      }

      // Show variable prompts if missing
      const tpl = engine.get(config.id);
      if (!tpl) {
        console.error(`Template "${config.id}" not found.`);
        process.exit(1);
      }

      // Check for missing required vars
      const missing = tpl.variables.filter(
        (v) => v.required && !variables[v.name] && !v.defaultValue
      );
      if (missing.length > 0) {
        console.log(`\n⚠️  Template "${tpl.name}" requires these variables:\n`);
        for (const v of tpl.variables) {
          const marker = v.required ? "🔴 required" : "🟢 optional";
          const def = v.defaultValue ? ` (default: "${v.defaultValue}")` : "";
          console.log(`  ${v.name.padEnd(20)} ${marker.padEnd(15)} ${v.description}${def}`);
        }
        console.log(`\n💡 Pass variables with: --vars '{"${missing[0].name}":"value"}'`);
        process.exit(1);
      }

      // Render
      const code = engine.render(config.id, variables);
      console.log(`\n📄 Generated: ${tpl.name}\n`);
      console.log("─".repeat(60));
      console.log(code);
      console.log("─".repeat(60));
      break;
    }

    case "export": {
      const templates = engine.exportAll();
      const json = JSON.stringify(templates, null, 2);
      if (config.output) {
        writeFileSync(config.output, json, "utf-8");
        console.log(`Exported ${templates.length} templates to ${config.output}`);
      } else {
        console.log(json);
      }
      break;
    }
  }
}

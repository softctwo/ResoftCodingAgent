import { AutoSkillTrigger } from "@resoft/agent-core";
import type { SkillMeta } from "@resoft/agent-core";
import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export async function runSkillDetect(targetPath?: string, format: "text" | "json" = "text") {
  const projectRoot = targetPath ? resolve(targetPath) : process.cwd();

  if (!existsSync(projectRoot)) {
    console.error(`Path not found: ${projectRoot}`);
    process.exit(1);
  }

  console.log(`\n🔍 Scanning project: ${projectRoot}\n`);

  // Collect project files (max depth 3)
  const files = collectFiles(projectRoot, 3);
  console.log(`  Found ${files.length} files\n`);

  // Platform detection via content markers
  const PLATFORM_MARKERS: Record<string, string[]> = {
    spark: ["pyspark", "SparkSession", "SparkContext", "spark.sql"],
    flink: ["flink.streaming", "StreamExecutionEnvironment", "TableEnvironment"],
    dbt: ["dbt_project.yml", "{{ ref(", "{{ source(", "{{ config("],
    sql: ["CREATE TABLE", "SELECT ", "MERGE INTO"],
  };

  let bestPlatform = "sql";
  let bestScore = 0;
  const platformScores: Record<string, number> = {};

  for (const file of files) {
    try {
      const fullPath = join(projectRoot, file);
      const content = readTextFile(fullPath);
      if (!content) continue;

      for (const [platform, markers] of Object.entries(PLATFORM_MARKERS)) {
        const matches = markers.filter((m) => content.includes(m));
        platformScores[platform] = (platformScores[platform] || 0) + matches.length;
      }
    } catch {
      // skip unreadable files
    }
  }

  for (const [platform, score] of Object.entries(platformScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestPlatform = platform;
    }
  }

  // File extension analysis
  const extCounts: Record<string, number> = {};
  for (const file of files) {
    const ext = file.substring(file.lastIndexOf("."));
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  }

  // Recommended skills
  const recommendations: Array<{ name: string; reason: string; confidence: string }> = [];

  if (bestScore > 0) {
    recommendations.push({
      name: `resoft-${bestPlatform}`,
      reason: `Detected ${bestPlatform.toUpperCase()} project (${bestScore} markers)`,
      confidence: bestScore > 5 ? "★★★" : bestScore > 2 ? "★★☆" : "★☆☆",
    });
  }

  if (extCounts[".sql"] || extCounts[".ddl"] || extCounts[".dml"]) {
    recommendations.push({
      name: "resoft-sql",
      reason: `${
        (extCounts[".sql"] || 0) + (extCounts[".ddl"] || 0) + (extCounts[".dml"] || 0)
      } SQL files found`,
      confidence: "★★★",
    });
  }

  if (extCounts[".py"]) {
    recommendations.push({
      name: "resoft-spark",
      reason: `${extCounts[".py"]} Python files found`,
      confidence: "★★☆",
    });
  }

  if (extCounts[".yml"] || extCounts[".yaml"]) {
    recommendations.push({
      name: "resoft-dbt",
      reason: `${(extCounts[".yml"] || 0) + (extCounts[".yaml"] || 0)} YAML files found`,
      confidence: "★★☆",
    });
  }

  // JSON output (non-interactive / CI-friendly)
  if (format === "json") {
    const communitySuggestions: string[] = [];
    if (extCounts[".tsx"] || extCounts[".jsx"] || extCounts[".vue"]) communitySuggestions.push("vercel-skills");
    const testFiles = files.filter(f => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__"));
    if (testFiles.length > 0) communitySuggestions.push("superpowers");
    if (files.filter(f => f.endsWith(".md")).length > 3) communitySuggestions.push("planning-files");
    if (files.length > 100) communitySuggestions.push("context-engineering");

    const output = {
      projectRoot,
      filesFound: files.length,
      detectedPlatform: bestPlatform,
      platformScores,
      fileExtensions: extCounts,
      recommendations,
      communitySuggestions,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Display results
  console.log("═══ Platform Detection ═══\n");
  console.log(`  Detected: ${bestPlatform.toUpperCase()} (score: ${bestScore})\n`);

  if (Object.keys(platformScores).length > 1) {
    console.log("  All scores:");
    for (const [p, s] of Object.entries(platformScores)) {
      const bar = "█".repeat(Math.min(s, 20));
      console.log(`    ${p.padEnd(8)} ${bar} ${s}`);
    }
  }

  console.log("\n═══ File Summary ═══\n");
  const sortedExts = Object.entries(extCounts).sort((a, b) => b[1] - a[1]);
  for (const [ext, count] of sortedExts.slice(0, 8)) {
    console.log(`  ${ext.padEnd(8)} ${count} files`);
  }

  console.log("\n═══ Skill Recommendations ═══\n");
  for (const rec of recommendations) {
    console.log(`  ${rec.confidence} ${rec.name.padEnd(20)} ${rec.reason}`);
  }

  // Community skill suggestions
  console.log("\n═══ Community Skills ═══\n");
  if (extCounts[".tsx"] || extCounts[".jsx"] || extCounts[".vue"]) {
    console.log("  💡 vercel-skills — Frontend quality rules for React/Vue");
  }
  const testFiles = files.filter(
    (f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__")
  );
  if (testFiles.length > 0) {
    console.log("  💡 superpowers — Test-first development practice");
  }
  if (files.filter((f) => f.endsWith(".md")).length > 3) {
    console.log("  💡 planning-files — Markdown-based project planning");
  }
  if (files.length > 100) {
    console.log("  💡 context-engineering — Context management for large projects");
  }

  console.log("\n💡 Run: resoft skill enable <name> to activate recommended skills\n");
}

function collectFiles(root: string, maxDepth: number): string[] {
  const files: string[] = [];
  const rootNormalized = root.endsWith("/") ? root : root + "/";

  const walk = (dir: string, depth: number) => {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(dir)) {
        if (
          entry.startsWith(".") ||
          entry === "node_modules" ||
          entry === "dist"
        )
          continue;
        const fullPath = join(dir, entry);
        try {
          const st = statSync(fullPath);
          if (st.isDirectory()) {
            walk(fullPath, depth + 1);
          } else if (st.isFile() && st.size < 1024 * 1024) {
            files.push(fullPath.replace(rootNormalized, ""));
          }
        } catch {
          // skip permission errors
        }
      }
    } catch {
      // skip unreadable dirs
    }
  };

  walk(root, 0);
  return files;
}

function readTextFile(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

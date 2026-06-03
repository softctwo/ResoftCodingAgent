import type { ETLPlatform, SkillMeta } from "../types.ts";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface FileMatch {
  pattern: RegExp;
  skillName: string;
  confidence: number; // 0-1
  reason: string;
}

export interface PlatformSignal {
  platform: ETLPlatform;
  confidence: number;
  signals: string[];
}

export interface TriggerResult {
  matchedSkills: string[];
  detectedPlatform: ETLPlatform | null;
  platformConfidence: number;
  reasons: Map<string, string>;
}

const PLATFORM_MARKERS: Record<ETLPlatform, string[]> = {
  spark: [
    "pyspark", "spark.sql", "SparkSession", "SparkContext",
    "spark-submit", "spark-defaults", "RDD", "DataFrame",
    "from pyspark", "import pyspark", "scala.spark"
  ],
  flink: [
    "flink", "StreamExecutionEnvironment", "TableEnvironment",
    "Flink SQL", "KafkaSource", "FlinkKafka", "DataStream",
    "RichMapFunction", "KeyedProcessFunction", "checkpoint"
  ],
  dbt: [
    "dbt_project.yml", "dbt_project.yaml",
    "{{ ref(", "{{ source(", "{{ config(",
    "materialized", "dbt_utils", "dbt run"
  ],
  sql: [
    "CREATE TABLE", "SELECT ", "INSERT INTO",
    "MERGE INTO", "UPSERT", "BEGIN TRANSACTION",
    "DROP TABLE", "ALTER TABLE", "CREATE INDEX"
  ],
  custom: [
    "airflow", "dagster", "prefect",
    "kafka", "rabbitmq", "grpc", "thrift"
  ],
};

const FILE_EXTENSION_SKILLS: Record<string, string[]> = {
  ".py": ["resoft-spark", "resoft-flink"],
  ".sql": ["resoft-sql"],
  ".yml": ["resoft-dbt"],
  ".yaml": ["resoft-dbt"],
  ".scala": ["resoft-spark"],
  ".java": ["resoft-flink"],
  ".sh": [],
  ".json": [],
  ".md": [],
};

export class AutoSkillTrigger {
  private registeredSkills: SkillMeta[] = [];
  private projectRoot: string;

  constructor(skills: SkillMeta[], projectRoot: string) {
    this.registeredSkills = skills;
    this.projectRoot = projectRoot;
  }

  /** Analyze project files and determine which skills to enable */
  analyze(projectFiles: string[]): TriggerResult {
    const reasons = new Map<string, string>();
    const matchedSkills = new Set<string>();
    const platformSignals: PlatformSignal[] = [];

    for (const file of projectFiles) {
      // Check file extension
      const ext = file.substring(file.lastIndexOf("."));
      const extSkills = FILE_EXTENSION_SKILLS[ext] ?? [];
      for (const skillName of extSkills) {
        matchedSkills.add(skillName);
        reasons.set(skillName, reasons.get(skillName) || `File extension match: ${ext}`);
      }

      // Check file content for platform markers
      try {
        const fullPath = join(this.projectRoot, file);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, "utf-8");
          this.detectPlatformSignals(content, platformSignals);

          // Check for specific skill markers in file content
          const fileSkills = this.matchContentToSkills(content);
          for (const s of fileSkills) {
            matchedSkills.add(s);
            reasons.set(s, `Content match in ${file}`);
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Determine platform
    const bestPlatform = this.selectBestPlatform(platformSignals);

    // Also enable platform-matched skills
    const platform = bestPlatform?.platform ?? null;
    for (const skill of this.registeredSkills) {
      if (skill.platform === platform && skill.autoTrigger !== false) {
        matchedSkills.add(skill.name);
        reasons.set(skill.name, `Platform match: ${platform}`);
      }
    }

    return {
      matchedSkills: Array.from(matchedSkills),
      detectedPlatform: platform,
      platformConfidence: bestPlatform?.confidence ?? 0,
      reasons,
    };
  }

  private detectPlatformSignals(content: string, signals: PlatformSignal[]): void {
    for (const [platform, markers] of Object.entries(PLATFORM_MARKERS)) {
      const matched = markers.filter(m => content.includes(m));
      if (matched.length > 0) {
        signals.push({
          platform: platform as ETLPlatform,
          confidence: Math.min(matched.length / markers.length, 1.0),
          signals: matched,
        });
      }
    }
  }

  private selectBestPlatform(signals: PlatformSignal[]): PlatformSignal | null {
    if (signals.length === 0) return null;
    return signals.reduce((best, curr) =>
      curr.confidence > best.confidence ? curr : best
    );
  }

  private matchContentToSkills(content: string): string[] {
    const matches: string[] = [];

    const skillMarkers: Record<string, RegExp[]> = {
      "resoft-spark": [/import\s+pyspark/, /spark\.sql/, /SparkSession/],
      "resoft-flink": [/import\s+org\.apache\.flink/, /flink.*stream/i, /StreamExecutionEnvironment/],
      "resoft-dbt": [/\{\{\s*ref\(/, /\{\{\s*source\(/, /\{\{\s*config\(/],
      "resoft-sql": [/CREATE\s+(OR\s+REPLACE\s+)?(TABLE|VIEW|FUNCTION)/i, /SELECT\s+.+\s+FROM/i],
    };

    for (const [skillName, patterns] of Object.entries(skillMarkers)) {
      if (patterns.some(p => p.test(content))) {
        matches.push(skillName);
      }
    }

    return matches;
  }

  /** Auto-detect and enable relevant community skills */
  analyzeCommunitySkills(projectFiles: string[]): string[] {
    const communitySkills: string[] = [];
    let hasFrontend = false;
    let hasTests = false;
    let hasDocs = false;

    for (const file of projectFiles) {
      const ext = file.substring(file.lastIndexOf("."));

      // Frontend/web → Vercel skill
      if ([".tsx", ".jsx", ".vue", ".svelte"].includes(ext)) {
        hasFrontend = true;
      }

      // Tests → Superpowers
      if (file.includes(".test.") || file.includes(".spec.") || file.includes("__tests__")) {
        hasTests = true;
      }

      // Documentation → Planning with Files / MiniMax
      if (file.endsWith(".md") || file.includes("docs/")) {
        hasDocs = true;
      }
    }

    if (hasFrontend) {
      communitySkills.push("vercel-agent-skills");
    }
    if (hasTests) {
      communitySkills.push("superpowers");
    }
    if (hasDocs) {
      communitySkills.push("planning-with-files", "minimax-skills");
    }
    // Multiple files → Context Engineering
    if (projectFiles.length > 50) {
      communitySkills.push("context-engineering");
    }

    return Array.from(new Set(communitySkills));
  }
}

import type { ETLPlatform, DetectedContext, ProjectFeature } from "../types.ts";

/**
 * Auto-detect the ETL platform and relevant skills from project files.
 *
 * Detects:
 *  - File extensions (.sql, .py, .scala, .yml, .yaml)
 *  - Framework markers (dbt_project.yml, build.sbt, pom.xml, build.gradle)
 *  - Import patterns (pyspark, dbt, pyflink, apache_beam)
 *  - Dependency files (requirements.txt, pyproject.toml)
 */
export class ContextDetector {
  private features: ProjectFeature[] = [
    // --- File extension signals ---
    {
      type: "file",
      pattern: "\\.sql$",
      weight: 15,
      platforms: ["sql"],
    },
    {
      type: "file",
      pattern: "\\.scala$",
      weight: 20,
      platforms: ["spark", "flink"],
    },
    {
      type: "file",
      pattern: "\\.py$",
      weight: 10,
      platforms: ["spark", "flink", "dbt"],
    },
    // --- Framework markers ---
    {
      type: "framework",
      pattern: "dbt_project\\.yml$",
      weight: 40,
      platforms: ["dbt"],
    },
    {
      type: "framework",
      pattern: "profiles\\.yml$",
      weight: 30,
      platforms: ["dbt"],
    },
    {
      type: "framework",
      pattern: "build\\.sbt$",
      weight: 25,
      platforms: ["spark"],
    },
    {
      type: "framework",
      pattern: "pom\\.xml$",
      weight: 20,
      platforms: ["spark", "flink"],
    },
    {
      type: "framework",
      pattern: "build\\.gradle(\\.kts)?$",
      weight: 20,
      platforms: ["spark", "flink"],
    },
    // --- Import signals ---
    {
      type: "import",
      pattern: "from\\s+pyspark\\b",
      weight: 35,
      platforms: ["spark"],
    },
    {
      type: "import",
      pattern: "import\\s+org\\.apache\\.spark\\b",
      weight: 35,
      platforms: ["spark"],
    },
    {
      type: "import",
      pattern: "from\\s+pyflink\\b",
      weight: 35,
      platforms: ["flink"],
    },
    {
      type: "import",
      pattern: "import\\s+org\\.apache\\.flink\\b",
      weight: 35,
      platforms: ["flink"],
    },
    {
      type: "import",
      pattern: "from\\s+dbt\\b|import\\s+dbt\\b",
      weight: 35,
      platforms: ["dbt"],
    },
    {
      type: "import",
      pattern: "\\{\\{\\s*ref\\(",
      weight: 25,
      platforms: ["dbt"],
    },
    {
      type: "import",
      pattern: "\\{\\{\\s*source\\(",
      weight: 25,
      platforms: ["dbt"],
    },
    {
      type: "import",
      pattern: "SparkSession\\.builder",
      weight: 30,
      platforms: ["spark"],
    },
    {
      type: "import",
      pattern: "StreamExecutionEnvironment",
      weight: 30,
      platforms: ["flink"],
    },
    // --- Dependency signals ---
    {
      type: "dependency",
      pattern: "dbt-core",
      weight: 30,
      platforms: ["dbt"],
    },
    {
      type: "dependency",
      pattern: "pyspark",
      weight: 30,
      platforms: ["spark"],
    },
    {
      type: "dependency",
      pattern: "apache-flink",
      weight: 30,
      platforms: ["flink"],
    },
  ];

  /** Scan a list of file paths and detect the project context */
  detect(files: string[], fileContents?: Map<string, string>): DetectedContext {
    const scores: Record<string, number> = {};
    const evidence: string[] = [];

    for (const f of files) {
      for (const feature of this.features) {
        let matched = false;

        switch (feature.type) {
          case "file":
          case "framework":
            matched = new RegExp(feature.pattern, "i").test(f);
            break;
          case "import":
          case "dependency": {
            if (fileContents) {
              const content = fileContents.get(f);
              if (content) {
                matched = new RegExp(feature.pattern, "i").test(content);
              }
            }
            // Also check filename itself for dependency files
            if (!matched) {
              matched = new RegExp(feature.pattern, "i").test(f);
            }
            break;
          }
        }

        if (matched) {
          for (const platform of feature.platforms) {
            scores[platform] = (scores[platform] || 0) + feature.weight;
          }
          evidence.push(`${feature.type}:${f} → ${feature.platforms.join(",")}`);
        }
      }
    }

    // Determine the platform with the highest score
    let bestPlatform: ETLPlatform = "sql";
    let bestScore = 0;
    const entries = Object.entries(scores) as Array<[ETLPlatform, number]>;
    for (const [platform, score] of entries) {
      if (score > bestScore) {
        bestScore = score;
        bestPlatform = platform;
      }
    }

    // Confidence: 0–1
    const totalEvidence = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence =
      totalEvidence > 0 ? bestScore / totalEvidence : 0;

    return {
      platform: bestPlatform,
      confidence: Math.min(confidence * 1.5, 1.0), // boost slightly
      evidence,
      suggestedSkills: [],
    };
  }

  /** Get recommended skill names for a detected context */
  getRecommendedSkills(context: DetectedContext): string[] {
    const skillMap: Record<ETLPlatform, string[]> = {
      spark: ["spark-review", "spark-optimization", "python-best-practices"],
      flink: ["flink-review", "flink-state", "java-best-practices"],
      dbt: ["dbt-review", "dbt-modeling", "sql-review"],
      sql: ["sql-review", "sql-optimization"],
      custom: [],
    };

    return skillMap[context.platform] ?? [];
  }

  /** Quick detection from a single file */
  detectFromFile(filePath: string, content?: string): DetectedContext {
    const contents = content ? new Map([[filePath, content]]) : undefined;
    return this.detect([filePath], contents);
  }

  /** Register additional custom features */
  addFeature(feature: ProjectFeature): void {
    this.features.push(feature);
  }

  /** Reset to default features */
  resetFeatures(): void {
    this.features = this.features.filter(
      // Keep only original features — simplified: just keep first N
      (_f, i) => i < 20,
    );
  }
}

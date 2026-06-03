import * as fs from "node:fs";
import * as path from "node:path";
import type { RuleSet, SkillRegistry, CodingRule } from "@resoft/agent-core";

// ─── Team Config ───────────────────────────────────────────────────

export interface TeamConfig {
  rules: RuleSet[];
  skills: SkillRegistry;
}

const TEAM_CONFIG_DIR =
  process.env.RESOFT_TEAM_CONFIG ??
  path.resolve(process.cwd(), "../../team-config");

// ─── Simple YAML Parser ────────────────────────────────────────────
// Minimal YAML subset: key: value, arrays with `-`, no nesting beyond 2 levels.

export function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split("\n");
  let currentKey: string | null = null;
  let currentArray: unknown[] = [];
  let inArray = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line === "" || line.startsWith("#")) continue;

    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (inArray && (indent > 2 || !trimmed.startsWith("-"))) {
      // End of array
      if (currentKey) {
        result[currentKey] = currentArray;
        currentKey = null;
      }
      currentArray = [];
      inArray = false;
    }

    if (indent > 2 && trimmed.startsWith("- ") && currentKey) {
      inArray = true;
      const value = trimmed.slice(2).trim();
      currentArray.push(parseYamlValue(value));
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    if (currentKey && inArray) {
      result[currentKey] = currentArray;
      currentArray = [];
      inArray = false;
      currentKey = null;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();

    if (rawValue === "") {
      currentKey = key;
      currentArray = [];
      continue;
    }

    result[key] = parseYamlValue(rawValue);
    currentKey = null;
  }

  if (currentKey && inArray) {
    result[currentKey] = currentArray;
  }

  return result;
}

function parseYamlValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+\.?\d*$/.test(raw)) return Number(raw);
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

// ─── Rule File Parser ──────────────────────────────────────────────

export function parseRuleFile(content: string): RuleSet {
  const data = parseSimpleYaml(content);
  const name = String(data.name ?? "unnamed");
  const description = data.description ? String(data.description) : undefined;

  const rules: CodingRule[] = [];
  const rawRules = data.rules as Array<Record<string, unknown>> | undefined;

  if (rawRules) {
    for (const r of rawRules) {
      rules.push({
        id: String(r.id ?? ""),
        description: String(r.description ?? ""),
        pattern: r.pattern ? String(r.pattern) : undefined,
        severity: (r.severity as CodingRule["severity"]) ?? "warning",
        platforms: r.platforms as CodingRule["platforms"],
        suggestion: r.suggestion ? String(r.suggestion) : undefined,
      });
    }
  }

  return { name, description, rules };
}

// ─── Load Team Config ──────────────────────────────────────────────

export async function loadTeamConfig(configDir?: string): Promise<TeamConfig> {
  const base = configDir ?? TEAM_CONFIG_DIR;

  // Load rules
  const rulesDir = path.join(base, "rules");
  const ruleSets: RuleSet[] = [];

  if (fs.existsSync(rulesDir)) {
    const ruleFiles = fs
      .readdirSync(rulesDir)
      .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".json"));

    for (const file of ruleFiles) {
      const filePath = path.join(rulesDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      if (file.endsWith(".json")) {
        const parsed: RuleSet = JSON.parse(content);
        ruleSets.push(parsed);
      } else {
        ruleSets.push(parseRuleFile(content));
      }
    }
  }

  // Load skills registry
  const registryPath = path.join(base, "registry", "skills.yaml");
  let skills: SkillRegistry = { skills: {} };

  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, "utf-8");
    const data = parseSimpleYaml(content);
    const skillsData = data.skills as Array<Record<string, unknown>> | undefined;

    if (skillsData) {
      for (const s of skillsData) {
        const name = String(s.name ?? "");
        skills.skills[name] = {
          name,
          description: String(s.description ?? ""),
          path: String(s.path ?? ""),
          enabled: s.enabled !== false,
          autoTrigger: s.auto_trigger as boolean | undefined,
          platform: s.platform as SkillRegistry["skills"][string]["platform"],
        };
      }
    }
  }

  return { rules: ruleSets, skills };
}

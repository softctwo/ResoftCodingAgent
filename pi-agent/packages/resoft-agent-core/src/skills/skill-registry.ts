import type { SkillMeta, ETLPlatform } from "../types.ts";
import { AutoSkillTrigger } from "./auto-trigger.ts";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface SkillEntry extends SkillMeta {
  enabled: boolean;
  triggeredBy?: string;
}

export class SkillRegistry {
  private skills: Map<string, SkillEntry> = new Map();
  private autoTrigger: AutoSkillTrigger | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  register(skill: SkillMeta): void {
    this.skills.set(skill.name, {
      ...skill,
      enabled: skill.enabled ?? true,
    });
  }

  registerFromConfig(configs: SkillMeta[]): void {
    for (const config of configs) {
      this.register(config);
    }
  }

  enable(name: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;
    skill.enabled = true;
    return true;
  }

  disable(name: string): boolean {
    const skill = this.skills.get(name);
    if (!skill) return false;
    skill.enabled = false;
    return true;
  }

  getEnabled(): SkillEntry[] {
    return Array.from(this.skills.values()).filter(s => s.enabled);
  }

  getAll(): SkillEntry[] {
    return Array.from(this.skills.values());
  }

  get(name: string): SkillEntry | undefined {
    return this.skills.get(name);
  }

  /** Get all skills as a read-only map (for display/iteration) */
  getSkillMap(): ReadonlyMap<string, SkillEntry> {
    return this.skills;
  }

  /**
   * Scan the project and auto-enable relevant skills.
   * Returns list of newly enabled skills.
   */
  autoEnable(projectRoot?: string): string[] {
    const root = projectRoot ?? this.projectRoot;
    const enabledSkills = this.getEnabled();
    const entries: SkillMeta[] = enabledSkills.map(s => ({
      name: s.name,
      description: s.description,
      path: s.path,
      enabled: s.enabled,
      autoTrigger: s.autoTrigger,
      platform: s.platform,
    }));

    this.autoTrigger = new AutoSkillTrigger(entries, root);

    // Collect project files (limit depth for performance)
    const projectFiles = this.collectProjectFiles(root, 3);

    const result = this.autoTrigger.analyze(projectFiles);

    // Enable matched skills
    const newlyEnabled: string[] = [];
    for (const skillName of result.matchedSkills) {
      const skill = this.skills.get(skillName);
      if (skill && !skill.enabled) {
        skill.enabled = true;
        skill.triggeredBy = result.reasons.get(skillName) ?? "auto-detected";
        newlyEnabled.push(skillName);
      }
    }

    return newlyEnabled;
  }

  /** Get the auto-detected platform, if any */
  getDetectedPlatform(): ETLPlatform | null {
    if (this.autoTrigger) {
      return this.autoTrigger.analyze(
        this.collectProjectFiles(this.projectRoot, 2)
      ).detectedPlatform;
    }
    return null;
  }

  /** Detect community skills for the project */
  detectCommunitySkills(): string[] {
    const projectFiles = this.collectProjectFiles(this.projectRoot, 3);
    const trigger = new AutoSkillTrigger([], this.projectRoot);
    return trigger.analyzeCommunitySkills(projectFiles);
  }

  private collectProjectFiles(root: string, maxDepth: number): string[] {
    const files: string[] = [];
    const walk = (dir: string, depth: number) => {
      if (depth > maxDepth) return;
      try {
        for (const entry of readdirSync(dir)) {
          // Skip hidden dirs and node_modules
          if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
          const fullPath = join(dir, entry);
          try {
            if (statSync(fullPath).isDirectory()) {
              walk(fullPath, depth + 1);
            } else {
              files.push(relative(root, fullPath));
            }
          } catch {
            // skip
          }
        }
      } catch {
        // skip
      }
    };
    walk(root, 0);
    return files;
  }
}

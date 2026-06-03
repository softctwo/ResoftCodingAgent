import type { ETLPlatform } from "../types.ts";

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "select";
  options?: string[];
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  platform: ETLPlatform;
  category: "ingestion" | "transformation" | "quality" | "orchestration" | "utility";
  language: string;
  variables: TemplateVariable[];
  template: string;
  tags: string[];
  author: string;
  version: string;
}

export class TemplateEngine {
  private templates: Map<string, CodeTemplate> = new Map();

  register(template: CodeTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string): CodeTemplate | undefined {
    return this.templates.get(id);
  }

  list(filter?: { platform?: ETLPlatform; category?: string; tag?: string }): CodeTemplate[] {
    let results = Array.from(this.templates.values());
    if (filter?.platform) {
      results = results.filter(t => t.platform === filter.platform);
    }
    if (filter?.category) {
      results = results.filter(t => t.category === filter.category);
    }
    if (filter?.tag) {
      results = results.filter(t => t.tags.includes(filter.tag!));
    }
    return results;
  }

  /** Render a template with variable values */
  render(id: string, variables: Record<string, string>): string {
    const template = this.templates.get(id);
    if (!template) throw new Error(`Template not found: ${id}`);

    let result = template.template;

    // Validate required variables
    for (const v of template.variables) {
      if (v.required && !variables[v.name] && !v.defaultValue) {
        throw new Error(`Missing required variable: ${v.name}`);
      }
    }

    // Replace all variables
    for (const v of template.variables) {
      const value = variables[v.name] ?? v.defaultValue ?? "";
      result = result.replace(new RegExp(`\\$\\{${v.name}\\}`, "g"), value);
    }

    return result;
  }

  /** Get suggested variables for a template */
  getVariables(id: string): TemplateVariable[] {
    const template = this.templates.get(id);
    return template?.variables ?? [];
  }

  /** Search templates by keyword */
  search(query: string): CodeTemplate[] {
    const q = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      t => t.name.toLowerCase().includes(q) ||
           t.description.toLowerCase().includes(q) ||
           t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  /** Export all templates as JSON */
  exportAll(): CodeTemplate[] {
    return Array.from(this.templates.values());
  }

  /** Import templates from JSON */
  importAll(templates: CodeTemplate[]): void {
    for (const t of templates) {
      this.register(t);
    }
  }
}

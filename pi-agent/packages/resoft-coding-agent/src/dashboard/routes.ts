import type { IncomingMessage, ServerResponse } from "node:http";
import { overviewPage, issuesPage, usagePage, teamPage } from "./views.ts";

export interface DashboardStore {
  reviews: Array<{
    id: string;
    file: string;
    platform: string;
    issues: number;
    timestamp: number;
    passed: boolean;
    issues_detail: Array<{
      id: string;
      file: string;
      line: number;
      severity: string;
      ruleId: string;
      description: string;
      suggestion?: string;
      timestamp: number;
    }>;
  }>;
  usage: {
    totalTokens: number;
    totalCost: number;
    sessionCount: number;
    dailyUsage: Array<{ date: string; sessions: number; tokens: number; cost: number }>;
    byModel: Array<{ model: string; tokens: number; cost: number }>;
  };
  team: {
    members: Array<{
      name: string;
      email: string;
      role: string;
      reviews: number;
      issuesFound: number;
      passRate: number;
      lastActive: number;
    }>;
  };
}

export function createStore(): DashboardStore {
  return {
    reviews: [],
    usage: {
      totalTokens: 0,
      totalCost: 0,
      sessionCount: 0,
      dailyUsage: [],
      byModel: [],
    },
    team: {
      members: [],
    },
  };
}

export function handleAPI(store: DashboardStore, req: IncomingMessage, res: ServerResponse, saveCb?: () => void): boolean {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  // API: GET /api/summary
  if (url.pathname === "/api/summary" && req.method === "GET") {
    const totalIssues = store.reviews.reduce((s, r) => s + r.issues, 0);
    const passed = store.reviews.filter((r) => r.passed).length;
    const passRate = store.reviews.length > 0 ? Math.round((passed / store.reviews.length) * 100) : 100;
    json(res, {
      totalReviews: store.reviews.length,
      totalFiles: [...new Set(store.reviews.map((r) => r.file))].length,
      totalIssues,
      passRate,
      recentReviews: store.reviews.slice(-10).reverse(),
      topIssues: getTopIssues(store),
    });
    return true;
  }

  // API: GET /api/issues
  if (url.pathname === "/api/issues" && req.method === "GET") {
    const all = store.reviews.flatMap((r) => r.issues_detail);
    const bySeverity = { error: 0, warning: 0, info: 0 };
    for (const i of all) {
      bySeverity[i.severity as keyof typeof bySeverity]++;
    }
    json(res, {
      issues: all.slice(-100).reverse(),
      bySeverity,
      byRule: getTopIssues(store),
    });
    return true;
  }

  // API: GET /api/usage
  if (url.pathname === "/api/usage" && req.method === "GET") {
    json(res, store.usage);
    return true;
  }

  // API: GET /api/team
  if (url.pathname === "/api/team" && req.method === "GET") {
    json(res, {
      members: store.team.members,
      totalMembers: store.team.members.length,
      avgReviewsPerMember:
        store.team.members.length > 0
          ? store.team.members.reduce((s, m) => s + m.reviews, 0) / store.team.members.length
          : 0,
    });
    return true;
  }

  // API: POST /api/record — record a review result
  if (url.pathname === "/api/record" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (data.type === "review") {
          store.reviews.push({
            id: data.id ?? `rev-${Date.now()}`,
            file: data.file ?? "unknown",
            platform: data.platform ?? "sql",
            issues: data.issues ?? 0,
            timestamp: data.timestamp ?? Date.now(),
            passed: data.passed ?? true,
            issues_detail: data.issues_detail ?? [],
          });
        }
        json(res, { success: true });
        if (saveCb) saveCb();
      } catch {
        json(res, { success: false, error: "Invalid JSON" }, 400);
      }
    });
    return true;
  }

  return false;
}

export function handlePage(store: DashboardStore, req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  const totalIssues = store.reviews.reduce((s, r) => s + r.issues, 0);
  const passed = store.reviews.filter((r) => r.passed).length;
  const passRate = store.reviews.length > 0 ? Math.round((passed / store.reviews.length) * 100) : 100;

  if (url.pathname === "/" || url.pathname === "/overview") {
    html(res, overviewPage({
      totalReviews: store.reviews.length,
      totalFiles: [...new Set(store.reviews.map((r) => r.file))].length,
      totalIssues,
      passRate,
      recentReviews: store.reviews.slice(-10).reverse(),
      topIssues: getTopIssues(store),
    }));
    return;
  }

  if (url.pathname === "/issues") {
    const all = store.reviews.flatMap((r) => r.issues_detail);
    const bySeverity = { error: 0, warning: 0, info: 0 };
    for (const i of all) {
      bySeverity[i.severity as keyof typeof bySeverity]++;
    }
    html(res, issuesPage({
      issues: all.slice(-100).reverse(),
      bySeverity,
      byRule: getTopIssues(store),
    }));
    return;
  }

  if (url.pathname === "/usage") {
    html(res, usagePage(store.usage));
    return;
  }

  if (url.pathname === "/team") {
    html(res, teamPage({
      members: store.team.members,
      totalMembers: store.team.members.length,
      avgReviewsPerMember:
        store.team.members.length > 0
          ? store.team.members.reduce((s, m) => s + m.reviews, 0) / store.team.members.length
          : 0,
    }));
    return;
  }

  // 404
  html(res, `<div class="empty"><h3>404</h3><p>Page not found</p></div>`, 404);
}

function getTopIssues(store: DashboardStore): Array<{ ruleId: string; count: number; description: string }> {
  const counts: Record<string, { count: number; description: string }> = {};
  for (const r of store.reviews) {
    for (const i of r.issues_detail) {
      if (!counts[i.ruleId]) counts[i.ruleId] = { count: 0, description: i.description };
      counts[i.ruleId].count++;
    }
  }
  return Object.entries(counts)
    .map(([ruleId, v]) => ({ ruleId, ...v }))
    .sort((a, b) => b.count - a.count);
}

function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}

function html(res: ServerResponse, body: string, status = 200): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

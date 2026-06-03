import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createStore, handleAPI, handlePage } from "./routes.ts";
import type { DashboardStore } from "./routes.ts";

export interface DashboardConfig {
  port?: number;
  host?: string;
  teamMembers?: Array<{ name: string; email: string; role: string }>;
}

export class DashboardServer {
  public store: DashboardStore;
  private config: Required<Omit<DashboardConfig, "teamMembers">> & { teamMembers?: DashboardConfig["teamMembers"] };

  constructor(config: DashboardConfig = {}) {
    this.config = { port: 3456, host: "127.0.0.1", ...config };
    this.store = createStore();

    // Populate team if provided
    if (config.teamMembers) {
      this.store.team.members = config.teamMembers.map((m) => ({
        ...m,
        reviews: 0,
        issuesFound: 0,
        passRate: 100,
        lastActive: 0,
      }));
    }
  }

  start(): Promise<void> {
    const { port, host } = this.config;
    const store = this.store;

    return new Promise((resolve) => {
      const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        // CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        // Try API first, then page
        if (!handleAPI(store, req, res)) {
          handlePage(store, req, res);
        }
      });

      server.listen(port, host, () => {
        console.log(`Dashboard running at http://${host}:${port}`);
        resolve();
      });
    });
  }

  /** Record a review result into the dashboard store */
  recordReview(result: {
    file: string;
    platform: string;
    issues: number;
    passed: boolean;
    issues_detail: Array<{
      id: string;
      file: string;
      line: number;
      severity: string;
      ruleId: string;
      description: string;
      suggestion?: string;
    }>;
  }): void {
    this.store.reviews.push({
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...result,
      timestamp: Date.now(),
      issues_detail: result.issues_detail.map((i) => ({ ...i, timestamp: Date.now() })),
    });
  }

  /** Update usage stats */
  updateUsage(usage: Partial<DashboardStore["usage"]>): void {
    Object.assign(this.store.usage, usage);
  }
}

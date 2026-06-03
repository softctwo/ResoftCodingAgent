export function layoutPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Resoft Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .nav { background: #1e293b; border-bottom: 1px solid #334155; padding: 0 24px; display: flex; align-items: center; height: 56px; gap: 24px; }
    .nav h1 { font-size: 18px; font-weight: 600; color: #60a5fa; }
    .nav a { color: #94a3b8; text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 6px; }
    .nav a:hover, .nav a.active { color: #e2e8f0; background: #334155; }
    .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #f1f5f9; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; text-align: center; }
    .stat .value { font-size: 28px; font-weight: 700; color: #60a5fa; }
    .stat .label { font-size: 12px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #334155; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #1e293b; }
    tr:hover td { background: #1e293b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-error { background: #7f1d1d; color: #fca5a5; }
    .badge-warning { background: #78350f; color: #fcd34d; }
    .badge-info { background: #1e3a5f; color: #93c5fd; }
    .badge-pass { background: #14532d; color: #86efac; }
    .bar { height: 8px; border-radius: 4px; background: #334155; overflow: hidden; margin-top: 4px; }
    .bar-fill { height: 100%; border-radius: 4px; background: #60a5fa; transition: width 0.3s; }
    .progress-label { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .empty { text-align: center; padding: 48px; color: #64748b; }
    .empty h3 { font-size: 16px; margin-bottom: 8px; }
    .footer { text-align: center; padding: 24px; color: #475569; font-size: 12px; border-top: 1px solid #1e293b; margin-top: 48px; }
    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 768px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } .chart-row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <nav class="nav">
    <h1>⚡ Resoft Dashboard</h1>
    <a href="/" class="${title === "Overview" ? "active" : ""}">Overview</a>
    <a href="/issues" class="${title === "Issues" ? "active" : ""}">Issues</a>
    <a href="/usage" class="${title === "Usage" ? "active" : ""}">Usage</a>
    <a href="/team" class="${title === "Team" ? "active" : ""}">Team</a>
  </nav>
  <div class="container">
    ${body}
  </div>
  <div class="footer">
    ResoftCodingAgent — v1.0.0
  </div>
</body>
</html>`;
}

export function overviewPage(data: {
  totalReviews: number;
  totalFiles: number;
  totalIssues: number;
  passRate: number;
  recentReviews: Array<{
    id: string;
    file: string;
    platform: string;
    issues: number;
    timestamp: number;
    passed: boolean;
  }>;
  topIssues: Array<{ ruleId: string; count: number; description: string }>;
}): string {
  const recentHTML =
    data.recentReviews.slice(0, 10).map((r) => `
    <tr>
      <td style="font-family:monospace;font-size:12px">${r.id}</td>
      <td>${r.file}</td>
      <td><span class="badge badge-info">${r.platform}</span></td>
      <td>${r.issues}</td>
      <td>${new Date(r.timestamp).toLocaleString()}</td>
      <td><span class="badge ${r.passed ? "badge-pass" : "badge-error"}">${r.passed ? "PASS" : "FAIL"}</span></td>
    </tr>`).join("") || '<tr><td colspan="6" class="empty">No reviews yet</td></tr>';

  const topHTML =
    data.topIssues.slice(0, 5).map((i) => `
    <tr>
      <td style="font-family:monospace;font-size:12px">${i.ruleId}</td>
      <td>${i.description}</td>
      <td>${i.count}</td>
    </tr>`).join("") || '<tr><td colspan="3" class="empty">No issues found</td></tr>';

  return layoutPage("Overview", `
    <div class="grid-4">
      <div class="stat"><div class="value">${data.totalReviews}</div><div class="label">Total Reviews</div></div>
      <div class="stat"><div class="value">${data.totalFiles}</div><div class="label">Files Reviewed</div></div>
      <div class="stat"><div class="value">${data.totalIssues}</div><div class="label">Issues Found</div></div>
      <div class="stat"><div class="value">${data.passRate}%</div><div class="label">Pass Rate</div></div>
    </div>
    <div class="card">
      <h2>Recent Reviews</h2>
      <table>
        <thead><tr><th>ID</th><th>File</th><th>Platform</th><th>Issues</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>${recentHTML}</tbody>
      </table>
    </div>
    <div class="card">
      <h2>Top Issues</h2>
      <table>
        <thead><tr><th>Rule</th><th>Description</th><th>Count</th></tr></thead>
        <tbody>${topHTML}</tbody>
      </table>
    </div>`);
}

export function issuesPage(data: {
  issues: Array<{
    id: string;
    file: string;
    line: number;
    severity: string;
    ruleId: string;
    description: string;
    suggestion?: string;
    timestamp: number;
  }>;
  bySeverity: { error: number; warning: number; info: number };
  byRule: Array<{ ruleId: string; count: number }>;
}): string {
  const issueRows =
    data.issues.slice(0, 50).map((i) => `
    <tr>
      <td>${i.file}:${i.line}</td>
      <td><span class="badge badge-${i.severity}">${i.severity.toUpperCase()}</span></td>
      <td style="font-family:monospace;font-size:12px">${i.ruleId}</td>
      <td>${i.description}</td>
      <td>${new Date(i.timestamp).toLocaleDateString()}</td>
    </tr>`).join("") || '<tr><td colspan="5" class="empty">No issues</td></tr>';

  const ruleRows =
    data.byRule.map((r) => {
      const pct = data.issues.length > 0 ? (r.count / data.issues.length) * 100 : 0;
      return `<tr><td style="font-family:monospace;font-size:12px">${r.ruleId}</td><td>${r.count}</td><td><div class="progress-label"><span>${pct.toFixed(0)}%</span></div><div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div></td></tr>`;
    }).join("") || '<tr><td colspan="3" class="empty">No rules triggered</td></tr>';

  const total = data.bySeverity.error + data.bySeverity.warning + data.bySeverity.info || 1;

  return layoutPage("Issues", `
    <div class="grid-4">
      <div class="stat" style="border-color:#ef4444"><div class="value" style="color:#fca5a5">${data.bySeverity.error}</div><div class="label">Errors</div></div>
      <div class="stat" style="border-color:#f59e0b"><div class="value" style="color:#fcd34d">${data.bySeverity.warning}</div><div class="label">Warnings</div></div>
      <div class="stat" style="border-color:#3b82f6"><div class="value" style="color:#93c5fd">${data.bySeverity.info}</div><div class="label">Info</div></div>
      <div class="stat"><div class="value">${data.issues.length}</div><div class="label">Total</div></div>
    </div>
    <div class="chart-row">
      <div class="card"><h2>Issues by Rule</h2><table><thead><tr><th>Rule</th><th>Count</th><th>%</th></tr></thead><tbody>${ruleRows}</tbody></table></div>
      <div class="card">
        <h2>Severity Distribution</h2>
        <div style="margin:16px 0"><div class="progress-label"><span>Error</span><span>${((data.bySeverity.error / total) * 100).toFixed(0)}%</span></div><div class="bar"><div class="bar-fill" style="width:${(data.bySeverity.error / total) * 100}%;background:#ef4444"></div></div></div>
        <div style="margin:16px 0"><div class="progress-label"><span>Warning</span><span>${((data.bySeverity.warning / total) * 100).toFixed(0)}%</span></div><div class="bar"><div class="bar-fill" style="width:${(data.bySeverity.warning / total) * 100}%;background:#f59e0b"></div></div></div>
        <div style="margin:16px 0"><div class="progress-label"><span>Info</span><span>${((data.bySeverity.info / total) * 100).toFixed(0)}%</span></div><div class="bar"><div class="bar-fill" style="width:${(data.bySeverity.info / total) * 100}%;background:#3b82f6"></div></div></div>
      </div>
    </div>
    <div class="card"><h2>All Issues</h2><table><thead><tr><th>Location</th><th>Severity</th><th>Rule</th><th>Message</th><th>Date</th></tr></thead><tbody>${issueRows}</tbody></table></div>`);
}

export function usagePage(data: {
  totalTokens: number;
  totalCost: number;
  sessionCount: number;
  dailyUsage: Array<{ date: string; sessions: number; tokens: number; cost: number }>;
  byModel: Array<{ model: string; tokens: number; cost: number }>;
}): string {
  const maxTokens = Math.max(1, ...data.dailyUsage.map((d) => d.tokens));
  const dailyHTML =
    data.dailyUsage.map((d) => `
    <tr>
      <td>${d.date}</td>
      <td>${d.sessions}</td>
      <td>${d.tokens.toLocaleString()}</td>
      <td><div class="progress-label"><span>$${d.cost.toFixed(4)}</span></div><div class="bar"><div class="bar-fill" style="width:${(d.tokens / maxTokens) * 100}%"></div></div></td>
    </tr>`).join("") || '<tr><td colspan="4" class="empty">No usage data</td></tr>';

  const modelHTML =
    data.byModel.map((m) => `
    <tr>
      <td>${m.model}</td>
      <td>${m.tokens.toLocaleString()}</td>
      <td>$${m.cost.toFixed(4)}</td>
    </tr>`).join("") || '<tr><td colspan="3" class="empty">No model data</td></tr>';

  return layoutPage("Usage", `
    <div class="grid-4">
      <div class="stat"><div class="value">${data.totalTokens.toLocaleString()}</div><div class="label">Total Tokens</div></div>
      <div class="stat"><div class="value">$${data.totalCost.toFixed(4)}</div><div class="label">Total Cost</div></div>
      <div class="stat"><div class="value">${data.sessionCount}</div><div class="label">Sessions</div></div>
      <div class="stat"><div class="value">$${(data.sessionCount > 0 ? data.totalCost / data.sessionCount : 0).toFixed(4)}</div><div class="label">Avg Cost/Session</div></div>
    </div>
    <div class="chart-row">
      <div class="card"><h2>Daily Usage</h2><table><thead><tr><th>Date</th><th>Sessions</th><th>Tokens</th><th>Cost</th></tr></thead><tbody>${dailyHTML}</tbody></table></div>
      <div class="card"><h2>By Model</h2><table><thead><tr><th>Model</th><th>Tokens</th><th>Cost</th></tr></thead><tbody>${modelHTML}</tbody></table></div>
    </div>`);
}

export function teamPage(data: {
  members: Array<{
    name: string;
    email: string;
    role: string;
    reviews: number;
    issuesFound: number;
    passRate: number;
    lastActive: number;
  }>;
  totalMembers: number;
  avgReviewsPerMember: number;
}): string {
  const memberHTML =
    data.members.map((m) => `
    <tr>
      <td><strong>${m.name}</strong><br><span style="font-size:11px;color:#94a3b8">${m.email}</span></td>
      <td><span class="badge badge-info">${m.role}</span></td>
      <td>${m.reviews}</td>
      <td>${m.issuesFound}</td>
      <td>
        <div class="progress-label"><span>${m.passRate}%</span></div>
        <div class="bar"><div class="bar-fill" style="width:${m.passRate}%;background:${m.passRate >= 80 ? "#86efac" : m.passRate >= 50 ? "#fcd34d" : "#fca5a5"}"></div></div>
      </td>
      <td>${m.lastActive ? new Date(m.lastActive).toLocaleDateString() : "—"}</td>
    </tr>`).join("") || '<tr><td colspan="6" class="empty">No team members configured</td></tr>';

  return layoutPage("Team", `
    <div class="grid-4">
      <div class="stat"><div class="value">${data.totalMembers}</div><div class="label">Team Members</div></div>
      <div class="stat"><div class="value">${data.members.reduce((s, m) => s + m.reviews, 0)}</div><div class="label">Total Reviews</div></div>
      <div class="stat"><div class="value">${data.avgReviewsPerMember.toFixed(1)}</div><div class="label">Avg Reviews/Member</div></div>
      <div class="stat"><div class="value">${data.members.filter((m) => m.lastActive > Date.now() - 7 * 86400000).length}</div><div class="label">Active This Week</div></div>
    </div>
    <div class="card"><h2>Team Members</h2><table><thead><tr><th>Member</th><th>Role</th><th>Reviews</th><th>Issues</th><th>Pass Rate</th><th>Last Active</th></tr></thead><tbody>${memberHTML}</tbody></table></div>`);
}

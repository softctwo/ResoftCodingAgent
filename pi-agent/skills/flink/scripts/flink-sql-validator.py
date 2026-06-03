#!/usr/bin/env python3
"""Flink SQL validator — checks Flink SQL scripts for missing configurations.

Usage: python flink-sql-validator.py <file.sql>
"""

import sys
import re


def check_file(filepath: str) -> list[dict]:
    issues = []

    with open(filepath, "r") as f:
        content = f.read()
        lines = content.split("\n")

    has_watermark = False
    has_checkpoint = False
    has_state_ttl = False

    for i, line in enumerate(lines, 1):
        # Check for watermark
        if re.search(r"WATERMARK\s+FOR", line, re.IGNORECASE):
            has_watermark = True

        # Check for checkpoint config
        if re.search(r"execution\.checkpointing", line, re.IGNORECASE):
            has_checkpoint = True

        # Check for state TTL
        if re.search(r"state\.ttl", line, re.IGNORECASE):
            has_state_ttl = True

        # Check for unbounded regular join
        if re.search(r"\bJOIN\b", line, re.IGNORECASE):
            if not re.search(r"FOR\s+SYSTEM_TIME|INTERVAL", line, re.IGNORECASE):
                issues.append({
                    "line": i,
                    "severity": "warning",
                    "message": "JOIN without temporal/interval condition — may grow state unboundedly",
                    "rule": "unbounded-join",
                })

        # Check for SELECT *
        if re.search(r"\bSELECT\s+\*", line, re.IGNORECASE):
            issues.append({
                "line": i,
                "severity": "info",
                "message": "SELECT * in streaming SQL — consider listing columns",
                "rule": "select-star",
            })

    # Report missing global config
    if not has_watermark and re.search(r"TIMESTAMP|event_time", content, re.IGNORECASE):
        issues.append({
            "line": 0,
            "severity": "warning",
            "message": "Table with timestamp column has no WATERMARK defined — window operations won't work",
            "rule": "missing-watermark",
        })

    if not has_checkpoint:
        issues.append({
            "line": 0,
            "severity": "info",
            "message": "No checkpoint configuration found — ensure checkpointing is enabled for production",
            "rule": "missing-checkpoint",
        })

    if not has_state_ttl:
        issues.append({
            "line": 0,
            "severity": "info",
            "message": "No state TTL configured — state may grow unbounded in long-running jobs",
            "rule": "missing-state-ttl",
        })

    return issues


def main():
    if len(sys.argv) < 2:
        print("Usage: python flink-sql-validator.py <file.sql>")
        sys.exit(1)

    filepath = sys.argv[1]
    issues = check_file(filepath)

    if not issues:
        print(f"No issues found in {filepath}")
        return

    print(f"Found {len(issues)} issue(s) in {filepath}:\n")
    for issue in issues:
        line_loc = f"Line {issue['line']}" if issue['line'] > 0 else "Global"
        print(f"  {line_loc:10s} [{issue['severity']:7s}] {issue['message']}")


if __name__ == "__main__":
    main()

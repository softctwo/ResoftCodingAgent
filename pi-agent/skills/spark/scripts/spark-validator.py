#!/usr/bin/env python3
"""Spark code validator — checks PySpark scripts for common anti-patterns.

Usage: python spark-validator.py <file.py>
"""

import sys
import re


def check_file(filepath: str) -> list[dict]:
    issues = []

    with open(filepath, "r") as f:
        content = f.read()
        lines = content.split("\n")

    for i, line in enumerate(lines, 1):
        # SELECT * in Spark SQL string
        if re.search(r"\bSELECT\s+\*", line, re.IGNORECASE):
            issues.append({
                "line": i,
                "severity": "warning",
                "message": "SELECT * detected — enumerate columns explicitly",
                "rule": "select-star-spark",
            })

        # Cache without unpersist check (simple heuristic)
        if re.search(r"\.cache\(\)", line):
            if "unpersist" not in content:
                issues.append({
                    "line": i,
                    "severity": "info",
                    "message": ".cache() used — ensure .unpersist() is called when done",
                    "rule": "cache-reuse",
                })

        # Python UDF — suggest built-in
        if re.search(r"F\.udf\(", line) or re.search(r"@F\.udf", line):
            issues.append({
                "line": i,
                "severity": "info",
                "message": "Python UDF detected — consider using built-in functions or Pandas UDF",
                "rule": "avoid-python-udf",
            })

        # Hard-coded credentials
        if re.search(r'password\s*=\s*["\'][^$][^"\']+["\']', line, re.IGNORECASE):
            issues.append({
                "line": i,
                "severity": "error",
                "message": "Hard-coded password detected — use secrets or environment variables",
                "rule": "no-sensitive-data",
            })

    return issues


def main():
    if len(sys.argv) < 2:
        print("Usage: python spark-validator.py <file.py>")
        sys.exit(1)

    filepath = sys.argv[1]
    issues = check_file(filepath)

    if not issues:
        print(f"No issues found in {filepath}")
        return

    print(f"Found {len(issues)} issue(s) in {filepath}:\n")
    for issue in issues:
        print(f"  Line {issue['line']:4d} [{issue['severity']:7s}] {issue['message']}")


if __name__ == "__main__":
    main()

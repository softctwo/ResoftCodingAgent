#!/usr/bin/env python3
"""Basic SQL keyword uppercaser for Resoft SQL Skill.

Usage: python sql-formatter.py < input.sql > output.sql
"""

import sys
import re

SQL_KEYWORDS = {
    "select", "from", "where", "join", "left", "right", "inner", "outer",
    "cross", "on", "and", "or", "not", "in", "exists", "between", "like",
    "is", "null", "as", "group", "by", "order", "having", "union", "all",
    "distinct", "insert", "into", "values", "update", "set", "delete",
    "create", "alter", "drop", "table", "index", "view", "with",
    "case", "when", "then", "else", "end", "limit", "offset",
    "asc", "desc", "count", "sum", "avg", "min", "max", "coalesce",
    "cast", "begin", "commit", "rollback", "merge", "using", "matched",
}


def uppercase_keywords(sql: str) -> str:
    """Uppercase SQL keywords that appear as whole words."""
    pattern = re.compile(
        r'\b(' + '|'.join(re.escape(kw) for kw in sorted(SQL_KEYWORDS, key=len, reverse=True)) + r')\b',
        re.IGNORECASE,
    )
    return pattern.sub(lambda m: m.group(1).upper(), sql)


def main():
    content = sys.stdin.read()
    formatted = uppercase_keywords(content)
    sys.stdout.write(formatted)


if __name__ == "__main__":
    main()

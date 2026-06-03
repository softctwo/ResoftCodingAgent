---
name: resoft-sql
description: >
  Use this skill when writing, reviewing, or optimizing SQL queries, ETL scripts,
  database migration scripts, stored procedures, or any SQL-based data pipeline.
  Applies to PostgreSQL, Spark SQL, Flink SQL, Hive, and BigQuery dialects.
---

# Resoft SQL Skill

## Naming Conventions

- Table names: `snake_case`, plural (e.g., `customer_orders`).
- Column names: `snake_case`, descriptive (e.g., `created_at`, `order_total`).
- Use `id` as the surrogate primary key for every table.
- Foreign keys: `<referenced_table_singular>_id` (e.g., `customer_id`).
- Index names: `idx_<table>_<column>`.
- Avoid reserved SQL keywords as identifiers.

## Formatting Rules

- **Keywords**: UPPERCASE (`SELECT`, `FROM`, `WHERE`, `JOIN`, `GROUP BY`, `ORDER BY`).
- **Indentation**: 4 spaces (no tabs).
- **Leading commas**: Place commas at the start of the next line.
  ```sql
  SELECT
      customer_id
    , order_date
    , total_amount
  ```
- **Line length**: Prefer staying under 120 characters; break long expressions.
- **JOIN formatting**: Each JOIN on its own line, `ON` clause indented.
- **CTEs**: One blank line between CTEs, `AS (` on the same line as the CTE name.

## Query Structure Template

```sql
WITH cte_name AS (
    SELECT ...
    FROM source_table
    WHERE condition
)
SELECT
    col1
  , col2
  , col3
FROM cte_name
JOIN other_table AS o
  ON cte_name.id = o.foreign_id
WHERE filter_condition
GROUP BY col1, col2
HAVING aggregate_condition
ORDER BY col1
LIMIT 100;
```

## Performance Guidelines

1. **Filter early**: Apply `WHERE` clauses as high up in the CTE chain as possible.
2. **Use EXPLAIN**: Always `EXPLAIN` or `EXPLAIN ANALYZE` complex queries before deploying.
3. **Index awareness**: Write queries that leverage existing indexes; avoid functions on indexed columns in WHERE.
4. **JOIN order**: Put the most restrictive JOIN first.
5. **Avoid correlated subqueries**: Use window functions or CTEs instead.
6. **`EXISTS` over `IN`**: Use `EXISTS` for subquery membership checks with large result sets.
7. **`UNION ALL` over `UNION`**: Use `UNION ALL` unless deduplication is required.
8. **Limit columns**: Never use `SELECT *` in production queries.
9. **Limit rows**: Use `LIMIT` during development to test query logic.
10. **Batch operations**: For large INSERT/UPDATE/DELETE, batch in chunks of 10K–100K rows.

## Window Functions

```sql
-- Ranking
ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rank

-- Running total
SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total

-- Lag/Lead
LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order

-- Percentile
PERCENT_RANK() OVER (ORDER BY score) AS percentile
```

## Common ETL Patterns

### UPSERT (MERGE)
```sql
MERGE INTO target AS t
USING source AS s
  ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.col1 = s.col1, t.updated_at = NOW()
WHEN NOT MATCHED THEN INSERT (id, col1, created_at) VALUES (s.id, s.col1, NOW());
```

### SCD Type 2
```sql
-- Use dbt snapshots or manually track effective/expiration dates
INSERT INTO dim_customer_history (customer_id, name, effective_from, effective_to, is_current)
SELECT customer_id, name, CURRENT_DATE, '9999-12-31', TRUE
FROM staging_customer
WHERE ...;
```

### Deduplication
```sql
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY business_key ORDER BY updated_at DESC) AS rn
    FROM source_data
)
SELECT * FROM ranked WHERE rn = 1;
```

### Data Quality Checks
```sql
-- NULL rate
SELECT column_name, COUNT(*) AS nulls
FROM table
WHERE column_name IS NULL;

-- Duplicates
SELECT business_key, COUNT(*) AS cnt
FROM table
GROUP BY business_key
HAVING COUNT(*) > 1;
```

## Error Handling

- Use `BEGIN ... COMMIT / ROLLBACK` for transaction safety.
- Log errors with context: timestamp, affected rows, error message.
- Set `ON_ERROR = CONTINUE` (where supported) for batch jobs that can tolerate partial failures.

## Dialect Notes

| Feature | PostgreSQL | Spark SQL | Flink SQL | Hive |
|---------|-----------|-----------|-----------|------|
| MERGE   | ✅ | ✅ | ❌ | ✅ |
| QUALIFY | ❌ | ✅ | ✅ | ❌ |
| Stored Procs | ✅ | ❌ | ❌ | ❌ |
| Lateral View | ✅ LATERAL | ✅ LATERAL VIEW | ❌ | ✅ LATERAL VIEW |
| ARRAY types | ✅ | ✅ | ✅ | ✅ |

## References

- SQL Style Guide: `references/sql-style-guide.md`
- Optimization Guide: `references/optimization-guide.md`
- Common Query Patterns: `references/common-queries.md`
- Script: `scripts/sql-formatter.py` — basic SQL keyword uppercaser

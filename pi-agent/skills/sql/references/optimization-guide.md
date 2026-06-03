# SQL Query Optimization Guide

## Filter Early
Apply WHERE conditions at the earliest CTE level to reduce data volume flowing through subsequent stages.

```sql
-- ✅ Good: filter in the first CTE
WITH filtered AS (
    SELECT * FROM orders WHERE order_date >= '2024-01-01'
)
SELECT customer_id, SUM(amount) FROM filtered GROUP BY customer_id;
```

## JOIN Optimization

1. **Join order**: Put the most restrictive table first.
2. **Join type**: Use INNER JOIN when possible; OUTER JOINs prevent some optimizations.
3. **Broadcast small tables**: In distributed engines (Spark, Trino), broadcast tables < 10MB.
4. **Avoid cross JOINs**: Always provide an ON clause.

## Aggregation

- Aggregate at the most granular CTE level possible.
- Pre-filter before GROUP BY.
- Consider using window functions instead of self-joins for running totals / rankings.

## Window Functions

- Use `ROW_NUMBER()` for Top-N and deduplication.
- Use `LAG()`/`LEAD()` instead of self-joins for sequential access.
- Always use `PARTITION BY` to control the scope.

## Common Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---|---|---|
| `SELECT *` | Returns unnecessary columns, breaks on schema changes | Explicit column list |
| `OR` in JOIN | Prevents index usage | Use UNION ALL |
| `GROUP BY 1,2,3` | Ordinals are fragile | Use column names |
| `NOT IN` with NULLs | Returns nothing if subquery has NULL | Use `NOT EXISTS` or `LEFT JOIN ... IS NULL` |
| Implicit type conversion | Slows down queries, breaks indexes | Use explicit CAST |
| `DISTINCT` everywhere | Hides duplicates / broken JOINs | Fix JOIN logic, use GROUP BY |
| Nested subqueries > 2 levels | Unreadable, hard to optimize | Use CTEs |
| Functions on indexed columns in WHERE | Prevents index usage | Move function to the value side |

## EXPLAIN Usage
Always run EXPLAIN on queries touching > 100K rows before deploying:
```sql
EXPLAIN ANALYZE
SELECT ...
```

Check for:
- Sequential scans on large tables → add indexes
- Nested loops on large datasets → hash joins
- High memory usage → reduce intermediate results
- Skewed partitions → repartition

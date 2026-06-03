# SQL Style Guide

## Keywords
- All SQL keywords MUST be UPPERCASE: `SELECT`, `FROM`, `WHERE`, `JOIN`, `GROUP BY`, `ORDER BY`, `HAVING`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `MERGE`, `WITH`, `AS`, `ON`, `AND`, `OR`, `IN`, `EXISTS`, `BETWEEN`, `LIKE`, `IS`, `NULL`, `NOT`, `CASE`, `WHEN`, `THEN`, `ELSE`, `END`, `UNION`, `ALL`, `DISTINCT`, `LEFT`, `RIGHT`, `INNER`, `OUTER`, `CROSS`, `LATERAL`.

## Indentation
- Use 4 spaces per indent level. Never use tabs.
- Each major clause starts on its own line.

## Leading Comma
- Place commas at the beginning of lines for cleaner diffs.
```sql
SELECT
    col1
  , col2
  , col3
FROM table
```

## Aliasing
- Always alias tables in multi-table queries.
- Use short, meaningful aliases (3-8 characters).
- Column aliases use `AS` keyword.
- Table aliases omit `AS`.

## JOIN Rules
- Always use explicit JOIN syntax (ANSI-92).
- Never use comma-style joins.
- INNER JOIN is the default; write `JOIN` instead of `INNER JOIN`.
- Always specify LEFT/RIGHT for outer joins.
- Put each JOIN on its own line.

## NULL Handling
- Use `IS NULL` / `IS NOT NULL`, never `= NULL`.
- Use `COALESCE()` for default values.
- Use `NULLIF()` to avoid division-by-zero.

## CTE Preference
- Prefer CTEs (`WITH` clauses) over subqueries for readability.
- Name CTEs descriptively.
- One blank line between CTEs.

## Performance
- Filter early with WHERE.
- Avoid functions on indexed columns in WHERE clauses.
- Use EXISTS instead of IN for large subquery results.
- Use UNION ALL instead of UNION unless dedup is needed.

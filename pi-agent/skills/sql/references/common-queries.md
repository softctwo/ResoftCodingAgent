# Common SQL Query Patterns

## 1. Pivot (Rows to Columns)
```sql
SELECT
    category,
    SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) AS jan,
    SUM(CASE WHEN month = 'Feb' THEN amount ELSE 0 END) AS feb,
    SUM(CASE WHEN month = 'Mar' THEN amount ELSE 0 END) AS mar
FROM sales
GROUP BY category;
```

## 2. Unpivot (Columns to Rows)
```sql
SELECT category, 'Jan' AS month, jan AS amount FROM pivoted
UNION ALL
SELECT category, 'Feb' AS month, feb AS amount FROM pivoted
UNION ALL
SELECT category, 'Mar' AS month, mar AS amount FROM pivoted;
```

## 3. Recursive CTE (Tree / Hierarchy)
```sql
WITH RECURSIVE org_tree AS (
    SELECT id, name, manager_id, 0 AS level
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, ot.level + 1
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT * FROM org_tree ORDER BY level;
```

## 4. Running Total
```sql
SELECT
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```

## 5. Top-N per Group
```sql
WITH ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) AS rn
    FROM sales
)
SELECT * FROM ranked WHERE rn <= 3;
```

## 6. Period-over-Period Comparison
```sql
WITH current_period AS (
    SELECT category, SUM(amount) AS current_amount
    FROM sales WHERE order_date BETWEEN '2024-06-01' AND '2024-06-30'
    GROUP BY category
),
previous_period AS (
    SELECT category, SUM(amount) AS previous_amount
    FROM sales WHERE order_date BETWEEN '2024-05-01' AND '2024-05-31'
    GROUP BY category
)
SELECT
    COALESCE(c.category, p.category) AS category,
    c.current_amount,
    p.previous_amount,
    (c.current_amount - p.previous_amount) / NULLIF(p.previous_amount, 0) * 100 AS pct_change
FROM current_period c
FULL OUTER JOIN previous_period p ON c.category = p.category;
```

## 7. Gaps and Islands
```sql
WITH numbered AS (
    SELECT *,
        ROW_NUMBER() OVER (ORDER BY date) -
        ROW_NUMBER() OVER (PARTITION BY status ORDER BY date) AS grp
    FROM events
)
SELECT
    status,
    MIN(date) AS start_date,
    MAX(date) AS end_date,
    COUNT(*) AS consecutive_days
FROM numbered
GROUP BY status, grp
ORDER BY start_date;
```

## 8. Funnel Analysis
```sql
SELECT
    COUNT(DISTINCT CASE WHEN event = 'page_view' THEN user_id END) AS step1_view,
    COUNT(DISTINCT CASE WHEN event = 'add_to_cart' THEN user_id END) AS step2_cart,
    COUNT(DISTINCT CASE WHEN event = 'checkout' THEN user_id END) AS step3_checkout,
    COUNT(DISTINCT CASE WHEN event = 'purchase' THEN user_id END) AS step4_purchase
FROM events
WHERE event_date = CURRENT_DATE;
```

---
name: resoft-dbt
description: >
  Use this skill for dbt (data build tool) projects, data modeling with SQL and
  Jinja, analytics engineering workflows, data transformation pipelines, and
  data warehouse development with the modern data stack.
---

# Resoft dbt Skill

## Project Layering

```
models/
├── staging/           # 1:1 with source tables, light transformation
│   └── stg_customers.sql
├── intermediate/      # Business logic, reusable building blocks
│   └── int_order_items.sql
└── marts/             # Final dimensional/fact models for consumption
    ├── dim_customers.sql
    └── fct_orders.sql
```

**Rule**: Sources only referenced from staging models. Marts only reference intermediate and staging models. No cross-mart dependencies without an intermediate layer.

## Model Configuration

```yaml
# models/marts/schema.yml
version: 2

models:
  - name: fct_orders
    description: "Fact table for all orders"
    config:
      materialized: incremental
      unique_key: order_id
      partition_by: order_date
    columns:
      - name: order_id
        description: "Primary key"
        tests:
          - unique
          - not_null
      - name: customer_id
        description: "FK to dim_customers"
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id
```

## Materialization Strategies

| Strategy | When to Use |
|----------|-------------|
| `view` | Lightweight transforms, no persistence needed |
| `table` | Full refresh, manageable size, or downstream models depend on freshness |
| `incremental` | Large tables that only need recent rows appended/updated |
| `ephemeral` | Single-use transforms (like CTEs across models) |
| `snapshot` | Slowly Changing Dimension (SCD) Type 2 tracking |
| `materialized_view` | Database-native materialized views (where supported) |

## Incremental Model Pattern

```sql
{{
  config(
    materialized = 'incremental',
    unique_key = 'order_id',
    partition_by = 'order_date',
    on_schema_change = 'append_new_columns'
  )
}}

WITH new_orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
    {% if is_incremental() %}
    WHERE order_date > (SELECT MAX(order_date) FROM {{ this }})
    {% endif %}
)
SELECT * FROM new_orders
```

## Jinja Patterns

### ref() and source()
```sql
SELECT * FROM {{ ref('stg_customers') }}
SELECT * FROM {{ source('crm', 'raw_customers') }}
```

### Conditionals
```sql
{% if target.name == 'prod' %}
  SELECT * FROM prod_schema.table
{% else %}
  SELECT * FROM dev_schema.table
{% endif %}
```

### Loops
```sql
{% for currency in ['USD', 'EUR', 'GBP'] %}
SELECT '{{ currency }}' AS currency,
       SUM(amount * rate_{{ currency }}) AS total
FROM {{ ref('fct_orders') }}
{% if not loop.last %} UNION ALL {% endif %}
{% endfor %}
```

### Macros
```sql
{% macro cents_to_dollars(column_name, precision=2) %}
    ({{ column_name }} / 100)::numeric(16, {{ precision }})
{% endmacro %}

SELECT {{ cents_to_dollars('amount_cents') }} AS amount_dollars
```

### Variables
```sql
-- dbt_project.yml
vars:
  fiscal_year_start: '2024-01-01'

-- SQL
SELECT * FROM table WHERE date >= '{{ var("fiscal_year_start") }}'
```

### config()
```sql
{{ config(materialized='table', tags=['finance', 'daily']) }}
```

## Testing

### Generic Tests (schema.yml)
```yaml
columns:
  - name: email
    tests:
      - unique
      - not_null
      - accepted_values:
          values: ['active', 'inactive', 'suspended']
```

### Singular Tests (SQL files in tests/)
```sql
-- tests/assert_positive_amounts.sql
SELECT order_id, amount
FROM {{ ref('fct_orders') }}
WHERE amount < 0
```

### Custom Generic Tests
```sql
-- tests/generic/test_positive.sql
{% test positive(model, column_name) %}
SELECT * FROM {{ model }} WHERE {{ column_name }} < 0
{% endtest %}
```

## Snapshots (SCD Type 2)

```sql
{% snapshot orders_snapshot %}
{{
    config(
      target_schema='snapshots',
      unique_key='order_id',
      strategy='timestamp',
      updated_at='updated_at',
    )
}}
SELECT * FROM {{ source('crm', 'orders') }}
{% endsnapshot %}
```

## Hooks

```yaml
# dbt_project.yml
on-run-start:
  - "GRANT USAGE ON SCHEMA {{ target.schema }} TO ROLE analyst"
on-run-end:
  - "SELECT dbt_audit.log_run()"
```

## References

- dbt Model Guide: `references/dbt-model-guide.md`
- Jinja Patterns: `references/jinja-patterns.md`
- Testing Guide: `references/testing-guide.md`
- Script: `scripts/dbt-template-gen.py` — generates model boilerplate

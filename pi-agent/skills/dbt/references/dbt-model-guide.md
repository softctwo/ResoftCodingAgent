# dbt Model Guide

## Project Layering

```
models/
├── staging/       stg_*.sql     — 1:1 with source tables
├── intermediate/  int_*.sql     — business transformations
└── marts/         dim_*/fct_*   — consumable dimensional models
```

### Staging Layer
- One model per source table.
- Light transformations: rename columns, cast types, deduplicate.
- Only reference `{{ source() }}`.

### Intermediate Layer
- Business-specific transformations.
- Can reference staging and other intermediate models.
- Named with `int_` prefix.

### Marts Layer
- Fact and dimension tables for end users.
- `fct_` = fact tables (measures, foreign keys).
- `dim_` = dimension tables (descriptive attributes).
- Only reference intermediate and staging models.

## Model Configuration

```yaml
# dbt_project.yml
models:
  my_project:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: ephemeral
      +schema: intermediate
    marts:
      +materialized: table
      +schema: marts
```

## Materialization Strategies

### View
```sql
{{ config(materialized='view') }}
SELECT ...
```
- No storage cost, always fresh.
- Best for: staging models, lightweight transforms.

### Table
```sql
{{ config(materialized='table') }}
SELECT ...
```
- Full refresh on every run.
- Best for: small-medium marts, reference data.

### Incremental
```sql
{{ config(
    materialized='incremental',
    unique_key='order_id',
    on_schema_change='sync_all_columns'
) }}
SELECT * FROM source
{% if is_incremental() %}
WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
```
- Only process new/changed rows.
- Best for: large fact tables, event data.

### Ephemeral
```sql
{{ config(materialized='ephemeral') }}
SELECT ...
```
- Inlined as CTE in downstream models.
- Best for: lightweight transforms used once.

### Snapshot
```yaml
# snapshots/orders_snapshot.sql
{% snapshot orders_snapshot %}
{{ config(
    target_schema='snapshots',
    unique_key='order_id',
    strategy='check',
    check_cols=['status', 'amount']
) }}
SELECT * FROM {{ source('crm', 'orders') }}
{% endsnapshot %}
```
- Tracks changes over time (SCD Type 2).
- Best for: slowly changing dimensions.

## Incremental Models Best Practices

1. Use `is_incremental()` to conditionally add WHERE clauses.
2. Set `unique_key` for upsert/merge behavior.
3. Handle late-arriving data with a lookback window (e.g., `WHERE updated_at > max_updated_at - INTERVAL '3 DAYS'`).
4. Use `on_schema_change` to handle column additions gracefully.

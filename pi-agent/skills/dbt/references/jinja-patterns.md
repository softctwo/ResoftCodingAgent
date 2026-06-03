# dbt Jinja Patterns

## ref() and source()
```sql
-- Reference another model
SELECT * FROM {{ ref('stg_orders') }}

-- Reference a source table
SELECT * FROM {{ source('crm', 'raw_customers') }}

-- Reference with version (dbt 1.6+)
SELECT * FROM {{ ref('stg_orders', v=2) }}
```

## Conditionals
```sql
{% if target.name == 'prod' %}
    SELECT * FROM prod_database.schema.orders
{% elif target.name == 'staging' %}
    SELECT * FROM staging_database.schema.orders
{% else %}
    SELECT * FROM dev_database.schema.orders
{% endif %}
```

## Loops
```sql
{% set payment_methods = ['credit_card', 'bank_transfer', 'paypal'] %}

SELECT
    order_id
    {% for method in payment_methods %}
    , SUM(CASE WHEN payment_method = '{{ method }}' THEN amount ELSE 0 END)
        AS {{ method }}_amount
    {% endfor %}
FROM {{ ref('payments') }}
GROUP BY order_id
```

## Macros
```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    ROUND(({{ column_name }} / 100)::NUMERIC, {{ precision }})
{% endmacro %}

-- Usage
SELECT {{ cents_to_dollars('amount_cents') }} AS amount_dollars
```

### Macro with Logic
```sql
{% macro generate_schema_name(custom_schema_name, node) %}
    {% if target.name == 'prod' %}
        {{ custom_schema_name | trim }}
    {% else %}
        {{ target.schema }}_{{ custom_schema_name | trim }}
    {% endif %}
{% endmacro %}
```

## Variables
```sql
-- dbt_project.yml
vars:
  start_date: '2024-01-01'
  excluded_categories: ['test', 'internal']

-- SQL usage
SELECT * FROM orders
WHERE order_date >= '{{ var("start_date") }}'
  AND category NOT IN ('{{ var("excluded_categories") | join("', '") }}')
```

## config()
```sql
{{ config(
    materialized = 'incremental',
    unique_key = 'id',
    partition_by = 'dt',
    tags = ['daily', 'finance'],
    post_hook = "GRANT SELECT ON {{ this }} TO ROLE analyst"
) }}
```

## set and log
```sql
{% set row_count = run_query("SELECT COUNT(*) FROM " ~ ref('stg_orders')) %}
{% do log("stg_orders has " ~ row_count.columns[0].values()[0] ~ " rows", info=True) %}
```

## Whitespace Control
```sql
-- Use {%- to strip leading whitespace, -%} to strip trailing
SELECT
    {%- for col in columns %}
    {{ col }}{% if not loop.last %},{% endif %}
    {%- endfor %}
FROM table
```

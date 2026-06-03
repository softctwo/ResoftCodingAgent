# dbt Testing Guide

## Generic Tests (schema.yml)

```yaml
version: 2

models:
  - name: fct_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id
      - name: status
        tests:
          - accepted_values:
              values: ['pending', 'shipped', 'delivered', 'cancelled']
              quote: true
      - name: amount
        tests:
          - not_null
          - dbt_utils.at_least_one
      - name: order_date
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= '2020-01-01'"
```

## Singular Tests (Custom SQL)

```sql
-- tests/assert_order_amount_positive.sql
SELECT order_id, amount
FROM {{ ref('fct_orders') }}
WHERE amount <= 0
```
If this query returns any rows, the test fails.

## Relationship Tests
```yaml
# Two-column FK relationship
- relationships:
    to: ref('dim_products')
    field: product_id

# Composite key relationship
- relationships:
    to: ref('dim_customers')
    field: customer_id
    from_condition: |
      dim_customers.is_active = true
```

## Custom Generic Tests
```sql
-- tests/generic/test_not_negative.sql
{% test not_negative(model, column_name) %}
SELECT *
FROM {{ model }}
WHERE {{ column_name }} < 0
{% endtest %}

-- Usage in schema.yml
columns:
  - name: amount
    tests:
      - not_negative
```

```sql
-- tests/generic/test_unique_combination.sql
{% test unique_combination(model, combination) %}
SELECT {{ combination }}
FROM {{ model }}
GROUP BY {{ combination }}
HAVING COUNT(*) > 1
{% endtest %}

-- Usage
columns:
  - name: order_id
    tests:
      - unique_combination:
          combination: 'order_id, customer_id'
```

## Test Severity
```yaml
# Warn instead of error
columns:
  - name: discount
    tests:
      - not_null:
          severity: warn
```

## Configuring Test Behavior
```yaml
# dbt_project.yml
tests:
  +store_failures: true    # Persist failures as tables for analysis
  +severity: error         # Default severity
  +limit: 1000             # Limit number of failures stored
```

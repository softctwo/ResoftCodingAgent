#!/usr/bin/env python3
"""dbt template generator — scaffold dbt model files.

Usage: python dbt-template-gen.py <model_type> <model_name>
  model_type: staging, intermediate, dim, fct, snapshot
  model_name: snake_case name, e.g., stg_orders
"""

import sys
from datetime import datetime


TEMPLATES = {
    "staging": """-- Staging model: {{ model_name }}
-- Source: TODO: update source reference
{{
    config(
        materialized = 'view',
        tags = ['staging']
    )
}}

SELECT
    -- TODO: list columns explicitly
    *
FROM {{ source('TODO_source_name', 'TODO_table_name') }}
""",

    "intermediate": """-- Intermediate model: {{ model_name }}
{{
    config(
        materialized = 'ephemeral',
        tags = ['intermediate']
    )
}}

WITH base AS (
    SELECT * FROM {{ ref('TODO_staging_model') }}
)
SELECT
    -- TODO: business transformations
    *
FROM base
""",

    "dim": """-- Dimension model: {{ model_name }}
{{
    config(
        materialized = 'table',
        tags = ['dimension', 'marts']
    )
}}

SELECT
    -- Surrogate key
    ROW_NUMBER() OVER (ORDER BY TODO_natural_key) AS {{ model_name }}_id,

    -- Natural key
    TODO_natural_key,

    -- Attributes
    -- TODO: add dimension columns

    -- Metadata
    CURRENT_TIMESTAMP AS dbt_created_at,
    CURRENT_TIMESTAMP AS dbt_updated_at
FROM {{ ref('TODO_staging_model') }}
""",

    "fct": """-- Fact model: {{ model_name }}
{{
    config(
        materialized = 'incremental',
        unique_key = 'TODO_pk_column',
        partition_by = 'TODO_date_column',
        tags = ['fact', 'marts']
    )
}}

SELECT
    -- Primary key
    TODO_pk_column,

    -- Foreign keys
    TODO_dim_fk_column,

    -- Measures
    -- TODO: add measures (amount, quantity, etc.)

    -- Date dimensions
    TODO_date_column,

    -- Metadata
    CURRENT_TIMESTAMP AS dbt_created_at,
    CURRENT_TIMESTAMP AS dbt_updated_at
FROM {{ ref('TODO_staging_model') }}

{% if is_incremental() %}
WHERE TODO_date_column > (SELECT MAX(TODO_date_column) FROM {{ this }})
{% endif %}
""",

    "snapshot": """-- Snapshot: {{ model_name }}
{% snapshot {{ model_name }} %}

{{
    config(
        target_schema = 'snapshots',
        unique_key = 'TODO_pk_column',
        strategy = 'timestamp',
        updated_at = 'updated_at'
    )
}}

SELECT * FROM {{ source('TODO_source_name', 'TODO_table_name') }}

{% endsnapshot %}
""",
}


def main():
    if len(sys.argv) < 3:
        print("Usage: python dbt-template-gen.py <model_type> <model_name>")
        print(f"  model_type: {', '.join(TEMPLATES.keys())}")
        print("  model_name: snake_case (e.g., stg_orders)")
        sys.exit(1)

    model_type = sys.argv[1].lower()
    model_name = sys.argv[2]

    if model_type not in TEMPLATES:
        print(f"Invalid model_type: {model_type}. Use: {', '.join(TEMPLATES.keys())}")
        sys.exit(1)

    template = TEMPLATES[model_type].replace("{{ model_name }}", model_name)
    print(template.strip())


if __name__ == "__main__":
    main()

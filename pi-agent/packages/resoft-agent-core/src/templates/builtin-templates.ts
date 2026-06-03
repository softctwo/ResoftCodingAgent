import type { CodeTemplate } from "./template-engine.ts";

export const BUILTIN_TEMPLATES: CodeTemplate[] = [
  // ============ SPARK TEMPLATES ============
  {
    id: "spark-read-jdbc",
    name: "Spark JDBC Read",
    description: "Read data from a JDBC source into a Spark DataFrame",
    platform: "spark",
    category: "ingestion",
    language: "python",
    variables: [
      { name: "SOURCE_TABLE", description: "Source table name", required: true, type: "string" },
      { name: "JDBC_URL", description: "JDBC connection URL", required: true, type: "string" },
      { name: "OUTPUT_VIEW", description: "Temp view name", defaultValue: "source_data", required: false, type: "string" },
    ],
    template: `from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("JdbcIngestion").getOrCreate()

df = spark.read \\
    .format("jdbc") \\
    .option("url", "\${JDBC_URL}") \\
    .option("dbtable", "\${SOURCE_TABLE}") \\
    .option("driver", "com.mysql.cj.jdbc.Driver") \\
    .load()

df.createOrReplaceTempView("\${OUTPUT_VIEW}")
print(f"Loaded {df.count()} rows from \${SOURCE_TABLE}")`,
    tags: ["jdbc", "read", "database"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "spark-kafka-stream",
    name: "Spark Kafka Streaming",
    description: "Stream data from Kafka using Spark Structured Streaming",
    platform: "spark",
    category: "ingestion",
    language: "python",
    variables: [
      { name: "KAFKA_BOOTSTRAP", description: "Kafka bootstrap servers", required: true, type: "string" },
      { name: "TOPIC", description: "Kafka topic", required: true, type: "string" },
      { name: "CHECKPOINT", description: "Checkpoint location", required: true, type: "string" },
      { name: "OUTPUT_PATH", description: "Output path", required: true, type: "string" },
    ],
    template: `from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, TimestampType

spark = SparkSession.builder \\
    .appName("KafkaStreaming") \\
    .config("spark.sql.streaming.checkpointLocation", "\${CHECKPOINT}") \\
    .getOrCreate()

df = spark.readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "\${KAFKA_BOOTSTRAP}") \\
    .option("subscribe", "\${TOPIC}") \\
    .option("startingOffsets", "latest") \\
    .load()

query = df.selectExpr("CAST(value AS STRING)") \\
    .writeStream \\
    .format("parquet") \\
    .option("path", "\${OUTPUT_PATH}") \\
    .start()

query.awaitTermination()`,
    tags: ["kafka", "streaming", "ingestion"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "spark-transform-sql",
    name: "Spark SQL Transformation",
    description: "Transform data using Spark SQL with CTEs",
    platform: "spark",
    category: "transformation",
    language: "python",
    variables: [
      { name: "SOURCE_VIEW", description: "Source view/table name", required: true, type: "string" },
      { name: "TARGET_VIEW", description: "Target view name", required: true, type: "string" },
      { name: "TRANSFORM_SQL", description: "SQL transformation query", required: true, type: "string" },
    ],
    template: `from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("SqlTransform").getOrCreate()

# Execute transformation
df = spark.sql(\"\"\"
\${TRANSFORM_SQL}
\"\"\".strip())

df.createOrReplaceTempView("\${TARGET_VIEW}")
print(f"Transformed {df.count()} rows -> \${TARGET_VIEW}")`,
    tags: ["sql", "transformation", "cte"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "spark-data-quality",
    name: "Spark Data Quality Check",
    description: "Run data quality checks on a DataFrame",
    platform: "spark",
    category: "quality",
    language: "python",
    variables: [
      { name: "TABLE_NAME", description: "Table to check", required: true, type: "string" },
      { name: "NULL_THRESHOLD", description: "Max allowed NULL percentage", defaultValue: "0.05", required: false, type: "string" },
    ],
    template: `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, when

spark = SparkSession.builder.appName("DataQuality").getOrCreate()

df = spark.table("\${TABLE_NAME}")
total = df.count()

print(f"=== Data Quality Report: \${TABLE_NAME} ===")
print(f"Total rows: {total}")

for column in df.columns:
    null_count = df.filter(col(column).isNull()).count()
    null_pct = null_count / total if total > 0 else 0
    status = "PASS" if null_pct <= \${NULL_THRESHOLD} else "FAIL"
    print(f"  {column}: {null_count} NULLs ({null_pct:.2%}) [{status}]")

print("=== End Report ===")`,
    tags: ["quality", "validation", "null-check"],
    author: "resoft",
    version: "1.0.0",
  },

  // ============ FLINK TEMPLATES ============
  {
    id: "flink-kafka-source",
    name: "Flink Kafka Source",
    description: "Create a Flink Kafka source connector",
    platform: "flink",
    category: "ingestion",
    language: "java",
    variables: [
      { name: "TOPIC", description: "Kafka topic", required: true, type: "string" },
      { name: "BOOTSTRAP", description: "Kafka bootstrap servers", required: true, type: "string" },
      { name: "GROUP_ID", description: "Consumer group ID", required: true, type: "string" },
    ],
    template: `import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

KafkaSource<String> source = KafkaSource.<String>builder()
    .setBootstrapServers("\${BOOTSTRAP}")
    .setTopics("\${TOPIC}")
    .setGroupId("\${GROUP_ID}")
    .setStartingOffsets(OffsetsInitializer.latest())
    .setValueOnlyDeserializer(new SimpleStringSchema())
    .build();

env.fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source")
   .print();

env.execute("Flink Kafka Ingestion");`,
    tags: ["kafka", "source", "streaming"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "flink-window-aggregation",
    name: "Flink Window Aggregation",
    description: "Tumbling window aggregation in Flink",
    platform: "flink",
    category: "transformation",
    language: "java",
    variables: [
      { name: "WINDOW_SIZE", description: "Window size in seconds", defaultValue: "60", required: false, type: "string" },
      { name: "SINK_TABLE", description: "Output sink table", defaultValue: "aggregated_metrics", required: false, type: "string" },
    ],
    template: `import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

env.addSource(new YourDataSource())
   .keyBy(event -> event.getKey())
   .window(TumblingProcessingTimeWindows.of(Time.seconds(\${WINDOW_SIZE})))
   .aggregate(new YourAggregateFunction())
   .addSink(new YourSink("\${SINK_TABLE}"));

env.execute("Window Aggregation Job");`,
    tags: ["window", "aggregation", "tumbling"],
    author: "resoft",
    version: "1.0.0",
  },

  // ============ DBT TEMPLATES ============
  {
    id: "dbt-staging-model",
    name: "dbt Staging Model",
    description: "Basic dbt staging model with source reference",
    platform: "dbt",
    category: "transformation",
    language: "sql",
    variables: [
      { name: "SOURCE_NAME", description: "Source name from sources.yml", required: true, type: "string" },
      { name: "TABLE_NAME", description: "Source table name", required: true, type: "string" },
    ],
    template: `-- Staging model for \${SOURCE_NAME}.\${TABLE_NAME}
{{ config(materialized='view') }}

WITH source AS (
    SELECT * FROM {{ source('\${SOURCE_NAME}', '\${TABLE_NAME}') }}
),

renamed AS (
    SELECT
        -- TODO: Add column selection and renaming
        *
    FROM source
)

SELECT * FROM renamed`,
    tags: ["staging", "source", "dbt-model"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "dbt-incremental-model",
    name: "dbt Incremental Model",
    description: "dbt incremental model with merge strategy",
    platform: "dbt",
    category: "transformation",
    language: "sql",
    variables: [
      { name: "MODEL_NAME", description: "Model name", required: true, type: "string" },
      { name: "UNIQUE_KEY", description: "Unique key for merge", required: true, type: "string" },
    ],
    template: `-- Incremental model: \${MODEL_NAME}
{{ config(
    materialized='incremental',
    unique_key='\${UNIQUE_KEY}',
    merge_update_columns=['updated_at']
) }}

WITH new_data AS (
    SELECT * FROM {{ ref('stg_\${MODEL_NAME}') }}
    {% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
    {% endif %}
)

SELECT * FROM new_data`,
    tags: ["incremental", "merge", "dbt-model"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "dbt-snapshot",
    name: "dbt Snapshot",
    description: "dbt snapshot for slowly changing dimensions",
    platform: "dbt",
    category: "quality",
    language: "sql",
    variables: [
      { name: "SOURCE_MODEL", description: "Source model to snapshot", required: true, type: "string" },
      { name: "UNIQUE_KEY", description: "Unique key", required: true, type: "string" },
      { name: "UPDATED_AT", description: "Updated at column", defaultValue: "updated_at", required: false, type: "string" },
    ],
    template: `{% snapshot \${SOURCE_MODEL}_snapshot %}

{{
    config(
      target_database='analytics',
      target_schema='snapshots',
      unique_key='\${UNIQUE_KEY}',
      strategy='timestamp',
      updated_at='\${UPDATED_AT}',
    )
}}

SELECT * FROM {{ ref('\${SOURCE_MODEL}') }}

{% endsnapshot %}`,
    tags: ["snapshot", "scd", "history"],
    author: "resoft",
    version: "1.0.0",
  },

  // ============ SQL TEMPLATES ============
  {
    id: "sql-merge-upsert",
    name: "SQL MERGE/Upsert",
    description: "Generic MERGE statement for upsert operations",
    platform: "sql",
    category: "transformation",
    language: "sql",
    variables: [
      { name: "TARGET", description: "Target table", required: true, type: "string" },
      { name: "SOURCE", description: "Source table", required: true, type: "string" },
      { name: "JOIN_KEY", description: "Join key column", required: true, type: "string" },
      { name: "COLUMNS", description: "Comma-separated column list", required: true, type: "string" },
    ],
    template: `MERGE INTO \${TARGET} AS target
USING \${SOURCE} AS source
ON target.\${JOIN_KEY} = source.\${JOIN_KEY}
WHEN MATCHED THEN
    UPDATE SET
        -- Dynamic column update happens at render time
        target.updated_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (\${JOIN_KEY}, \${COLUMNS}, created_at, updated_at)
    VALUES (source.\${JOIN_KEY}, source.\${COLUMNS}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
    tags: ["merge", "upsert", "sync"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "sql-cte-chain",
    name: "SQL CTE Chain",
    description: "Multi-step CTE transformation chain",
    platform: "sql",
    category: "transformation",
    language: "sql",
    variables: [
      { name: "SOURCE_TABLE", description: "Source table", required: true, type: "string" },
      { name: "DATE_COL", description: "Date partition column", defaultValue: "dt", required: false, type: "string" },
    ],
    template: `WITH
-- Step 1: Filter relevant partition
filtered AS (
    SELECT * FROM \${SOURCE_TABLE}
    WHERE \${DATE_COL} = '{{ ds }}'
),

-- Step 2: Deduplicate
deduped AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) AS rn
    FROM filtered
),

-- Step 3: Clean
cleaned AS (
    SELECT
        id,
        TRIM(name) AS name,
        COALESCE(email, 'unknown@example.com') AS email,
        updated_at
    FROM deduped
    WHERE rn = 1
)

-- Final output
SELECT * FROM cleaned`,
    tags: ["cte", "chain", "dedup"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "sql-data-validation",
    name: "SQL Data Validation",
    description: "Data validation and profiling queries",
    platform: "sql",
    category: "quality",
    language: "sql",
    variables: [
      { name: "TABLE", description: "Table to validate", required: true, type: "string" },
    ],
    template: `-- Data Validation Report for \${TABLE}
-- Row count
SELECT 'row_count' AS metric, COUNT(*) AS value FROM \${TABLE}
UNION ALL
-- Distinct count
SELECT 'distinct_count', COUNT(*) FROM (SELECT DISTINCT * FROM \${TABLE}) t
UNION ALL
-- Min/Max dates if date column exists
SELECT 'date_range', MIN(created_at)::text || ' to ' || MAX(created_at)::text
FROM \${TABLE}
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = '\${TABLE}' AND column_name = 'created_at'
);`,
    tags: ["validation", "profiling", "quality"],
    author: "resoft",
    version: "1.0.0",
  },

  // ============ UTILITY TEMPLATES ============
  {
    id: "python-airflow-dag",
    name: "Airflow DAG Template",
    description: "Basic Airflow DAG for ETL orchestration",
    platform: "custom",
    category: "orchestration",
    language: "python",
    variables: [
      { name: "DAG_ID", description: "DAG identifier", required: true, type: "string" },
      { name: "SCHEDULE", description: "Cron schedule", defaultValue: "@daily", required: false, type: "string" },
      { name: "OWNER", description: "DAG owner", defaultValue: "data-team", required: false, type: "string" },
    ],
    template: `from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.dummy import DummyOperator
from datetime import datetime, timedelta

default_args = {
    'owner': '\${OWNER}',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='\${DAG_ID}',
    default_args=default_args,
    schedule_interval='\${SCHEDULE}',
    catchup=False,
    tags=['etl', '\${OWNER}'],
) as dag:

    start = DummyOperator(task_id='start')
    end = DummyOperator(task_id='end')

    # TODO: Add your ETL tasks here

    start >> end`,
    tags: ["airflow", "orchestration", "dag"],
    author: "resoft",
    version: "1.0.0",
  },
  {
    id: "python-logging-config",
    name: "Python ETL Logging",
    description: "Standardized logging configuration for ETL scripts",
    platform: "custom",
    category: "utility",
    language: "python",
    variables: [
      { name: "JOB_NAME", description: "Job name for logging", required: true, type: "string" },
      { name: "LOG_LEVEL", description: "Log level", defaultValue: "INFO", required: false, type: "select", options: ["DEBUG", "INFO", "WARNING", "ERROR"] },
    ],
    template: `import logging
import sys
from datetime import datetime

def setup_logging(job_name: str = "\${JOB_NAME}"):
    """Configure standardized ETL logging."""
    logger = logging.getLogger(job_name)
    logger.setLevel(logging.\${LOG_LEVEL})

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.\${LOG_LEVEL})
    console.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))

    # File handler
    file_handler = logging.FileHandler(
        f'logs/{job_name}_{datetime.now().strftime("%Y%m%d")}.log'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s'
    ))

    logger.addHandler(console)
    logger.addHandler(file_handler)
    return logger

logger = setup_logging()

def log_metrics(metrics: dict):
    """Log structured metrics for monitoring."""
    logger.info(f"METRICS: {metrics}")

logger.info("\${JOB_NAME} started")`,
    tags: ["logging", "monitoring", "utility"],
    author: "resoft",
    version: "1.0.0",
  },
];

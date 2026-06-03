---
name: resoft-flink
description: >
  Use this skill for Flink SQL streaming ETL pipelines, real-time data processing,
  CDC (Change Data Capture) ingestion, event-driven applications, and stream-table
  duality patterns on Apache Flink.
---

# Resoft Flink Skill

## DDL Patterns

### Kafka Source
```sql
CREATE TABLE kafka_source (
    event_id    STRING,
    event_type  STRING,
    payload     STRING,
    event_time  TIMESTAMP(3),
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'events-topic',
    'properties.bootstrap.servers' = 'broker:9092',
    'properties.group.id' = 'flink-consumer',
    'format' = 'json',
    'scan.startup.mode' = 'latest-offset'
);
```

### Upsert Kafka Sink
```sql
CREATE TABLE kafka_sink (
    user_id     STRING,
    balance     DECIMAL(15,2),
    updated_at  TIMESTAMP(3),
    PRIMARY KEY (user_id) NOT ENFORCED
) WITH (
    'connector' = 'upsert-kafka',
    'topic' = 'user-balance',
    'properties.bootstrap.servers' = 'broker:9092',
    'key.format' = 'json',
    'value.format' = 'json'
);
```

### JDBC Sink (Upsert)
```sql
CREATE TABLE jdbc_sink (
    id          BIGINT,
    name        STRING,
    updated_at  TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://host:5432/db',
    'table-name' = 'users',
    'username' = 'user',
    'password' = 'pass',
    'sink.buffer-flush.max-rows' = '5000',
    'sink.buffer-flush.interval' = '2s'
);
```

## Watermark Strategies

```sql
-- Strict ascending timestamps
WATERMARK FOR event_time AS event_time

-- Bounded out-of-orderness (5 seconds)
WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND

-- In production, measure max delay and add 20% margin
WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND
```

## Window Types

| Window | Syntax | Use Case |
|--------|--------|----------|
| Tumble | `TUMBLE(event_time, INTERVAL '1' HOUR)` | Fixed-size, non-overlapping (hourly aggregations) |
| Hop | `HOP(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR)` | Sliding windows (every 5 min, look back 1 hour) |
| Session | `SESSION(event_time, INTERVAL '30' MINUTE)` | User sessions, gap-based |
| Cumulate | `CUMULATE(event_time, INTERVAL '1' HOUR, INTERVAL '1' DAY)` | Progressive windows (hourly, accumulating daily) |

```sql
INSERT INTO hourly_metrics
SELECT
    window_start,
    window_end,
    user_id,
    COUNT(*) AS event_count,
    SUM(amount) AS total_amount
FROM TABLE(TUMBLE(TABLE events, DESCRIPTOR(event_time), INTERVAL '1' HOUR))
GROUP BY window_start, window_end, user_id;
```

## Join Patterns

### Regular Join (non-windowed, unbounded — use with caution)
```sql
SELECT e.*, u.name
FROM events e
JOIN users u ON e.user_id = u.id;  -- State grows unboundedly!
```

### Interval Join
```sql
SELECT o.order_id, p.payment_id
FROM orders o, payments p
WHERE o.order_id = p.order_id
  AND p.payment_time BETWEEN o.order_time AND o.order_time + INTERVAL '1' HOUR;
```

### Temporal Join (lookup table)
```sql
CREATE TABLE currency_rates (
    currency    STRING,
    rate        DECIMAL(10,4),
    update_time TIMESTAMP(3),
    PRIMARY KEY (currency) NOT ENFORCED
) WITH ('connector' = 'jdbc', ...);

SELECT
    t.amount * c.rate AS usd_amount
FROM transactions t
JOIN currency_rates FOR SYSTEM_TIME AS OF t.transaction_time AS c
  ON t.currency = c.currency;
```

## State Management

```sql
-- Set state TTL (critical for production!)
SET 'table.exec.state.ttl' = '86400000';  -- 24 hours in ms

-- RocksDB backend
SET 'state.backend' = 'rocksdb';
SET 'state.backend.incremental' = 'true';
SET 'state.backend.rocksdb.memory.managed' = 'true';
```

## Checkpoint & Savepoint

```bash
# Enable checkpointing
flink run -c com.example.Job job.jar \
  -Dexecution.checkpointing.interval=60s \
  -Dexecution.checkpointing.mode=EXACTLY_ONCE \
  -Dstate.checkpoints.dir=hdfs:///flink/checkpoints

# Stop with savepoint
flink stop --savepointPath hdfs:///flink/savepoints <job-id>

# Resume from savepoint
flink run -s hdfs:///flink/savepoints/savepoint-xxx job.jar
```

## CDC Patterns

```sql
-- MySQL CDC source
CREATE TABLE mysql_cdc (
    id          BIGINT,
    name        STRING,
    updated_at  TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql-host',
    'port' = '3306',
    'username' = 'user',
    'password' = 'pass',
    'database-name' = 'mydb',
    'table-name' = 'users'
);
```

## Top-N & Dedup

```sql
-- TopN by category
SELECT *
FROM (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY score DESC) AS rn
    FROM source_table
) WHERE rn <= 10;

-- Deduplication (keep latest)
SELECT *
FROM (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY id ORDER BY event_time DESC) AS rn
    FROM source_table
) WHERE rn = 1;
```

## References

- Flink SQL Syntax: `references/flink-sql-syntax.md`
- State Backend Guide: `references/state-backend-guide.md`
- Window Patterns: `references/window-patterns.md`
- Script: `scripts/flink-sql-validator.py` — checks for missing watermark/checkpoint

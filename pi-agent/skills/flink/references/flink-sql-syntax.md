# Flink SQL Syntax Reference

## Kafka Source DDL
```sql
CREATE TABLE kafka_source (
    `id`        BIGINT,
    `name`      STRING,
    `amount`    DECIMAL(15,2),
    `ts`        TIMESTAMP(3),
    `proctime`  AS PROCTIME(),
    WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'source-topic',
    'properties.bootstrap.servers' = 'broker1:9092,broker2:9092',
    'properties.group.id' = 'flink-consumer-group',
    'format' = 'json',
    'json.fail-on-missing-field' = 'false',
    'json.ignore-parse-errors' = 'true',
    'scan.startup.mode' = 'group-offsets'
);
```

## Kafka Sink DDL (Append-Only)
```sql
CREATE TABLE kafka_sink (
    `id`        BIGINT,
    `result`    STRING,
    `ts`        TIMESTAMP(3)
) WITH (
    'connector' = 'kafka',
    'topic' = 'sink-topic',
    'properties.bootstrap.servers' = 'broker1:9092',
    'format' = 'json'
);
```

## Upsert Kafka Sink
```sql
CREATE TABLE upsert_kafka_sink (
    `user_id`   STRING,
    `balance`   DECIMAL(15,2),
    `updated_at` TIMESTAMP(3),
    PRIMARY KEY (user_id) NOT ENFORCED
) WITH (
    'connector' = 'upsert-kafka',
    'topic' = 'user-balances',
    'properties.bootstrap.servers' = 'broker1:9092',
    'key.format' = 'json',
    'value.format' = 'json'
);
```

## JDBC Sink
```sql
CREATE TABLE jdbc_sink (
    `id`        BIGINT,
    `name`      STRING,
    `score`     INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:mysql://host:3306/database',
    'table-name' = 'users',
    'username' = '${MYSQL_USER}',
    'password' = '${MYSQL_PASSWORD}',
    'sink.buffer-flush.max-rows' = '5000',
    'sink.buffer-flush.interval' = '2s',
    'sink.max-retries' = '3'
);
```

## Window Aggregation
```sql
-- Tumble window
SELECT
    TUMBLE_START(event_time, INTERVAL '1' HOUR) AS window_start,
    TUMBLE_END(event_time, INTERVAL '1' HOUR) AS window_end,
    user_id,
    COUNT(*) AS cnt
FROM events
GROUP BY TUMBLE(event_time, INTERVAL '1' HOUR), user_id;

-- Hop window (sliding)
SELECT
    HOP_START(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR) AS window_start,
    HOP_END(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR) AS window_end,
    COUNT(*) AS cnt
FROM events
GROUP BY HOP(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR);
```

## Temporal Join
```sql
-- Lookup join against a versioned table
SELECT
    o.order_id,
    o.amount,
    c.rate,
    o.amount * c.rate AS usd_amount
FROM orders o
JOIN currency_rates FOR SYSTEM_TIME AS OF o.order_time AS c
    ON o.currency = c.currency;
```

## CDC Source (MySQL)
```sql
CREATE TABLE mysql_binlog_source (
    `id`        BIGINT,
    `name`      STRING,
    `status`    STRING,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql-master',
    'port' = '3306',
    'username' = 'flink',
    'password' = '${MYSQL_PASSWORD}',
    'database-name' = 'business_db',
    'table-name' = 'orders',
    'server-time-zone' = 'Asia/Shanghai'
);
```

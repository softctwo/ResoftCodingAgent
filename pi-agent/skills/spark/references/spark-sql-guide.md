# Spark SQL Guide

## Temporary Views
```python
df.createOrReplaceTempView("orders")
result = spark.sql("""
    SELECT customer_id, SUM(amount) as total
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY customer_id
""")
```

## Partition Writes
```sql
-- Spark SQL
INSERT OVERWRITE TABLE orders_partitioned PARTITION(year, month)
SELECT *, YEAR(order_date) AS year, MONTH(order_date) AS month
FROM orders;
```

## UDF Registration
```python
spark.udf.register("my_to_upper", lambda s: s.upper() if s else None)
spark.sql("SELECT my_to_upper(name) FROM users")
```

## Performance Configuration
```sql
SET spark.sql.shuffle.partitions = 400;
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.coalescePartitions.enabled = true;
SET spark.sql.adaptive.skewJoin.enabled = true;
SET spark.sql.autoBroadcastJoinThreshold = 10485760; -- 10 MB
```

## Hive Integration
```sql
-- Enable Hive support
-- (requires spark.sql.catalogImplementation = hive in config)
SET spark.sql.catalogImplementation = hive;

-- Create external table
CREATE EXTERNAL TABLE IF NOT EXISTS hive_table (
    id BIGINT,
    name STRING
)
PARTITIONED BY (dt STRING)
STORED AS PARQUET
LOCATION 's3://bucket/hive-table/';

-- Repair partitions
MSCK REPAIR TABLE hive_table;
```

## Common Useful Functions
```sql
-- Date/Time
date_format(order_date, 'yyyy-MM')
date_add(order_date, 7)
datediff(end_date, start_date)
months_between(date1, date2)
date_trunc('MONTH', order_date)

-- String
concat(col1, '-', col2)
regexp_replace(col, '[^a-zA-Z0-9]', '')
split(col, ',')[0]

-- Aggregate Windows
SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date)
FIRST_VALUE(col) OVER (PARTITION BY grp ORDER BY ts)
LAST_VALUE(col) OVER (PARTITION BY grp ORDER BY ts RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)

-- Array/Map
array_contains(array_col, 'value')
explode(array_col)
map_keys(map_col)
```

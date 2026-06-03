# Spark Best Practices

## DataFrame > RDD
Always use DataFrame/Dataset APIs. They benefit from Catalyst optimizer and Tungsten execution engine. RDDs should only be used for unstructured data or when you need low-level control.

## Built-in Functions > UDFs
Spark's built-in functions are optimized in the Catalyst engine. Python UDFs incur serialization overhead (~100x slower for simple operations). Only use UDFs when there's no built-in alternative.

```python
# ✅ Good
df.withColumn("year", F.year("date_col"))

# ❌ Bad (unless no built-in exists)
udf_func = F.udf(lambda x: x.year, IntegerType())
df.withColumn("year", udf_func(F.col("date_col")))
```

## Broadcast Join
Tables smaller than 10 MB (configurable via `spark.sql.autoBroadcastJoinThreshold`) should be broadcast to avoid shuffle. Use `broadcast()` hint to force it.

```python
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "key")
```

## Partition Strategy
- Default parallelism: `spark.sql.shuffle.partitions = 200` (Spark default, tune for cluster size).
- For small data: reduce partitions with `coalesce()` (no shuffle).
- For skew: use `repartition()` with salt keys.
- Write-time: partition by frequently-filtered columns (date, region).

## Caching
Cache DataFrames that are:
- Reused across 3+ actions
- Result of expensive transformations (JOINs, aggregations)
Always unpersist when done to free memory.

## Data Skew
- Detect: look for straggler tasks in Spark UI.
- Mitigate: salting keys, broadcast join, AQE (`spark.sql.adaptive.skewJoin.enabled`).

## File Format
- **Parquet**: default for analytics, columnar, compressed.
- **ORC**: better for Hive-heavy environments.
- **Delta Lake / Iceberg**: for ACID transactions, time travel, schema evolution.

## Shuffle Optimization
- Minimize shuffles: filter before JOIN, use broadcast for small tables.
- Compress shuffle: `spark.shuffle.compress = true`.
- Increase shuffle partitions for large data, reduce for small data.

---
name: resoft-spark
description: >
  Use this skill for PySpark ETL jobs, Spark SQL transformations, data processing
  at scale, DataFrame API programming, Spark performance tuning, and big data
  pipeline development on Databricks or standalone Spark clusters.
---

# Resoft Spark Skill

## PySpark Best Practices

### 1. Prefer DataFrame API over RDD
```python
# ✅ DataFrame
df.filter(F.col("status") == "active").groupBy("category").agg(F.sum("amount"))

# ❌ RDD (avoid unless absolutely necessary)
rdd.filter(lambda x: x[2] == "active").map(lambda x: (x[3], x[5])).reduceByKey(lambda a, b: a + b)
```

### 2. Use Built-in Functions Instead of UDFs
```python
# ✅ Built-in (Catalyst-optimized)
df.withColumn("year", F.year("date_col"))

# ❌ Python UDF (serialization overhead)
year_udf = F.udf(lambda d: d.year, IntegerType())
df.withColumn("year", year_udf(F.col("date_col")))
```

### 3. Broadcast Joins for Small Tables
```python
from pyspark.sql.functions import broadcast

small_df = spark.read.parquet("dim_table")
large_df = spark.read.parquet("fact_table")

result = large_df.join(broadcast(small_df), "key", "left")
```

### 4. Partition Your Data
```python
# Repartition for parallelism
df.repartition(200)                  # Round-robin
df.repartition("country")            # Hash partition by column
df.coalesce(1)                       # Reduce partitions (no shuffle)

# Write with partitions
df.write.partitionBy("year", "month").parquet("output/")
```

### 5. Cache Strategically
```python
# Cache when a DataFrame is reused 3+ times
df.cache()
df.count()  # Materialize

# Unpersist when done
df.unpersist()

# Use MEMORY_AND_DISK for large datasets
df.persist(StorageLevel.MEMORY_AND_DISK)
```

## Common Patterns

### Read Data
```python
# CSV
df = spark.read.option("header", True).option("inferSchema", True).csv("data/input.csv")

# Parquet (preferred for production)
df = spark.read.parquet("data/input/")

# JDBC
df = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://host:5432/db") \
    .option("dbtable", "schema.table") \
    .option("user", "user") \
    .option("password", "pass") \
    .load()

# Kafka (streaming)
df = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "broker:9092") \
    .option("subscribe", "topic") \
    .load()
```

### Data Cleaning
```python
cleaned = (
    df.dropDuplicates(["business_key"])
    .fillna({"amount": 0, "status": "unknown"})
    .filter(F.col("amount") > 0)
    .withColumn("processed_at", F.current_timestamp())
)
```

### Window Functions
```python
from pyspark.sql.window import Window

window = Window.partitionBy("customer_id").orderBy(F.col("order_date").desc())
df.withColumn("rn", F.row_number().over(window))
df.withColumn("running_total", F.sum("amount").over(window))
```

### Write Data
```python
df.write.mode("overwrite").parquet("output/")
df.write.mode("append").partitionBy("dt").parquet("output/")
df.coalesce(4).write.mode("overwrite").csv("output.csv")
```

## Performance Tuning

| Area | Recommendation |
|------|---------------|
| Partitions | `spark.sql.shuffle.partitions = 200` (default); increase for large clusters |
| Memory | `spark.executor.memory = 4g`; 75% for execution, 25% for storage |
| Cores | `spark.executor.cores = 4`; 5 cores max to avoid HDFS throughput issues |
| Serialization | Use Kryo: `spark.serializer = org.apache.spark.serializer.KryoSerializer` |
| AQE | Enable Adaptive Query Execution: `spark.sql.adaptive.enabled = true` |
| Skew | Handle data skew with `spark.sql.adaptive.skewJoin.enabled = true` |
| Broadcast | Set `spark.sql.autoBroadcastJoinThreshold` (default 10MB) |

## Spark Submit

```bash
spark-submit \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 20 \
  --executor-cores 4 \
  --executor-memory 8G \
  --driver-memory 4G \
  --conf spark.sql.shuffle.partitions=400 \
  --conf spark.sql.adaptive.enabled=true \
  etl_job.py --date 2024-01-01
```

## References

- Best Practices: `references/best-practices.md`
- Common Patterns: `references/common-patterns.md`
- Spark SQL Guide: `references/spark-sql-guide.md`
- Script: `scripts/spark-validator.py` — checks for common anti-patterns

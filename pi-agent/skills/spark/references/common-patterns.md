# Spark Common Patterns

## 1. Reading Data

```python
# CSV with schema inference
df = spark.read.option("header", True).option("inferSchema", True).csv("s3://bucket/data/")

# Parquet — preferred for production
df = spark.read.parquet("s3://bucket/data/")

# JDBC with predicate pushdown
df = spark.read.jdbc(
    url="jdbc:postgresql://host:5432/db",
    table="(SELECT * FROM orders WHERE order_date >= '2024-01-01') AS subq",
    properties={"user": "user", "password": "pass"}
)

# Kafka streaming source
df = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "broker:9092") \
    .option("subscribe", "topic,another_topic") \
    .option("startingOffsets", "latest") \
    .load()
```

## 2. Data Cleaning

```python
from pyspark.sql import functions as F

cleaned = (
    raw_df
    .dropDuplicates(["business_key"])
    .dropna(subset=["required_col_1", "required_col_2"])
    .fillna({
        "status": "UNKNOWN",
        "amount": 0,
        "category": "OTHER"
    })
    .filter(F.col("amount") > 0)
    .withColumn("processed_at", F.current_timestamp())
)
```

## 3. Window Functions

```python
from pyspark.sql.window import Window

# Row number within group
window = Window.partitionBy("dept_id").orderBy(F.col("salary").desc())
df.withColumn("rank", F.row_number().over(window))

# Running sum
window = Window.partitionBy("customer_id").orderBy("order_date").rowsBetween(Window.unboundedPreceding, 0)
df.withColumn("running_total", F.sum("amount").over(window))

# Lag
window = Window.partitionBy("customer_id").orderBy("order_date")
df.withColumn("prev_order_date", F.lag("order_date", 1).over(window))
```

## 4. Group Aggregation

```python
agg_df = (
    df.groupBy("category", "year")
    .agg(
        F.count("*").alias("cnt"),
        F.sum("amount").alias("total_amount"),
        F.avg("amount").alias("avg_amount"),
        F.min("amount").alias("min_amount"),
        F.max("amount").alias("max_amount"),
        F.countDistinct("customer_id").alias("unique_customers")
    )
    .orderBy("year", "total_amount", ascending=[True, False])
)
```

## 5. Writing Data

```python
# Parquet with partitions
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/output/")

# JDBC upsert (via foreachPartition)
def upsert_partition(rows):
    conn = psycopg2.connect(...)
    for row in rows:
        cur.execute("INSERT ... ON CONFLICT (id) DO UPDATE ...", row)
    conn.commit()
    conn.close()

df.foreachPartition(upsert_partition)
```

## 6. Pandas UDF (When Built-ins Don't Exist)

```python
from pyspark.sql.functions import pandas_udf
import pandas as pd

@pandas_udf("double")
def haversine(lat1: pd.Series, lon1: pd.Series, lat2: pd.Series, lon2: pd.Series) -> pd.Series:
    """Calculate haversine distance between two lat/lon pairs."""
    from math import radians, sin, cos, sqrt, atan2
    R = 6371  # Earth radius in km
    # Vectorized computation using numpy
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
    return 2 * R * np.arctan2(np.sqrt(a), np.sqrt(1-a))

df.withColumn("distance_km", haversine("lat1", "lon1", "lat2", "lon2"))
```

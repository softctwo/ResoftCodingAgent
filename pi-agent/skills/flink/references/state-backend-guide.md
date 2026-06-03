# Flink State Backend Guide

## RocksDB Configuration
```sql
-- Recommended for production with large state
SET 'state.backend' = 'rocksdb';
SET 'state.backend.incremental' = 'true';
SET 'state.backend.rocksdb.memory.managed' = 'true';

-- Fine-tune RocksDB
SET 'state.backend.rocksdb.thread.num' = '4';
SET 'state.backend.rocksdb.writebuffer.count' = '4';
SET 'state.backend.rocksdb.writebuffer.size' = '128mb';
SET 'state.backend.rocksdb.block.cache-size' = '256mb';
```

## State TTL (Critical for Production)
```sql
-- Set state TTL globally
SET 'table.exec.state.ttl' = '86400000';  -- 24 hours in milliseconds

-- Per-query TTL (via SQL hints)
SELECT /*+ STATE_TTL('orders_source' = '7d') */
    user_id, COUNT(*) AS order_count
FROM orders_source
GROUP BY user_id;
```

## Checkpoint Configuration
```yaml
# flink-conf.yaml
execution.checkpointing.interval: 60s
execution.checkpointing.mode: EXACTLY_ONCE
execution.checkpointing.timeout: 10min
execution.checkpointing.max-concurrent-checkpoints: 1
execution.checkpointing.min-pause: 30s
execution.checkpointing.externalized-checkpoint-retention: RETAIN_ON_CANCELLATION
state.checkpoints.dir: hdfs:///flink/checkpoints
state.savepoints.dir: hdfs:///flink/savepoints
```

## Savepoint Operations
```bash
# Trigger savepoint
flink savepoint <job-id> hdfs:///flink/savepoints

# Stop job with savepoint
flink stop --savepointPath hdfs:///flink/savepoints <job-id>

# Resume from savepoint
flink run -s hdfs:///flink/savepoints/savepoint-xxx job.jar

# Resume with state evolution (ignore unresolvable state)
flink run -s hdfs:///flink/savepoints/savepoint-xxx \
  --allowNonRestoredState job.jar
```

## State Cleanup Best Practices
1. **Always set TTL**: Without TTL, state grows unbounded and eventually OOMs.
2. **Use timers**: RocksDB supports efficient timer-based cleanup.
3. **Monitor state size**: Use Flink metrics to track state size per operator.
4. **Periodic cleanups**: Consider taking savepoints and restarting jobs periodically in long-running pipelines.
5. **Configurable cleanup modes**:
```sql
SET 'table.exec.state.ttl.cleanup.mode' = 'rocksdb_compaction_filter';
```

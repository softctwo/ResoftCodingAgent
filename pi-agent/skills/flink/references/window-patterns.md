# Flink Window Patterns

## Tumble Window
Fixed-size, non-overlapping windows. Best for periodic aggregations.
```sql
-- Hourly order counts
SELECT
    TUMBLE_START(event_time, INTERVAL '1' HOUR) AS window_start,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY TUMBLE(event_time, INTERVAL '1' HOUR);
```

## Hop Window (Sliding)
Sliding windows — every slide interval, a new window starts.
```sql
-- Every 5 minutes, look back 1 hour
SELECT
    HOP_START(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR) AS window_start,
    HOP_END(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR) AS window_end,
    COUNT(*) AS event_count
FROM events
GROUP BY HOP(event_time, INTERVAL '5' MINUTE, INTERVAL '1' HOUR);
```

## Session Window
Gap-based windows for user sessions. A new window starts when there's no event for the gap duration.
```sql
-- User sessions with 30-minute inactivity gap
SELECT
    SESSION_START(event_time, INTERVAL '30' MINUTE) AS session_start,
    SESSION_END(event_time, INTERVAL '30' MINUTE) AS session_end,
    user_id,
    COUNT(*) AS events_in_session
FROM user_events
GROUP BY SESSION(event_time, INTERVAL '30' MINUTE), user_id;
```

## Cumulate Window
Accumulating windows — hourly windows that accumulate to daily totals.
```sql
-- Hourly windows that cumulate to daily totals within each day
SELECT
    window_start,
    window_end,
    SUM(amount) AS cumulative_amount
FROM TABLE(
    CUMULATE(
        TABLE orders,
        DESCRIPTOR(event_time),
        INTERVAL '1' HOUR,
        INTERVAL '1' DAY
    )
)
GROUP BY window_start, window_end;
```

## Window Selection Guide

| Requirement | Window Type |
|---|---|
| Hourly/daily aggregated reports | Tumble |
| Moving average, recent trends | Hop |
| User sessions, clickstream | Session |
| Running daily total from hourly data | Cumulate |

## Watermark Strategies

```sql
-- Strict ordering (no late data)
WATERMARK FOR event_time AS event_time

-- Tolerate up to 5 seconds of lateness
WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND

-- In production: measure P99 latency, add 20% margin
-- e.g., if P99 latency = 25s, use 30s watermark
WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND
```

**Important**: Watermarks trigger window evaluation. Late data (arriving after the watermark passed the window end) is dropped unless you configure `allowedLateness` or use side outputs.

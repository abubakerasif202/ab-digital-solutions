const required = ["CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD"];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

function identifier(value, fallback) {
  const candidate = value?.trim() || fallback;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate)) {
    throw new Error(`Invalid ClickHouse identifier: ${candidate}`);
  }
  return candidate;
}

const database = identifier(process.env.CLICKHOUSE_DATABASE, "default");
const table = identifier(process.env.CLICKHOUSE_TABLE, "web_events");
const endpoint = new URL(process.env.CLICKHOUSE_URL);
const headers = {
  "Content-Type": "text/plain; charset=utf-8",
  "X-ClickHouse-User": process.env.CLICKHOUSE_USER,
  "X-ClickHouse-Key": process.env.CLICKHOUSE_PASSWORD,
};

async function query(sql) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: sql,
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ClickHouse HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
}

try {
  if (database !== "default") {
    await query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  }

  await query(`
CREATE TABLE IF NOT EXISTS \`${database}\`.\`${table}\`
(
  event_time DateTime64(3, 'UTC') DEFAULT now64(3),
  event_name LowCardinality(String),
  path String,
  label String DEFAULT '',
  metric_name LowCardinality(String) DEFAULT '',
  metric_value Float64 DEFAULT 0,
  metric_rating LowCardinality(String) DEFAULT '',
  navigation_type LowCardinality(String) DEFAULT '',
  user_agent String DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_name, path, event_time)
TTL event_time + INTERVAL 180 DAY DELETE
SETTINGS index_granularity = 8192
  `);

  console.log(`ClickHouse analytics ready: ${database}.${table}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

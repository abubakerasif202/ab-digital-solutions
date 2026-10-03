type AnalyticsEvent = {
  event_name: "page_view" | "cta_click" | "web_vital";
  path: string;
  label?: string;
  metric_name?: string;
  metric_value?: number;
  metric_rating?: string;
  navigation_type?: string;
  user_agent?: string;
};

function cleanIdentifier(value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate)) {
    throw new Error(`Invalid ClickHouse identifier: ${candidate}`);
  }
  return candidate;
}

function configuration() {
  const baseUrl = process.env.CLICKHOUSE_URL?.trim();
  const user = process.env.CLICKHOUSE_USER?.trim();
  const password = process.env.CLICKHOUSE_PASSWORD;

  if (!baseUrl || !user || !password) return null;

  return {
    baseUrl,
    user,
    password,
    database: cleanIdentifier(process.env.CLICKHOUSE_DATABASE, "default"),
    table: cleanIdentifier(process.env.CLICKHOUSE_TABLE, "web_events"),
  };
}

export function clickHouseConfigured() {
  return configuration() !== null;
}

export async function insertAnalyticsEvent(event: AnalyticsEvent) {
  const config = configuration();
  if (!config) return false;

  const endpoint = new URL(config.baseUrl);
  endpoint.searchParams.set(
    "query",
    `INSERT INTO \`${config.database}\`.\`${config.table}\` FORMAT JSONEachRow`,
  );
  endpoint.searchParams.set("input_format_defaults_for_omitted_fields", "1");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-ndjson",
      "X-ClickHouse-User": config.user,
      "X-ClickHouse-Key": config.password,
    },
    body: `${JSON.stringify(event)}\n`,
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) {
    throw new Error(`ClickHouse insert failed with HTTP ${response.status}`);
  }

  return true;
}

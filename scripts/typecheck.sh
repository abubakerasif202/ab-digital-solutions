#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

# Vinext and Next.js both generate route declarations under .next. Refresh
# them with Next before standalone TypeScript validation so check order cannot
# leave incompatible generated declarations behind.
"${SITES_PROJECT_ROOT}/node_modules/.bin/next" typegen
"${SITES_PROJECT_ROOT}/node_modules/.bin/tsc" --noEmit

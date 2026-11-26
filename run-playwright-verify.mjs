process.env.QA_BASE_URL = "http://127.0.0.1:3100";
process.env.CHROMIUM_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
import { spawnSync } from "node:child_process";
const r = spawnSync(process.execPath, [
  "./node_modules/@playwright/test/cli.js",
  "test",
  "--reporter=list"
], { stdio: "inherit", cwd: "C:\\Users\\abuba\\ab-digital-solutions" });
process.exit(r.status ?? 1);

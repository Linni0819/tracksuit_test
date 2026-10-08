import { Database } from "@db/sqlite";
import * as path from "@std/path";
import { Port } from "../lib/utils/index.ts";
import { createTable } from "./tables/insights.ts";
import { createApp } from "./app.ts";

console.log("Loading configuration");

const env = {
  port: Port.parse(Deno.env.get("SERVER_PORT")),
};

const dbFilePath = path.resolve("tmp", "db.sqlite3");

console.log(`Opening SQLite database at ${dbFilePath}`);

await Deno.mkdir(path.dirname(dbFilePath), { recursive: true });
const db = new Database(dbFilePath);
db.exec(createTable);

console.log("Initialising server");

const app = createApp(db);
app.addEventListener("listen", () => {
  console.log(`Started server on port ${env.port}`);
});
try {
  await app.listen(env);
} finally {
  db.close();
}

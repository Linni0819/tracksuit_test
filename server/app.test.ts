import { Database } from "@db/sqlite";
import { expect } from "@std/expect";
import { createApp } from "./app.ts";
import { createTable } from "./tables/insights.ts";

const withApp = async (
  test: (
    request: (path: string, init?: RequestInit) => Promise<Response>,
    db: Database,
  ) => Promise<void>,
) => {
  const db = new Database(":memory:");
  db.exec(createTable);
  const app = createApp(db);
  try {
    await test(async (path, init) => {
      const response = await app.handle(
        new Request(`http://localhost${path}`, init),
      );
      if (!response) throw new Error("No response from application");
      return response;
    }, db);
  } finally {
    db.close();
  }
};

Deno.test("create, list, look up, and delete an insight", () =>
  withApp(async (request, db) => {
    expect(await (await request("/insights")).json()).toEqual([]);
    const text = "Customers' coats; DROP TABLE insights; --";
    const created = await request("/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: 2, text: ` ${text} ` }),
    });
    expect(created.status).toBe(201);
    const insight = await created.json();
    expect(insight.id).toBeGreaterThan(0);
    expect(insight.brand).toBe(2);
    expect(insight.text).toBe(text);
    expect(Number.isNaN(Date.parse(insight.createdAt))).toBe(false);
    expect(created.headers.get("Location")).toBe(`/insights/${insight.id}`);

    // Reinitialising an existing database must preserve its insights.
    db.exec(createTable);
    const list = await request("/insights");
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual([insight]);
    const lookup = await request(`/insights/${insight.id}`);
    expect(lookup.status).toBe(200);
    expect(await lookup.json()).toEqual(insight);

    const deleted = await request(`/insights/${insight.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe("");
    expect(await (await request("/insights")).json()).toEqual([]);
    expect((await request(`/insights/${insight.id}`)).status).toBe(404);
    expect(
      (await request(`/insights/${insight.id}`, { method: "DELETE" })).status,
    ).toBe(404);
  }));

Deno.test("reject invalid insight data without inserting rows", () =>
  withApp(async (request) => {
    const inputs = [
      {},
      { brand: -1, text: "Insight" },
      { brand: 1.5, text: "Insight" },
      { brand: "1", text: "Insight" },
      { brand: 1, text: "   " },
      { brand: 1, text: 123 },
      null,
    ];
    for (const input of inputs) {
      const response = await request("/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      expect(response.status).toBe(400);
      await response.text();
    }
    const malformed = await request("/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    expect(malformed.status).toBe(400);
    await malformed.text();
    expect(await (await request("/insights")).json()).toEqual([]);
  }));

Deno.test("reject invalid IDs and preserve other insights when deleting", () =>
  withApp(async (request) => {
    for (const text of ["First", "Second"]) {
      const response = await request("/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: 1, text }),
      });
      await response.text();
    }
    for (
      const id of ["abc", "0", "-1", "1.5", "9007199254740992", "1%20OR%201=1"]
    ) {
      for (const method of ["GET", "DELETE"]) {
        const response = await request(`/insights/${id}`, { method });
        expect(response.status).toBe(400);
        await response.text();
      }
    }
    const deleted = await request("/insights/1", { method: "DELETE" });
    expect(deleted.status).toBe(204);
    const remaining = await (await request("/insights")).json();
    expect(remaining.length).toBe(1);
    expect(remaining[0].text).toBe("Second");
  }));

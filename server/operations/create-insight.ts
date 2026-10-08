import type { Insight } from "$models/insight.ts";
import type { HasDBClient } from "../shared.ts";
import type * as insightsTable from "$tables/insights.ts";

type Input = HasDBClient & Pick<Insight, "brand" | "text">;

export default (input: Input): Insight => {
  const createdAt = new Date().toISOString();
  const [row] = input.db.sql<insightsTable.Row>`
    INSERT INTO insights (brand, createdAt, text)
    VALUES (${input.brand}, ${createdAt}, ${input.text})
    RETURNING *
  `;

  return { ...row, createdAt: new Date(row.createdAt) };
};

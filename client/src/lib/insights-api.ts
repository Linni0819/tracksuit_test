import { Insight } from "../schemas/insight.ts";

export type NewInsight = Pick<Insight, "brand" | "text">;

const request = async (
  path: string,
  options?: RequestInit,
): Promise<Response> => {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) {
    throw new Error(`Unable to save or load insights (${response.status}).`);
  }
  return response;
};

export const listInsights = async (): Promise<Insight[]> => {
  const response = await request("/insights");
  return Insight.array().parse(await response.json());
};

export const createInsight = async (input: NewInsight): Promise<Insight> => {
  const response = await request("/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return Insight.parse(await response.json());
};

export const deleteInsight = async (id: number): Promise<void> => {
  await request(`/insights/${id}`, { method: "DELETE" });
};

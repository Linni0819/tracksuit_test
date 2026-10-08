// @deno-types="@types/react"
import { useEffect, useState } from "react";
import { Header } from "../components/header/header.tsx";
import { Insights } from "../components/insights/insights.tsx";
// @deno-types="../types/css.d.ts"
import styles from "./app.module.css";
import type { Insight } from "../schemas/insight.ts";
import * as api from "../lib/insights-api.ts";

export const App = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.listInsights().then((result) => {
      if (active) setInsights(result);
    }).catch(() => {
      if (active) {
        setError("Unable to load insights. Please refresh to try again.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const createInsight = async (input: api.NewInsight) => {
    const insight = await api.createInsight(input);
    setInsights((current) => [...current, insight]);
  };

  const deleteInsight = async (id: number) => {
    await api.deleteInsight(id);
    setInsights((current) => current.filter((insight) => insight.id !== id));
  };

  return (
    <main className={styles.main}>
      <Header onCreate={createInsight} disabled={loading || error !== null} />
      {loading
        ? <p role="status">Loading insights...</p>
        : error
        ? <p role="alert">{error}</p>
        : (
          <Insights
            className={styles.insights}
            insights={insights}
            onDelete={deleteInsight}
          />
        )}
    </main>
  );
};

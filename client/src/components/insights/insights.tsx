import { Trash2Icon } from "lucide-react";
import { cx } from "../../lib/cx.ts";
// @deno-types="../../types/css.d.ts"
import styles from "./insights.module.css";
import type { Insight } from "../../schemas/insight.ts";
// @deno-types="@types/react"
import { useState } from "react";
import { BRANDS } from "../../lib/consts.ts";

type InsightsProps = {
  insights: Insight[];
  className?: string;
  onDelete(id: number): Promise<void>;
};

export const Insights = ({ insights, className, onDelete }: InsightsProps) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deleteInsight = async (id: number) => {
    setDeletingId(id);
    setError(null);
    try {
      await onDelete(id);
    } catch {
      setError("Unable to delete insight. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={cx(className)}>
      <h1 className={styles.heading}>Insights</h1>
      {error && <p role="alert">{error}</p>}
      <div className={styles.list}>
        {insights?.length
          ? (
            insights.map(({ id, text, createdAt, brand }) => (
              <div className={styles.insight} key={id}>
                <div className={styles["insight-meta"]}>
                  <span>
                    {BRANDS.find((item) =>
                      item.id === brand
                    )?.name ?? brand}
                  </span>
                  <div className={styles["insight-meta-details"]}>
                    <time dateTime={createdAt.toISOString()}>
                      {createdAt.toLocaleString()}
                    </time>
                    <button
                      type="button"
                      className={styles["insight-delete"]}
                      aria-label={`Delete insight ${id}`}
                      disabled={deletingId !== null}
                      onClick={() => deleteInsight(id)}
                    >
                      <Trash2Icon size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className={styles["insight-content"]}>{text}</p>
              </div>
            ))
          )
          : <p>We have no insight!</p>}
      </div>
    </div>
  );
};

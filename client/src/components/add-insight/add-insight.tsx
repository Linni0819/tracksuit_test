import { BRANDS } from "../../lib/consts.ts";
import { Button } from "../button/button.tsx";
import { Modal, type ModalProps } from "../modal/modal.tsx";
// @deno-types="../../types/css.d.ts"
import styles from "./add-insight.module.css";
// @deno-types="@types/react"
import { type FormEvent, useState } from "react";
import type { NewInsight } from "../../lib/insights-api.ts";

type AddInsightProps = ModalProps & {
  onCreate(input: NewInsight): Promise<void>;
};

export const AddInsight = (
  { onCreate, onClose, ...props }: AddInsightProps,
) => {
  const [brand, setBrand] = useState(BRANDS[0].id);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addInsight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!text.trim()) {
      setError("Please enter an insight.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ brand, text: text.trim() });
      setText("");
      setBrand(BRANDS[0].id);
      onClose();
    } catch {
      setError("Unable to add insight. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      {...props}
      onClose={() => {
        if (!submitting) onClose();
      }}
    >
      <h1 className={styles.heading}>Add a new insight</h1>
      <form className={styles.form} onSubmit={addInsight}>
        <label className={styles.field}>
          Brand
          <select
            className={styles["field-input"]}
            value={brand}
            onChange={(event) => setBrand(Number(event.target.value))}
            disabled={submitting}
          >
            {BRANDS.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Insight
          <textarea
            className={styles["field-input"]}
            rows={5}
            placeholder="Something insightful..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            disabled={submitting}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <Button
          className={styles.submit}
          type="submit"
          label={submitting ? "Adding..." : "Add insight"}
          disabled={submitting}
        />
      </form>
    </Modal>
  );
};

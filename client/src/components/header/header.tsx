// @deno-types="@types/react"
import { useState } from "react";
import { Button } from "../button/button.tsx";
// @deno-types="../../types/css.d.ts"
import styles from "./header.module.css";
import { AddInsight } from "../add-insight/add-insight.tsx";
import type { NewInsight } from "../../lib/insights-api.ts";

export const HEADER_TEXT = "Suit Tracker Insights";

type HeaderProps = {
  onCreate(input: NewInsight): Promise<void>;
  disabled?: boolean;
};

export const Header = ({ onCreate, disabled }: HeaderProps) => {
  const [addInsightOpen, setAddInsightOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <span className={styles.logo}>{HEADER_TEXT}</span>
          <Button
            label="Add insight"
            theme="secondary"
            disabled={disabled}
            onClick={() => setAddInsightOpen(true)}
          />
        </div>
      </header>
      <AddInsight
        open={addInsightOpen}
        onClose={() => setAddInsightOpen(false)}
        onCreate={onCreate}
      />
    </>
  );
};

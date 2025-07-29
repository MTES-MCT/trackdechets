import React from "react";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import styles from "./ClickableTag.module.scss";

export function ClickableTag({
  status,
  text,
  onDismiss,
  onTagClick,
  disabled
}: {
  status: "error" | null;
  text: string;
  onDismiss: () => void;
  onTagClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={status === "error" ? styles.errorTag : styles.tag}>
      <Tag
        className="fr-mb-1v"
        dismissible={false}
        nativeButtonProps={{
          type: "button",
          disabled
        }}
      >
        <div className={styles.tagContent}>
          <span onClick={onTagClick} className={styles.tagText}>
            {text}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onDismiss();
              }}
              className={styles.tagButton}
              aria-label="Supprimer"
            >
              <span
                className="fr-icon--sm fr-icon-close-line"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </Tag>
    </div>
  );
}

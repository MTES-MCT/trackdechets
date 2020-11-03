import React from "react";
import styles from "./ActionButton.module.scss";
/**
 * Custom button intended to be used in dashboards action column.
 * Tries eagerly to adapt its layout to available space
 *
 */
export default function ActionButton({ onClick, title, icon, iconSize = 24 }) {
  return (
    <div className={styles.dynamicAction}>
      <button
        className="btn btn--primary btn--slim btn--auto-height"
        onClick={onClick}
        title={title}
      >
        <span className={styles.dynamicActionContent}>
          {icon({ size: iconSize })}
          <span className={styles.dynamicActionText}>{title}</span>
        </span>
      </button>
      <span className={styles.dynamicActionCaption}>{title}</span>
    </div>
  );
}
/**
 * Custom button w/o icon for transporter segment column.
 *
 */
export const OutlineButton = ({ onClick, title }) => {
  return (
    <div className={styles.dynamicAction}>
      <button
        className="btn btn--outline-primary btn--slim btn--auto-height"
        onClick={onClick}
        title={title}
      >
        <span className={styles.dynamicActionContent}>
          <span className={styles.dynamicActionText}>{title}</span>
        </span>
      </button>
      <span className={styles.dynamicActionCaption}>{title}</span>
    </div>
  );
};

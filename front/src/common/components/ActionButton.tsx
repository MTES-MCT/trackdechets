import React from "react";
import { IconProps } from "common/components/Icons";
import styles from "./ActionButton.module.scss";

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ElementType<IconProps>;
  iconSize?: string;
}

/**
 * Custom button intended to be used in dashboards action column.
 * Tries eagerly to adapt its layout to available space
 *
 */
export default function ActionButton({
  onClick,
  title,
  icon: Icon,
  iconSize = "24px",
}: ActionButtonProps) {
  return (
    <div className={styles.dynamicAction}>
      <button
        className="btn btn--primary btn--slim btn--auto-height"
        onClick={onClick}
        title={title}
      >
        <span className={styles.dynamicActionContent}>
          <Icon size={iconSize} />
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

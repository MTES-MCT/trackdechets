import React from "react";
import classNames from "classnames";
import styles from "./ActionButton.module.scss";

export const ActionButtonContext = React.createContext<{
  size: "normal" | "small";
}>({
  size: "normal",
});

interface ActionButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  children: React.ReactNode;
}

export default function ActionButton({
  icon,
  children,
  ...props
}: ActionButtonProps) {
  const { size } = React.useContext(ActionButtonContext);

  return (
    <button
      {...props}
      className={classNames("btn btn--primary", styles.ActionButton, {
        [styles.ActionButtonSmall]: size === "small",
      })}
    >
      <span className={styles.ActionButtonIcon}>{icon}</span>
      <span className={styles.ActionButtonContent}>{children}</span>
    </button>
  );
}

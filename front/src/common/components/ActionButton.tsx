import classNames from "classnames";
import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
} from "react";
import styles from "./ActionButton.module.scss";
import { Link } from "react-router-dom";
export const ActionButtonContext = createContext<{
  size: "normal" | "small";
}>({
  size: "normal",
});

interface ActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

export default function ActionButton({
  icon,
  children,
  ...props
}: ActionButtonProps) {
  const { size } = useContext(ActionButtonContext);

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

interface ActionLinkProps extends HTMLAttributes<HTMLLinkElement> {
  icon: ReactNode;
  children: ReactNode;
  to: any;
}
export function ActionLink({ icon, children, to }: ActionLinkProps) {
  const { size } = useContext(ActionButtonContext);

  return (
    <Link
      to={to}
      className={classNames("btn btn--primary", styles.ActionButton, {
        [styles.ActionButtonSmall]: size === "small",
      })}
    >
      <span className={styles.ActionButtonIcon}>{icon}</span>
      <span className={styles.ActionButtonContent}>{children}</span>
    </Link>
  );
}

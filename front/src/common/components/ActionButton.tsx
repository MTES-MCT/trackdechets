import classNames from "classnames";
import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext
} from "react";
import styles from "./ActionButton.module.scss";
import { Link } from "react-router-dom";
export const ActionButtonContext = createContext<{
  size: "normal" | "small";
}>({
  size: "normal"
});

interface ActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
  secondary?: boolean;
}

export default function ActionButton({
  icon,
  children,
  secondary,
  ...props
}: ActionButtonProps) {
  const { size } = useContext(ActionButtonContext);

  return (
    <button
      {...props}
      className={classNames(
        `${secondary ? "btn--outline-primary" : "btn--primary"}`,
        {
          [styles.ActionButtonSmall]: size === "small",
          [styles.ActionButton]: size === "normal"
        }
      )}
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
      className={classNames("btn--primary", {
        [styles.ActionButtonSmall]: size === "small",
        [styles.ActionButton]: size === "normal"
      })}
    >
      <span className={styles.ActionButtonIcon}>{icon}</span>
      <span className={styles.ActionButtonContent}>{children}</span>
    </Link>
  );
}

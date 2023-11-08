import * as React from "react";
import classNames from "classnames";
import styles from "./List.module.scss";

export interface ListProps extends React.OlHTMLAttributes<HTMLUListElement> {
  /**
   * The list's variant.
   */
  variant?: "styled" | "unstyled" | "inline";
}

export function List({ variant = "styled", children, ...props }: ListProps) {
  return (
    <ul
      {...props}
      className={classNames(props.className, {
        [styles.ListUnstyled]: variant === "unstyled",
        [styles.ListInline]: variant === "inline"
      })}
    >
      {children}
    </ul>
  );
}

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /**
   * Add an icon at the start of the item.
   */
  startIcon?: React.ReactNode;
}

export function ListItem({ startIcon, children, ...props }: ListItemProps) {
  return (
    <li
      {...props}
      className={classNames(props.className, {
        [styles.ListItemWithIcon]: Boolean(startIcon)
      })}
    >
      {startIcon ? (
        <>
          <div className={styles.ListItemStartIcon}>{startIcon}</div>
          <div className={styles.ListItemContent}>{children}</div>
        </>
      ) : (
        children
      )}
    </li>
  );
}

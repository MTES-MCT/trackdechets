import * as React from "react";
import classNames from "classnames";
import { IconTriangleDown, IconTriangleUp } from "./Icons";
import styles from "./Table.module.scss";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <table {...props} className={classNames(styles.Table, className)}>
      {children}
    </table>
  );
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableHead({ children, className, ...props }: TableHeadProps) {
  return (
    <thead {...props} className={classNames(styles.TableHead, className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <tbody {...props} className={classNames(styles.TableBody, className)}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export function TableRow({ children, className, ...props }: TableRowProps) {
  return (
    <tr {...props} className={classNames(styles.TableRow, className)}>
      {children}
    </tr>
  );
}

interface TableHeaderCellProps
  extends React.HTMLAttributes<HTMLTableHeaderCellElement> {
  children: React.ReactNode;
}

export function TableHeaderCell({
  children,
  className,
  ...props
}: TableHeaderCellProps) {
  return (
    <th {...props} className={classNames(styles.TableHeaderCell, className)}>
      {children}
    </th>
  );
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td {...props} className={classNames(styles.TableCell, className)}>
      {children}
    </td>
  );
}

interface TableSortIconProps {
  sortBy: "ASC" | "DESC" | null;
}

export function TableSortIcon({ sortBy }: TableSortIconProps) {
  const Icon = sortBy === "ASC" ? IconTriangleDown : IconTriangleUp;
  return (
    <Icon
      className={classNames(styles.TableSortIcon, {
        [styles.TableSortIconVisible]: sortBy != null,
      })}
    />
  );
}

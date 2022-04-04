import * as React from "react";
import styles from "./DataList.module.scss";

export function DataList(props: React.PropsWithChildren<{}>) {
  return <dl {...props} className={styles.DataList} />;
}

export function DataListItem(props: React.PropsWithChildren<{}>) {
  return <div {...props} className={styles.DataListItem} />;
}

export function DataListTerm(props: React.PropsWithChildren<{}>) {
  return <dt {...props} className={styles.DataListTerm} />;
}

export function DataListDescription(props: React.PropsWithChildren<{}>) {
  return <dd {...props} className={styles.DataListDescription} />;
}

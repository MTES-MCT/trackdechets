import * as React from "react";
import styles from "./DsfrDataList.module.scss";

export function DsfrDataList(props: React.PropsWithChildren<{}>) {
  return <dl {...props} className={styles.DataList} />;
}

export function DsfrDataListItem(props: React.PropsWithChildren<{}>) {
  return <div {...props} className={styles.DataListItem} />;
}

export function DsfrDataListTerm(props: React.PropsWithChildren<{}>) {
  return <dt {...props} className={styles.DataListTerm} />;
}

export function DsfrDataListDescription(props: React.PropsWithChildren<{}>) {
  return <dd {...props} className={styles.DataListDescription} />;
}

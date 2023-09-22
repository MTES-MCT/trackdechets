import React from "react";
import { NetworkStatus } from "@apollo/client";
import styles from "./Loader.module.scss";

export default function Loader() {
  return <div data-testid="loader" className={styles.loader}></div>;
}

export const ModalLoader = () => (
  <div className={styles.loaderModal}>
    <Loader />
  </div>
);

/**
 * Displays an overlayed loading icon when query is refetched or replayed to load more items
 * networkStatus comes from useQuery hook and tells apart first load, refetch and fetchmore events
 */
export const RefreshLoader = ({
  networkStatus
}: {
  networkStatus: NetworkStatus;
}) =>
  networkStatus === NetworkStatus.refetch ||
  networkStatus === NetworkStatus.fetchMore ? (
    <Loader />
  ) : null;

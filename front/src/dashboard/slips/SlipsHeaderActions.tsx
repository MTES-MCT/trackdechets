import React from "react";
import { Link } from "react-router-dom";
import { RefreshIcon } from "common/components/Icons";
import styles from "./SlipsHeaderActions.module.scss";
import { formCreateRoute } from "common/routes";
export default function SlipsHeaderActions({
  refetch,
}: {
  refetch: () => void;
}) {
  return (
    <div className={styles.slipHeaderActions}>
      <Link to={formCreateRoute} className="btn btn--primary">
        Créer un bordereau…
      </Link>
      <button
        className={`btn btn--primary ${styles.refreshButton}`}
        onClick={() => refetch()}
      >
        <span>Rafraîchir</span>
        <RefreshIcon />
      </button>
    </div>
  );
}

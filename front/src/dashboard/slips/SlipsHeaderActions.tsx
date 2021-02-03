import React from "react";
import { generatePath, Link, useParams } from "react-router-dom";
import { IconRefresh } from "common/components/Icons";
import styles from "./SlipsHeaderActions.module.scss";
import routes from "common/routes";

export default function SlipsHeaderActions({
  refetch,
}: {
  refetch: () => void;
}) {
  const { siret } = useParams<{ siret: string }>();
  return (
    <div className={styles.slipHeaderActions}>
      <Link
        to={generatePath(routes.dashboard.slips.create, { siret })}
        className="btn btn--primary"
      >
        Créer un bordereau
      </Link>
      <button
        className={`btn btn--primary ${styles.refreshButton}`}
        onClick={() => refetch()}
      >
        <span>Rafraîchir</span>
        <IconRefresh />
      </button>
    </div>
  );
}

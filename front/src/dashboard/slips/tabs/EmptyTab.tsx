import React from "react";
import { Link, useParams, generatePath } from "react-router-dom";
import { routes } from "common/routes";
import styles from "../SlipsHeaderActions.module.scss";

interface Props {
  children: React.ReactNode;
}

export default function EmptyTab(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  return (
    <div className="empty-tab">
      <div className={styles.slipHeaderActions}>
        <Link
          to={generatePath(routes.dashboard.slips.create, { siret })}
          className="btn btn--primary"
        >
          Créer un bordereau…
        </Link>
      </div>

      {props.children}
    </div>
  );
}

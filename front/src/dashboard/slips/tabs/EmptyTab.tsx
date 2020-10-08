import React from "react";
import { Link } from "react-router-dom";
import { formCreateRoute } from "common/routes";
import styles from "../SlipsHeaderActions.module.scss";
export default function EmptyTab(props) {
  return (
    <div className="empty-tab">
      <div className={styles.slipHeaderActions}>
        <Link to={formCreateRoute} className="btn btn--primary">
          Créer un bordereau…
        </Link>
      </div>

      {props.children}
    </div>
  );
}

import * as React from "react";
import { Link, generatePath, useLocation } from "react-router-dom";
import { Form } from "generated/graphql/types";
import routes from "common/routes";
import { IconView } from "common/components/Icons";
import { WorkflowAction } from "../WorkflowAction";
import { Column } from "../types";
import styles from "./BSDCards.module.scss";

interface BSDCardsProps {
  siret: string;
  forms: Form[];
  columns: Column[];
}

export function BSDCards({ siret, forms, columns }: BSDCardsProps) {
  const location = useLocation();

  return (
    <div className={styles.BSDCards}>
      {forms.map(form => (
        <div key={form.id} className={styles.BSDCard}>
          <ul className={styles.BSDCardList}>
            {columns.map(column => (
              <li key={column.id} className={styles.BSDCardListItem}>
                <div className={styles.BSDCardListItemLabel}>
                  {column.Header}
                </div>
                <div className={styles.BSDCardListItemValue}>
                  {column.Cell ? (
                    <column.Cell value={column.accessor(form)} row={form} />
                  ) : (
                    column.accessor(form)
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.BSDCardActions}>
            <Link
              to={{
                pathname: generatePath(routes.dashboard.bsdds.view, {
                  siret,
                  id: form.id,
                }),
                state: { background: location },
              }}
              className="btn btn--outline-primary"
            >
              <IconView size="24px" style={{ marginRight: "1rem" }} />
              Aperçu
            </Link>
            <WorkflowAction siret={siret} form={form} />
          </div>
        </div>
      ))}
    </div>
  );
}

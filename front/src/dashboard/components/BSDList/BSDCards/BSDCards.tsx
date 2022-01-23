import * as React from "react";
import { Link, generatePath, useLocation, useParams } from "react-router-dom";
import { CellProps } from "react-table";
import { CommonBsd, CommonBsdType } from "generated/graphql/types";
import routes from "common/routes";
import { IconView } from "common/components/Icons";
import { WorkflowAction } from "../BSDD/WorkflowAction/WorkflowAction";
import { WorkflowAction as BsdasriWorkflowAction } from "../BSDasri/WorkflowAction";
import { WorkflowAction as BsffWorkflowAction } from "../BSFF/WorkflowAction";
import { WorkflowAction as BsvhuWorkflowAction } from "../BSVhu/WorkflowAction";
import { WorkflowAction as BsdaWorkflowAction } from "../BSDa/WorkflowAction";
import { Column } from "../columns"; 
import styles from "./BSDCards.module.scss";

interface BSDCardsProps {
  bsds: CommonBsd[];
  columns: Column[];
}

export function BSDCards({ bsds, columns }: BSDCardsProps) {
  const location = useLocation();
  const { siret } = useParams<{ siret: string }>();

  return (
    <div className={styles.BSDCards}>
      {bsds.map(bsd => (
        <div key={bsd.id} className={styles.BSDCard}>
          <ul className={styles.BSDCardList}>
            {columns.map(column => {
              const Cell = column.Cell as React.ComponentType<
                CellProps<CommonBsd>
              >;
              console.log(bsd.type);
              return (
                <li key={column.id} className={styles.BSDCardListItem}>
                  <div className={styles.BSDCardListItemLabel}>
                    {column.Header}
                  </div>
                  <div className={styles.BSDCardListItemValue}>
                    <Cell
                      value={column.accessor!(bsd, 0, {
                        data: bsds,
                        depth: 0,
                        subRows: [],
                      })}
                      // @ts-ignore
                      row={{ original: bsd }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.BSDCardActions}>
            {!!bsd.type && (
              <Link
                to={{
                  pathname: generatePath(getViewRoute(bsd.type), {
                    siret,
                    id: bsd.id,
                  }),
                  state: { background: location },
                }}
                className="btn btn--outline-primary"
              >
                <IconView size="24px" style={{ marginRight: "1rem" }} />
                Aperçu
              </Link>
            )}
            {bsd.type === CommonBsdType.Bsdd ? (
              <WorkflowAction siret={siret} bsd={bsd} />
            ) : null}
            {bsd.type === CommonBsdType.Bsdasri ? (
              <BsdasriWorkflowAction siret={siret} bsd={bsd} />
            ) : null}
            {bsd.type === CommonBsdType.Bsff ? (
              <BsffWorkflowAction siret={siret} bsd={bsd} />
            ) : null}
            {bsd.type === CommonBsdType.Bsvhu ? (
              <BsvhuWorkflowAction siret={siret} bsd={bsd} />
            ) : null}
            {form.__typename === "Bsda" ? (
              <BsdaWorkflowAction siret={siret} form={form} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

const getViewRoute = (bsdTypename: CommonBsdType): string =>
  ({
    [CommonBsdType.Bsdd]: routes.dashboard.bsdds.view,
    [CommonBsdType.Bsdasri]: routes.dashboard.bsdasris.view,
    [CommonBsdType.Bsff]: routes.dashboard.bsffs.view,
    [CommonBsdType.Bsvhu]: routes.dashboard.bsvhus.view,
    [CommonBsdType.Bsda]: routes.dashboard.bsdas.view,
  }[bsdTypename]);

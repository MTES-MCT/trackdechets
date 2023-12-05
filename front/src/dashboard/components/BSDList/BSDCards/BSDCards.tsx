import * as React from "react";
import { Link, generatePath, useLocation, useParams } from "react-router-dom";
import { CellProps } from "react-table";
import {
  Bsd,
  EmitterType,
  Query,
  QueryCompanyPrivateInfosArgs
} from "codegen-ui";
import routes from "../../../../Apps/routes";
import { IconView } from "../../../../Apps/common/Components/Icons/Icons";
import { WorkflowAction } from "../BSDD/WorkflowAction";
import { WorkflowAction as BsdasriWorkflowAction } from "../BSDasri/WorkflowAction";
import { WorkflowAction as BsffWorkflowAction } from "../BSFF/WorkflowAction";
import { WorkflowAction as BsvhuWorkflowAction } from "../BSVhu/WorkflowAction";
import { WorkflowAction as BsdaWorkflowAction } from "../BSDa/WorkflowAction";
import { Column } from "../columns";
import styles from "./BSDCards.module.scss";
import { BsdTypename } from "../../../constants";
import { BsffFragment } from "../BSFF";
import { CardRoadControlButton } from "../RoadControlButton";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "../../../../Apps/common/queries/company/query";
import { useQuery } from "@apollo/client";
interface BSDCardsProps {
  bsds: Bsd[];
  columns: Column[];
}

export function BSDCards({ bsds, columns }: BSDCardsProps) {
  const location = useLocation();
  const { siret } = useParams<{ siret: string }>();

  const { data } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
    variables: { clue: siret! }
  });
  const siretsWithAutomaticSignature = data
    ? data.companyPrivateInfos.receivedSignatureAutomations.map(
        automation => automation.from.siret
      )
    : [];

  return (
    <div className={styles.BSDCards}>
      {bsds.map(form => (
        <div key={form.id} className={styles.BSDCard}>
          <ul className={styles.BSDCardList}>
            {columns.map(column => {
              const Cell = column.Cell as React.ComponentType<CellProps<Bsd>>;

              return (
                <li key={column.id} className={styles.BSDCardListItem}>
                  <div className={styles.BSDCardListItemLabel}>
                    {column.Header as string}
                  </div>
                  <div className={styles.BSDCardListItemValue}>
                    <Cell
                      value={column.accessor!(form, 0, {
                        data: bsds,
                        depth: 0,
                        subRows: []
                      })}
                      // @ts-ignore
                      row={{ original: form }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.BSDCardActions}>
            {!!form.__typename && (
              <>
                <Link
                  to={{
                    pathname: generatePath(getViewRoute(form.__typename), {
                      siret,
                      id: form.id
                    })
                  }}
                  state={{ background: location }}
                  className="btn btn--outline-primary"
                >
                  <IconView size="24px" style={{ marginRight: "1rem" }} />
                  Aperçu
                </Link>

                <CardRoadControlButton siret={siret} form={form} />
              </>
            )}
            {form.__typename === "Form" ? (
              <WorkflowAction
                siret={siret!}
                form={form}
                options={{
                  canSkipEmission:
                    form.emitter?.type === EmitterType.Appendix1Producer &&
                    (Boolean(form.ecoOrganisme?.siret) ||
                      siretsWithAutomaticSignature.includes(
                        form.emitter?.company?.siret
                      ) ||
                      Boolean(form.emitter?.isPrivateIndividual))
                }}
              />
            ) : null}
            {form.__typename === "Bsdasri" ? (
              <BsdasriWorkflowAction siret={siret!} form={form} />
            ) : null}
            {form.__typename === "Bsff" ? (
              <BsffWorkflowAction form={form as unknown as BsffFragment} />
            ) : null}
            {form.__typename === "Bsvhu" ? (
              <BsvhuWorkflowAction siret={siret!} form={form} />
            ) : null}
            {form.__typename === "Bsda" ? (
              <BsdaWorkflowAction siret={siret!} form={form} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

const getViewRoute = (bsdTypename: BsdTypename): string =>
  ({
    Form: routes.dashboard.bsdds.view,
    Bsdasri: routes.dashboard.bsdasris.view,
    Bsff: routes.dashboard.bsffs.view,
    Bsvhu: routes.dashboard.bsvhus.view,
    Bsda: routes.dashboard.bsdas.view
  }[bsdTypename]);

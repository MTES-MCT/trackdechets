import React from "react";

import MarkSegmentAsReadyToTakeOver from "./actions/MarkSegmentAsReadyToTakeOver";
import PrepareSegment from "./actions/PrepareSegment";
import TakeOverSegment from "./actions/TakeOverSegment";
import EditSegment from "./actions/EditSegment";
import Quicklook from "dashboard/slips/slips-actions/Quicklook";

import TransporterInfoEdit from "./actions/TransporterInfoEdit";
import TransportSignature from "./actions/TransportSignature";
import { useFormsTable } from "../slips/use-forms-table";

import styles from "./TransportCards.module.scss";
export const TransportCards = ({ forms, userSiret, refetchQuery }) => {
  const [sortedForms] = useFormsTable(forms);

  return (
    <ul className={styles.transportCards}>
      {sortedForms.map(form => (
        <li key={form.id} className={styles.transportCard}>
          <div className={styles.detailRow}>
            <dt>Bordereau</dt>
            <dd>{form.readableId}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Détenteur</dt>
            <dd>{form.stateSummary?.emitter?.name} </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Destinataire</dt>
            <dd>{form.stateSummary?.recipient?.name} </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Déchet</dt>
            <dd>
              {form.wasteDetails?.code} {form.wasteDetails?.name}
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Quantité</dt>
            <dd>{form.wasteDetails?.quantity} t</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Immat.</dt>
            <dd>{form.stateSummary?.transporterNumberPlate}</dd>
            <TransporterInfoEdit
              form={form}
              fieldName="numberPlate"
              verboseFieldName={"plaque d'immatriculation"}
              refetchQuery={refetchQuery}
            />
          </div>
          <div className={styles.detailRow}>
            <dt>Champ libre</dt>
            <dd>{form.stateSummary?.transporterCustomInfo}</dd>
            <TransporterInfoEdit
              form={form}
              fieldName="customInfo"
              verboseFieldName={"champ libre"}
              refetchQuery={refetchQuery}
            />
          </div>

          {!!form?.transportSegments?.length && (
            <div className={styles.detailRow}>
              <dt>Segment</dt>
              <dd>{form?.transportSegments?.length}</dd>
            </div>
          )}

          <div className={styles.cardActions}>
            <Quicklook
              formId={form.id}
              buttonClass={`btn btn--no-style ${styles.cardActionsButton}`}
            />
            <TransportSignature
              form={form}
              userSiret={userSiret}
             
            />
            <PrepareSegment form={form} userSiret={userSiret} />
            <MarkSegmentAsReadyToTakeOver form={form} userSiret={userSiret} />
            <EditSegment form={form} userSiret={userSiret} />
            <TakeOverSegment form={form} userSiret={userSiret} />
          </div>
        </li>
      ))}
    </ul>
  );
};

import React from "react";
import SortControl from "dashboard/slips/SortableTableHeader";

import MarkSegmentAsReadyToTakeOver from "./actions/MarkSegmentAsReadyToTakeOver";
import PrepareSegment from "./actions/PrepareSegment";
import TakeOverSegment from "./actions/TakeOverSegment";
import EditSegment from "./actions/EditSegment";

import DownloadPdf from "dashboard/slips/slips-actions/DownloadPdf";
import { useFormsTable } from "dashboard/slips/use-forms-table";

import TransporterInfoEdit from "./actions/TransporterInfoEdit";
import { TransportSignatureModalToggle } from "./actions/TransportSignatureModal";
import styles from "./TransportTable.module.scss";
import { Segments } from "./Segments";
import Shorten from "common/components/Shorten";
import Quicklook from "dashboard/slips/slips-actions/Quicklook";

export const TransportTable = ({ forms, userSiret, refetchQuery }) => {
  const [sortedForms, sortParams, sortBy, filter] = useFormsTable(forms);

  return (
    <table className="td-table transport-table">
      <thead>
        <tr className="td-table__head-tr">
          <SortControl
            sortFunc={sortBy}
            fieldName="readableId"
            caption="Numéro"
            sortParams={sortParams}
          />
          <SortControl
            sortFunc={sortBy}
            fieldName="emitter.company.name"
            caption="Emetteur"
            sortParams={sortParams}
          />
          <SortControl
            sortFunc={sortBy}
            fieldName="stateSummary.recipient.name"
            caption="Destinataire"
            sortParams={sortParams}
          />

          <th>Déchet</th>
          <th className={styles.hideOnMobile}>Quantité estimée</th>
          <th colSpan={2}>Champ libre</th>
          <th colSpan={2}>Plaque d'immatriculation</th>
          <th>Multimodal</th>
          <th>Action</th>
          <th></th>
        </tr>
        <tr className="td-table__head-tr td-table__tr">
          <th>
            <input
              type="text"
              className="td-input"
              onChange={e => filter("readableId", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th>
            <input
              type="text"
              className="td-input"
              onChange={e => filter("emitter.company.name", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th className={styles.hideOnMobile}>
            <input
              type="text"
              className="td-input"
              onChange={e =>
                filter("stateSummary.recipient.name", e.target.value)
              }
              placeholder="Filtrer..."
            />
          </th>
          <th>
            <input
              type="text"
              className="td-input"
              onChange={e => filter("wasteDetails.name", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th className={styles.hideOnMobile}></th>

          <th colSpan={7}></th>
        </tr>
      </thead>
      <tbody>
        {sortedForms.map(form => (
          <tr key={form.id} className="td-table__tr">
            <td>
              <div className={styles.readableId}>
                <DownloadPdf formId={form.id} />
                {form.readableId}
              </div>
            </td>
            <td>
              <Shorten content={form.stateSummary?.emitter?.name || ""} />
            </td>
            <td className={styles.hideOnMobile}>
              <Shorten content={form.stateSummary?.recipient?.name || ""} />
            </td>
            <td>
              <div>{form.wasteDetails?.name}</div>
            </td>
            <td className={styles.hideOnMobile}>
              {form.stateSummary?.quantity} tonnes
            </td>

            <td style={{ paddingRight: 0 }} className="tw-text-right">
              <TransporterInfoEdit
                form={form}
                fieldName="customInfo"
                verboseFieldName={"champ libre"}
                refetchQuery={refetchQuery}
              />
            </td>
            <td style={{ paddingLeft: 0 }}>
              {form.stateSummary?.transporterCustomInfo}
            </td>
            <td style={{ paddingRight: 0 }} className="tw-text-right">
              <TransporterInfoEdit
                form={form}
                fieldName="numberPlate"
                verboseFieldName={"plaque d'immatriculation"}
                refetchQuery={refetchQuery}
              />
            </td>
            <td style={{ paddingLeft: 0 }}>
              {form.stateSummary?.transporterNumberPlate}
            </td>

            <td>
              <Segments form={form} userSiret={userSiret} />
            </td>
            <td>
              <div className={styles.transportActions}>
                <TransportSignatureModalToggle form={form} />

                <EditSegment form={form} userSiret={userSiret} />

                <PrepareSegment form={form} userSiret={userSiret} />
                <MarkSegmentAsReadyToTakeOver
                  form={form}
                  userSiret={userSiret}
                />

                <TakeOverSegment form={form} userSiret={userSiret} />
              </div>
            </td>
            <td>
              <Quicklook
                formId={form.id}
                buttonClass={`btn--no-style ${styles.quicklook}`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

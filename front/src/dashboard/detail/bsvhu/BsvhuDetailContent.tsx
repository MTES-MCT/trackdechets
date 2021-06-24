import React from "react";
import QRCodeIcon from "react-qr-code";
import { Bsvhu } from "generated/graphql/types";
import { IconBSVhu } from "common/components/Icons";

import { statusLabels } from "../../constants";
import { DateRow } from "../common/Components";
import styles from "../common/BSDDetailContent.module.scss";

type Props = { form: Bsvhu };
export function BsvhuDetailContent({ form }: Props) {
  return (
    <div>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <IconBSVhu className="tw-mr-2" />
          <span className={styles.detailStatus}>
            [{form.isDraft ? "Brouillon" : statusLabels[form["bsdasriStatus"]]}]
          </span>
          {!form.isDraft && <span>{form.id}</span>}
        </h4>

        <div className={styles.detailContent}>
          <div className={`${styles.detailQRCodeIcon}`}>
            {!form.isDraft && (
              <div className={styles.detailQRCode}>
                <QRCodeIcon value={form.id} size={96} />
                <span>Ce QR code contient le numéro du bordereau </span>
              </div>
            )}
          </div>
          <div className={styles.detailGrid}>
            <DateRow
              value={form.updatedAt}
              label="Dernière action sur le BSD"
            />
            <dt>Code déchet</dt>
            <dd>{form.wasteCode}</dd>
            <dt>Nom Usuel</dt>
            <dd></dd>
          </div>

          <div className={styles.detailGrid}>
            <dt>Code onu</dt>
            <dd></dd>
          </div>
        </div>
      </div>
    </div>
  );
}

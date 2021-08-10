import * as React from "react";
import { Bsff } from "generated/graphql/types";
import styles from "./BsffWasteSummary.module.scss";

interface BsffWasteSummaryProps {
  bsff: Bsff;
}

export function BsffWasteSummary({ bsff }: BsffWasteSummaryProps) {
  return (
    <div className={styles.WasteSummary}>
      <div className={styles.WasteSummaryRow}>
        <div className={styles.WasteSummaryRowItem}>
          <div className={styles.WasteSummaryRowItemLabel}>Code déchet</div>
          <div className={styles.WasteSummaryRowItemContent}>
            {bsff.waste?.code}
          </div>
        </div>
        <div className={styles.WasteSummaryRowItem}>
          <div className={styles.WasteSummaryRowItemLabel}>
            Nature du fluide
          </div>
          <div className={styles.WasteSummaryRowItemContent}>
            {bsff.waste?.nature || "inconnue"}
          </div>
        </div>
        <div className={styles.WasteSummaryRowItem}>
          <div className={styles.WasteSummaryRowItemLabel}>
            Quantité de fluides
          </div>
          <div className={styles.WasteSummaryRowItemContent}>
            {bsff.quantity?.kilos} kilo(s){" "}
            {bsff.quantity?.isEstimate && <>(estimé(s))</>}
          </div>
        </div>
      </div>
      <div className={styles.WasteSummaryRow}>
        <div className={styles.WasteSummaryRowItem}>
          <div className={styles.WasteSummaryRowItemLabel}>Contenant(s)</div>
          <div className={styles.WasteSummaryRowItemContent}>
            {bsff.packagings
              .map(
                packaging =>
                  `${packaging.name} n°${packaging.numero} (${packaging.kilos} kilo(s))`
              )
              .join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
import { Bsff } from "generated/graphql/types";
import styles from "./BsffWasteSummary.module.scss";

interface BsffWasteSummaryProps {
  bsff: Bsff;
}

export function BsffWasteSummary({ bsff }: BsffWasteSummaryProps) {
  return (
    <div className={styles.WasteSummary}>
      <div className={styles.WasteSummaryItem}>
        <div className={styles.WasteSummaryItemLabel}>BSFF n°</div>
        <div className={styles.WasteSummaryItemContent}>{bsff.id}</div>
      </div>
      <div className={styles.WasteSummaryItem}>
        <div className={styles.WasteSummaryItemLabel}>Code déchet</div>
        <div className={styles.WasteSummaryItemContent}>{bsff.waste?.code}</div>
      </div>
      <div className={styles.WasteSummaryItem}>
        <div className={styles.WasteSummaryItemLabel}>Nature du fluide</div>
        <div className={styles.WasteSummaryItemContent}>
          {bsff.waste?.nature || "inconnue"}
        </div>
      </div>
      <div className={styles.WasteSummaryItem}>
        <div className={styles.WasteSummaryItemLabel}>Quantité de fluides</div>
        <div className={styles.WasteSummaryItemContent}>
          {bsff.quantity?.kilos} kilo(s){" "}
          {bsff.quantity?.isEstimate && <>(estimé(s))</>}
        </div>
      </div>
      <div className={styles.WasteSummaryItem}>
        <div className={styles.WasteSummaryItemLabel}>Contenant(s)</div>
        <div className={styles.WasteSummaryItemContent}>
          {bsff.packagings
            .map(
              packaging =>
                `${packaging.name} n°${packaging.numero} (${packaging.kilos} kilo(s))`
            )
            .join(", ")}
        </div>
      </div>
    </div>
  );
}

import { FieldProps } from "formik";
import React from "react";
import { PROCESSING_OPERATIONS } from "@td/constants";
import styles from "./ProcessingOperation.module.scss";
import classNames from "classnames";
import ProcessingOperationSelect from "../../../../common/components/ProcessingOperationSelect";
export default function ProcessingOperation({
  field: { value, name, onChange },
  enableReuse = false,
  disabled
}: FieldProps & { enableReuse?: boolean; disabled?: boolean }) {
  const operationDetail = PROCESSING_OPERATIONS.find(
    operation => operation.code === value
  );

  return (
    <div className="ProcessingOperation">
      <div className={styles.processingOperationTextQuote}>
        <p>
          Vous hésitez sur le type d'opération à choisir ? Vous pouvez consulter
          la liste de traitement des déchets sur{" "}
          <a
            href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000026902174/"
            target="_blank"
            className="fr-link force-external-link-content force-underline-link"
            rel="noopener noreferrer"
          >
            le site legifrance.
          </a>
        </p>
      </div>
      <ProcessingOperationSelect
        field={{ value: value, name: name, onChange: onChange, enableReuse }}
        disabled={disabled}
      />

      {operationDetail && ["D 9 F"].includes(operationDetail.code) && (
        <p className="fr-mt-2v fr-info-text">Pour un traitement final</p>
      )}

      {operationDetail != null && (
        <div
          className={classNames(
            "notification",
            "notification--success",
            styles.processingOperationNotification
          )}
        >
          Vous avez sélectionné l'opération suivante :{" "}
          <em>{operationDetail.description}</em>
        </div>
      )}
    </div>
  );
}

import React from "react";
import classNames from "classnames";
import {
  PROCESSING_OPERATIONS,
  PROCESSING_AND_REUSE_OPERATIONS
} from "shared/constants";
import styles from "./ProcessingOperationSelect.module.scss";

const ProcessingOperationSelect = ({
  field: { value, name, onChange, enableReuse = false },
  disabled
}) => {
  const operations = enableReuse
    ? PROCESSING_AND_REUSE_OPERATIONS
    : PROCESSING_OPERATIONS;

  return (
    <>
      <label>Opération d’élimination / valorisation prévue (code D/R)</label>
      <select
        id="select"
        name={name}
        value={value}
        onChange={onChange}
        className={classNames("td-select", styles.processingOperationSelect)}
        disabled={disabled}
      >
        <option value="">Choisissez...</option>
        {operations.map(operation => (
          <option
            key={operation.code}
            value={operation.code}
            className={styles.processingOperationOption}
          >
            {operation.code} - {operation.description}
          </option>
        ))}
      </select>
    </>
  );
};
export default ProcessingOperationSelect;

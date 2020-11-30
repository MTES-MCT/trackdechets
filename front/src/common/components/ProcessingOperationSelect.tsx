import React from "react";
import classNames from "classnames";
import { PROCESSING_OPERATIONS } from "generated/constants";
import styles from "./ProcessingOperationSelect.module.scss";

const ProcessingOperationSelect = ({ field: { value, name, onChange } }) => (
  <>
    <label>Opération d’élimination / valorisation prévue (code D/R)</label>
    <select
      id="select"
      name={name}
      value={value}
      onChange={onChange}
      className={classNames("td-select", styles.processingOperationSelect)}
    >
      <option value="">Choisissez...</option>
      {PROCESSING_OPERATIONS.map(operation => (
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
export default ProcessingOperationSelect;

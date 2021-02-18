import { Field } from "formik";
import React from "react";
import CompanySelector from "form/company/CompanySelector";
import styles from "./TemporaryStorage.module.scss";
import classNames from "classnames";
import ProcessingOperationSelect from "common/components/ProcessingOperationSelect";

export default function TemporaryStorage(props) {
  return (
    <>
      <h4 className="form__section-heading">
        Installation de destination prévue
      </h4>
      <CompanySelector
        name={
          `${props.name}.destination.company` as "temporaryStorageDetail.destination.company"
        }
      />

      <div className="form__row">
        <label>
          Numéro de CAP (le cas échéant)
          <Field
            type="text"
            name={`${props.name}.destination.cap`}
            className={classNames("td-input", styles.tempStorageCap)}
          />
        </label>
      </div>

      <div className="form__row">
        <Field
          component={ProcessingOperationSelect}
          name={`${props.name}.destination.processingOperation`}
        />
      </div>
    </>
  );
}

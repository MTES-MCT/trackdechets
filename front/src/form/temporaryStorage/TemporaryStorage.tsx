import { useFormikContext, Field } from "formik";
import React, { useEffect } from "react";
import CompanySelector from "form/company/CompanySelector";
import { Form } from "generated/graphql/types";
import initialState from "../initial-state";
import styles from "./TemporaryStorage.module.scss";
import classNames from "classnames";
import ProcessingOperationSelect from "common/components/ProcessingOperationSelect";

export default function TemporaryStorage(props) {
  const { values, setFieldValue } = useFormikContext<Form>();

  useEffect(() => {
    if (values.recipient?.isTempStorage && !values.temporaryStorageDetail) {
      setFieldValue(
        "temporaryStorageDetail",
        initialState.temporaryStorageDetail
      );
    }

    if (
      values.recipient?.processingOperation &&
      values.temporaryStorageDetail &&
      !values.temporaryStorageDetail.destination?.processingOperation
    ) {
      setFieldValue(
        "temporaryStorageDetail.destination.processingOperation",
        values.recipient.processingOperation
      );
    }
  }, [values, setFieldValue]);

  if (!values.recipient?.isTempStorage || !values.temporaryStorageDetail) {
    return null;
  }

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

import { Field } from "formik";
import React from "react";
import CompanySelector from "../../../common/components/company/CompanySelector";
import styles from "./TemporaryStorage.module.scss";
import classNames from "classnames";
import ProcessingOperationSelect from "../../../../common/components/ProcessingOperationSelect";
import TdTooltip from "../../../../common/components/Tooltip";

export default function TemporaryStorage(props) {
  const tooltipMsg =
    "Permet de donner une consigne particulière concernant" +
    " le lieu de transformation ou de traitement du déchet," +
    " après la phase intermédiaire d’entreposage provisoire ou de reconditionnement.";
  return (
    <>
      <h4 className="form__section-heading">
        Installation de destination prévue <TdTooltip msg={tooltipMsg} />
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

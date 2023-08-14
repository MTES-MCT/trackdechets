import CompanySelector from "form/common/components/company/CompanySelector";

import { Field } from "formik";
import React from "react";
import { BsdasriStatus } from "generated/graphql/types";

import Reception from "./Reception";
import Operation from "./Operation";
import { FillFieldsInfo, DisabledFieldsInfo } from "../utils/commons";

import classNames from "classnames";
import Tooltip from "common/components/Tooltip";
import { customInfoToolTip } from "./Emitter";

export default function Destination({ status, stepName, disabled = false }) {
  const receptionDisabled = disabled || BsdasriStatus.Received === status;

  const operationEmphasis = stepName === "operation";
  const receptionEmphasis = stepName === "reception";

  return (
    <>
      {(operationEmphasis || receptionEmphasis) && <FillFieldsInfo />}
      {receptionDisabled && <DisabledFieldsInfo />}
      <div
        className={classNames("form__row", {
          "field-emphasis": receptionEmphasis,
        })}
      >
        <CompanySelector
          name="destination.company"
          heading="Installation destinataire"
          disabled={receptionDisabled}
          registeredOnlyCompanies={true}
          optionalMail={true}
        />
      </div>
      <div className="form__row">
        <label>
          Champ libre (optionnel) <Tooltip msg={customInfoToolTip} />
          <Field
            component="textarea"
            name="destination.customInfo"
            className="td-textarea"
            disabled={receptionDisabled}
          />
        </label>
      </div>
      <h4 className="form__section-heading">Réception du déchet</h4>
      <Reception status={status} disabled={disabled} />
      <h4 className="form__section-heading">Traitement du déchet</h4>

      <Operation status={status} disabled={disabled} />

      <h4 className="form__section-heading">Traitement du déchet</h4>
    </>
  );
}

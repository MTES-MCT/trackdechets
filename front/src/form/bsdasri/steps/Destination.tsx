import CompanySelector from "../../common/components/company/CompanySelector";

import { Field, useFormikContext } from "formik";
import React from "react";
import { Bsdasri, BsdasriStatus, BsdasriType, BsdType } from "@td/codegen-ui";

import Reception from "./Reception";
import Operation from "./Operation";
import { FillFieldsInfo, DisabledFieldsInfo } from "../utils/commons";

import classNames from "classnames";
import Tooltip from "../../../Apps/common/Components/Tooltip/Tooltip";
import { customInfoToolTip } from "./Emitter";
import FormikBroker from "../../../Apps/Forms/Components/Broker/FormikBroker";
import FormikTrader from "../../../Apps/Forms/Components/Trader/FormikTrader";
import FormikIntermediaryList from "../../../Apps/Forms/Components/IntermediaryList/FormikIntermediaryList";
import { useParams } from "react-router-dom";

export default function Destination({ status, stepName, disabled = false }) {
  const { siret } = useParams<{ siret: string }>();
  const { values } = useFormikContext<Bsdasri>();

  const isSynthesizing = values.type === BsdasriType.Synthesis;
  const receptionDisabled = disabled || BsdasriStatus.Received === status;

  const operationEmphasis = stepName === "operation";
  const receptionEmphasis = stepName === "reception";

  return (
    <>
      {(operationEmphasis || receptionEmphasis) && <FillFieldsInfo />}
      {receptionDisabled && <DisabledFieldsInfo />}
      <div
        className={classNames("form__row", {
          "field-emphasis": receptionEmphasis
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
          Champ libre (optionnel) <Tooltip title={customInfoToolTip} />
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
      {!isSynthesizing && (
        <>
          <h4 className="form__section-heading">Autres acteurs</h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <FormikBroker
              bsdType={BsdType.Bsdasri}
              siret={siret}
              disabled={disabled}
            />

            <FormikTrader
              bsdType={BsdType.Bsdasri}
              siret={siret}
              disabled={disabled}
            />
            <FormikIntermediaryList siret={siret} disabled={disabled} />
          </div>
        </>
      )}
    </>
  );
}

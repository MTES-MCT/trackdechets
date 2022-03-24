import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import { BsdasriStatus, Bsdasri } from "generated/graphql/types";
import React from "react";
import initialState from "../utils/initial-state";

import { FillFieldsInfo, DisabledFieldsInfo } from "../utils/commons";
import classNames from "classnames";
import Transport from "./Transport";
/**
 *
 * Tweaked Transporter component where takeover fields can be displayed on demand
 * This is useful to edit these fields for direct takeover, as they're usually hidden as long as the dasri is not SIGNED_BY_TRANPORTER
 */
export function TransporterShowingTakeOverFields({ status, stepName }) {
  return (
    <BaseTransporter
      status={status}
      displayTakeoverFields={true}
      stepName={stepName}
    />
  );
}

export default function Transporter({ status, stepName }) {
  return <BaseTransporter status={status} stepName={stepName} />;
}
function BaseTransporter({ status, displayTakeoverFields = false, stepName }) {
  const { setFieldValue } = useFormikContext<Bsdasri>();
  // handedOverAt is editable even after dasri reception
  const showHandedOverAtField = [
    BsdasriStatus.Sent,
    BsdasriStatus.Received,
  ].includes(status);

  const disabled = [BsdasriStatus.Sent, BsdasriStatus.Received].includes(
    status
  );

  const transportEmphasis = stepName === "transport";
  return (
    <>
      {transportEmphasis && <FillFieldsInfo />}
      {disabled && <DisabledFieldsInfo />}
      <div
        className={classNames("form__row", {
          "field-emphasis": transportEmphasis,
        })}
      >
        <CompanySelector
          disabled={disabled}
          name="transporter.company"
          heading="Entreprise de transport"
          optionalMail={true}
          allowForeignCompanies={true}
          registeredOnlyCompanies={true}
          onCompanySelected={transporter => {
            if (transporter.transporterReceipt) {
              setFieldValue(
                "transporter.recepisse.number",
                transporter.transporterReceipt.receiptNumber
              );
              setFieldValue(
                "transporter.recepisse.validityLimit",
                transporter.transporterReceipt.validityLimit
              );
              setFieldValue(
                "transporter.recepisse.department",
                transporter.transporterReceipt.department
              );
            } else {
              setFieldValue("transporter.recepisse.number", "");
              setFieldValue(
                "transporter.recepisse.validityLimit",
                initialState().transporter.recepisse.validityLimit
              );
            
              setFieldValue("transporter.recepisse.department", "");
            }
          }}
        />
      </div>

      {showHandedOverAtField ? (
        <div
          className={classNames("form__row", {
            "field-emphasis": transportEmphasis,
          })}
        >
          <label>
            Date de remise à l'installation destinataire (optionnel)
            <div className="td-date-wrapper">
              <Field
                name="transporter.transport.handedOverAt"
                component={DateInput}
                className="td-input"
              />
            </div>
          </label>
        </div>
      ) : (
        <p className="tw-mt-2">
          La date de remise à l'installation destinataire sera éditable après
          l'emport du déchet
        </p>
      )}
      <Transport status={status} />
    </>
  );
}

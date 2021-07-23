import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import { BsdasriStatus } from "generated/graphql/types";
import React from "react";
import Acceptation from "form/bsdasri/components/acceptation/Acceptation";
import Packagings from "./components/packagings/Packagings";
import { getInitialQuantityFn } from "./utils/initial-state";
import { transportModeLabels } from "dashboard/constants";
import { FillFieldsInfo, DisabledFieldsInfo } from "./utils/commons";
import classNames from "classnames";

import QuantityWidget from "./components/Quantity";

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
  const { setFieldValue } = useFormikContext();

  // it's pointless to show transport fields until form is signed by producer
  const showTransportFields =
    [
      BsdasriStatus.SignedByProducer,
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
    ].includes(status) || displayTakeoverFields;
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
          onCompanySelected={transporter => {
            if (transporter.transporterReceipt) {
              setFieldValue(
                "transporter.receipt",
                transporter.transporterReceipt.receiptNumber
              );
              setFieldValue(
                "transporter.receiptValidityLimit",
                transporter.transporterReceipt.validityLimit
              );
              setFieldValue(
                "transporter.receiptDepartment",
                transporter.transporterReceipt.department
              );
            } else {
              setFieldValue("transporter.receipt", "");
              setFieldValue("transporter.receiptValidityLimit", null);
              setFieldValue("transporter.receiptDepartment", "");
            }
          }}
        />
      </div>
      <div className="form__row">
        <label>
          Champ libre (optionnel)
          <Field
            component="textarea"
            name="transporter.customInfo"
            className="td-textarea"
            disabled={disabled}
          />
        </label>
      </div>
      <h4 className="form__section-heading">Autorisations</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": transportEmphasis,
        })}
      >
        <label>
          Numéro de récépissé
          <Field
            type="text"
            name="transporter.receipt"
            className="td-input"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="transporter.receipt" />
      </div>
      <div
        className={classNames("form__row", {
          "field-emphasis": transportEmphasis,
        })}
      >
        <label>
          Département
          <Field
            type="text"
            name="transporter.receiptDepartment"
            placeholder="Ex: 83"
            className="td-input td-department"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="transporter.receiptDepartment" />
      </div>
      <div
        className={classNames("form__row", {
          "field-emphasis": transportEmphasis,
        })}
      >
        <label>
          Limite de validité
          <div className="td-date-wrapper">
            <Field
              component={DateInput}
              name="transporter.receiptValidityLimit"
              className="td-input td-date"
              disabled={disabled}
            />
          </div>
        </label>

        <RedErrorMessage name="transporter.receiptValidityLimit" />
      </div>
      <h4 className="form__section-heading">Transport du déchet</h4>
      {showTransportFields ? (
        <>
          <div className="form__row">
            <label>Mode de transport</label>
            <Field
              as="select"
              name="transport.mode"
              id="id_mode"
              className="td-select"
              disabled={disabled}
            >
              {Object.entries(transportModeLabels).map(([k, v]) => (
                <option value={`${k}`} key={k}>
                  {v}
                </option>
              ))}
            </Field>
          </div>
          <div
            className={classNames("form__row", {
              "field-emphasis": transportEmphasis,
            })}
          >
            <Field
              name="transport.wasteAcceptation"
              component={Acceptation}
              disabled={disabled}
            />
          </div>
          <div
            className={classNames("form__row", {
              "field-emphasis": transportEmphasis,
            })}
          >
            <label>
              Date de prise en charge
              <div className="td-date-wrapper">
                <Field
                  name="transport.takenOverAt"
                  component={DateInput}
                  className="td-input"
                  disabled={disabled}
                />
              </div>
            </label>
          </div>
          <div
            className={classNames("form__row", {
              "field-emphasis": transportEmphasis,
            })}
          >
            <Field
              name="transport.wasteDetails.packagingInfos"
              component={Packagings}
              disabled={disabled}
            />
          </div>
          <h4 className="form__section-heading">Quantité transportée</h4>

          <QuantityWidget
            disabled={disabled}
            switchLabel="Je souhaite ajouter une quantité"
            dasriSection="transport"
            getInitialQuantityFn={getInitialQuantityFn}
          />
        </>
      ) : (
        <p>
          Cette section sera disponible quand le bordereau aura été signé par le
          producteur
        </p>
      )}
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
                name="transport.handedOverAt"
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
    </>
  );
}

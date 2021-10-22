import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import { BsdasriStatus, Bsdasri } from "generated/graphql/types";
import React from "react";
import Acceptation from "form/bsdasri/components/acceptation/Acceptation";
import Packagings from "./components/packagings/Packagings";
import { getInitialWeightFn } from "./utils/initial-state";
import { transportModeLabels } from "dashboard/constants";
import { FillFieldsInfo, DisabledFieldsInfo } from "./utils/commons";
import classNames from "classnames";
import Tooltip from "common/components/Tooltip";
import TagsInput from "common/components/tags-input/TagsInput";
import WeightWidget from "./components/Weight";

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
  const { values, setFieldValue } = useFormikContext<Bsdasri>();
  // handedOverAt is editable even after dasri reception
  const showHandedOverAtField = [
    BsdasriStatus.Sent,
    BsdasriStatus.Received,
  ].includes(status);

  const disabled = [BsdasriStatus.Sent, BsdasriStatus.Received].includes(
    status
  );

  const showTransportePlates = values?.transporter?.transport?.mode === "ROAD";

  function handleTransportMode(e) {
    setFieldValue("transporter.transport.mode", e.target.value, false);
    if (e.target.value !== "ROAD") {
      setFieldValue("transporter.transport.plates", [], false);
    }
  }

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
              setFieldValue("transporter.recepisse.validityLimit", null);
              setFieldValue("transporter.recepisse.department", "");
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
            name="transporter.recepisse.number"
            className="td-input"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="transporter.recepisse.number" />
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
            name="transporter.recepisse.department"
            placeholder="Ex: 83"
            className="td-input td-department"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="transporter.recepisse.department" />
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
              name="transporter.recepisse.validityLimit"
              className="td-input td-date"
              disabled={disabled}
            />
          </div>
        </label>

        <RedErrorMessage name="transporter.recepisse.validityLimit" />
      </div>
      <h4 className="form__section-heading">Transport du déchet</h4>

      <div className="form__row">
        <label>Mode de transport</label>
        <Field
          as="select"
          name="transporter.transport.mode"
          id="id_mode"
          className="td-select"
          disabled={disabled}
          onChange={e => handleTransportMode(e)}
        >
          {Object.entries(transportModeLabels).map(([k, v]) => (
            <option value={`${k}`} key={k}>
              {v}
            </option>
          ))}
        </Field>
      </div>
      {showTransportePlates && (
        <div className="form__row">
          <label>
            Immatriculations
            <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> pour valider chacun" />
            <TagsInput
              name="transporter.transport.plates"
              disabled={disabled}
            />
          </label>
        </div>
      )}
      <div
        className={classNames("form__row", {
          "field-emphasis": transportEmphasis,
        })}
      >
        <Field
          name="transporter.transport.acceptation"
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
              name="transporter.transport.takenOverAt"
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
          name="transporter.transport.packagings"
          component={Packagings}
          disabled={disabled}
        />
      </div>
      <h4 className="form__section-heading">Quantité transportée</h4>

      <WeightWidget
        disabled={disabled}
        switchLabel="Je souhaite ajouter une quantité"
        dasriPath="transporter.transport"
        getInitialWeightFn={getInitialWeightFn}
      />

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
    </>
  );
}

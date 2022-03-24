import React from "react";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Field, useFormikContext } from "formik";
import Tooltip from "common/components/Tooltip";
import TagsInput from "common/components/tags-input/TagsInput";
import WeightWidget from "../components/Weight";
import { FieldTransportModeSelect } from "common/components";
import Packagings from "../components/packagings/Packagings";
import { getInitialWeightFn } from "../utils/initial-state";
import classNames from "classnames";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { BsdasriStatus, Bsdasri, BsdasriType } from "generated/graphql/types";
import Acceptation, {
  AcceptOnlyField,
} from "form/bsdasri/components/acceptation/Acceptation";

export default function Transport({ status, editionDisabled = false }) {
  function handleTransportMode(e) {
    setFieldValue("transporter.transport.mode", e.target.value, false);
    if (e.target.value !== "ROAD") {
      setFieldValue("transporter.transport.plates", [], false);
    }
  }
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const showTransportFields = status === BsdasriStatus.SignedByProducer;

  const showTransportePlates = values?.transporter?.transport?.mode === "ROAD";

  const transportEmphasis = false;
  const AcceptationComponent =
    values.type === BsdasriType.Synthesis ? AcceptOnlyField : Acceptation;

  const disabled =
    editionDisabled ||
    [BsdasriStatus.Sent, BsdasriStatus.Received].includes(status);
  return (
    <>
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
          id="id_mode"
          name="transporter.transport.mode"
          component={FieldTransportModeSelect}
          disabled={disabled}
          onChange={e => handleTransportMode(e)}
        ></Field>
      </div>{" "}
      {showTransportePlates && (
        <div className="form__row">
          <label>
            Immatriculations
            <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
            <TagsInput
              name="transporter.transport.plates"
              disabled={disabled}
            />
          </label>
        </div>
      )}
      {showTransportFields && (
        <>
          <div
            className={classNames("form__row", {
              "field-emphasis": transportEmphasis,
            })}
          >
            <Field
              name="transporter.transport.acceptation"
              component={AcceptationComponent}
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
        </>
      )}
      <div className="form__row">
        <label>
          Numéros de containers
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
          <TagsInput name="identification.numbers" disabled={disabled} />
        </label>
      </div>
    </>
  );
}

import { Field, useFormikContext } from "formik";
import React, { lazy } from "react";
import classNames from "classnames";
import RedErrorMessage from "common/components/RedErrorMessage";
import Tooltip from "common/components/Tooltip";
import WeightWidget from "../components/Weight";
import { FieldTransportModeSelect } from "common/components";
import Packagings from "../components/packagings/Packagings";
import { getInitialWeightFn } from "../utils/initial-state";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { BsdasriStatus, Bsdasri, BsdasriType } from "generated/graphql/types";
import Acceptation from "form/bsdasri/components/acceptation/Acceptation";
import { customInfoToolTip } from "./Emitter";
import { isForeignVat } from "generated/constants/companySearchHelpers";
const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));

export default function Transport({ status, editionDisabled = false }) {
  function handleTransportMode(e) {
    setFieldValue("transporter.transport.mode", e.target.value, false);
    if (e.target.value !== "ROAD") {
      setFieldValue("transporter.transport.plates", [], false);
    }
  }
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const showTransportFields =
    [
      BsdasriStatus.SignedByProducer,
      BsdasriStatus.Sent,
      BsdasriStatus.Processed,
      BsdasriStatus.Refused,
    ].includes(status) || values.type === BsdasriType.Synthesis;

  const showTransportePlates = values?.transporter?.transport?.mode === "ROAD";

  const transportEmphasis = false;

  const disabled =
    editionDisabled ||
    [BsdasriStatus.Sent, BsdasriStatus.Received].includes(status);
  return (
    <>
      <div className="form__row">
        <label>
          Champ libre (optionnel){" "}
          <Tooltip msg="Informations internes. N'apparaît pas sur le bordereau." />
          <Field
            component="textarea"
            name="transporter.customInfo"
            className="td-textarea"
            disabled={disabled}
          />
        </label>
      </div>
      {!isForeignVat(
        values.transporter?.company?.vatNumber!!,
        values.transporter?.company?.address!!
      )  && (
        <>
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
        </>
      )}
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
            <Tooltip msg={customInfoToolTip} />
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
            {values.type !== BsdasriType.Synthesis && (
              <Field
                name="transporter.transport.acceptation"
                component={Acceptation}
                disabled={disabled}
              />
            )}
          </div>
          <div
            className={classNames("form__row", {
              "field-emphasis": transportEmphasis,
            })}
          >
            <label className="tw-font-semibold">
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
          {values.type !== BsdasriType.Synthesis && (
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
          )}
          <h4 className="form__section-heading">Quantité transportée</h4>
          <WeightWidget
            disabled={disabled}
            switchLabel="Je souhaite préciser le poids"
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

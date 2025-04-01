import { Field, useFormikContext } from "formik";
import React, { lazy } from "react";
import classNames from "classnames";
import Tooltip from "../../../Apps/common/Components/Tooltip/Tooltip";
import WeightWidget from "../components/Weight";
import { FieldTransportModeSelect } from "../../../common/components";
import Packagings from "../components/packagings/Packagings";
import { getInitialWeightFn } from "../utils/initial-state";
import DateInput from "../../common/components/custom-inputs/DateInput";
import { BsdasriStatus, Bsdasri, BsdasriType } from "@td/codegen-ui";
import Acceptation from "../components/acceptation/Acceptation";
import { customInfoToolTip } from "./Emitter";
import { subMonths } from "date-fns";
const TagsInput = lazy(
  () => import("../../../common/components/tags-input/TagsInput")
);

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
      BsdasriStatus.Refused
    ].includes(status) || values.type === BsdasriType.Synthesis;

  const showTransportePlates = values?.transporter?.transport?.mode === "ROAD";

  const transportEmphasis = false;

  const TODAY = new Date();

  const disabled =
    editionDisabled ||
    [BsdasriStatus.Sent, BsdasriStatus.Received].includes(status);
  return (
    <>
      <div className="form__row">
        <label>
          Champ libre (optionnel){" "}
          <Tooltip title="Informations internes. N'apparaît pas sur le bordereau." />
          <Field
            component="textarea"
            name="transporter.customInfo"
            className="td-textarea"
            disabled={disabled}
          />
        </label>
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
          <label htmlFor="transporter.transport.plates">
            Immatriculations <Tooltip title={customInfoToolTip} />
          </label>
          <TagsInput
            name="transporter.transport.plates"
            disabled={disabled}
            limit={2}
          />
        </div>
      )}
      {showTransportFields && (
        <>
          <div
            className={classNames("form__row", {
              "field-emphasis": transportEmphasis
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
              "field-emphasis": transportEmphasis
            })}
          >
            <label>
              Date de prise en charge
              <div className="td-date-wrapper">
                <Field
                  name="transporter.transport.takenOverAt"
                  component={DateInput}
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  className="td-input"
                  disabled={disabled}
                />
              </div>
            </label>
          </div>
          {values.type !== BsdasriType.Synthesis && (
            <div
              className={classNames("form__row", {
                "field-emphasis": transportEmphasis
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
        <label htmlFor="identification.numbers">
          Numéros de contenants{" "}
          <Tooltip title="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
        </label>
        <TagsInput name="identification.numbers" disabled={disabled} />
      </div>
    </>
  );
}

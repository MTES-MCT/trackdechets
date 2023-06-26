import React, { lazy } from "react";
import { Field } from "formik";
import { FieldTransportModeSelect } from "common/components";
import Tooltip from "common/components/Tooltip";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));

type Props = { disabled: boolean };

export function Transport({ disabled }: Props) {
  const TODAY = new Date();

  return (
    <>
      <h4 className="form__section-heading">Détails</h4>
      <div className="form__row">
        <label>
          Mode de transport:
          <Field
            id="id_mode"
            name="transporter.transport.mode"
            component={FieldTransportModeSelect}
            disabled={disabled}
          ></Field>
        </label>
      </div>

      <div className="form__row">
        <label>
          Immatriculations
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
          <TagsInput
            name="transporter.transport.plates"
            disabled={disabled}
            limit={2}
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Date de prise en charge
          <Field
            component={DateInput}
            name="transporter.transport.takenOverAt"
            className={`td-input td-input--small`}
            disabled={disabled}
            minDate={subMonths(TODAY, 2)}
            maxDate={TODAY}
            required
          />
        </label>
      </div>
    </>
  );
}

import React from "react";
import { Field } from "formik";
import { FieldTransportModeSelect } from "../../../../common/components";
import Tooltip from "../../../../Apps/common/Components/Tooltip/Tooltip";
import DateInput from "../../../common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";
import TagsInput from "../../../../common/components/tags-input/TagsInput";

type Props = { disabled: boolean; required?: boolean };

export function Transport({ disabled, required = false }: Props) {
  const TODAY = new Date();

  return (
    <>
      <h4 className="form__section-heading">Détails</h4>
      <div className="form__row">
        <label>
          Mode de transport:
          <Field
            id="id_mode"
            name="transport.mode"
            component={FieldTransportModeSelect}
            disabled={disabled}
          ></Field>
        </label>
      </div>

      <div className="form__row">
        <label htmlFor="transport.plates">
          Immatriculations
          <Tooltip
            className="fr-ml-1w"
            title="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun"
          />
        </label>
        <TagsInput name="transport.plates" disabled={disabled} limit={2} />
      </div>

      <div className="form__row">
        <label>
          Date de prise en charge
          <Field
            component={DateInput}
            name="transport.takenOverAt"
            className={`td-input td-input--small`}
            disabled={disabled}
            minDate={subMonths(TODAY, 2)}
            maxDate={TODAY}
            required={required}
          />
        </label>
      </div>
    </>
  );
}

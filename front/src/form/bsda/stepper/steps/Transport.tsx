import React, { lazy } from "react";
import { Field, useFormikContext } from "formik";
import { FieldTransportModeSelect } from "common/components";
import TdSwitch from "common/components/Switch";
import Tooltip from "common/components/Tooltip";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { isForeignVat } from "generated/constants/companySearchHelpers";
import { Bsda } from "generated/graphql/types";

const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));

type Props = { disabled: boolean };

export function Transport({ disabled }: Props) {
  const { setFieldValue, values } = useFormikContext<Bsda>();

  return (
    <>
      {!isForeignVat(values.transporter?.company?.vatNumber!) && (
        <>
          <h4 className="form__section-heading">
            Exemption de récépissé de déclaration de transport de déchets
          </h4>
          <div className="form__row">
            <TdSwitch
              checked={!!values.transporter?.recepisse?.isExempted}
              onChange={checked =>
                setFieldValue("transporter.recepisse.isExempted", checked)
              }
              disabled={disabled}
              label="Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'article R.541-50 du code de l'environnement."
            />
          </div>
        </>
      )}
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
          />
        </label>
      </div>
    </>
  );
}

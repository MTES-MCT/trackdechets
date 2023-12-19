import React, { lazy } from "react";
import { FieldTransportModeSelect, Switch } from "../../common/components";
import TdTooltip from "../../common/components/Tooltip";
import CompanySelector from "../common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import { Bsff } from "@td/codegen-ui";
import { isForeignVat } from "shared/constants";
const TagsInput = lazy(
  () => import("../../common/components/tags-input/TagsInput")
);

export default function Transporter({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsff>();

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <CompanySelector
        disabled={disabled}
        name="transporter.company"
        heading="Entreprise de transport"
        allowForeignCompanies={true}
        registeredOnlyCompanies={true}
      />

      {!isForeignVat(values?.transporter?.company?.vatNumber!) && (
        <>
          <h4 className="form__section-heading">
            Exemption de récépissé de déclaration de transport de déchets
          </h4>
          <div className="form__row">
            <Switch
              checked={values.transporter?.recepisse?.isExempted === true}
              onChange={checked => {
                setFieldValue("transporter.recepisse.isExempted", checked);
              }}
              label="Le transporteur déclare être exempté de récépissé conformément
                      aux dispositions de l'article R.541-50 du code de
                      l'environnement."
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
        <label htmlFor="transporter.transport.plates">
          Immatriculations
          <TdTooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
        </label>
        <TagsInput
          name="transporter.transport.plates"
          disabled={disabled}
          limit={2}
        />
      </div>
    </>
  );
}

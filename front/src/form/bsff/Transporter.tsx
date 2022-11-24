import React, { lazy } from "react";
import { FieldTransportModeSelect, Switch } from "common/components";
import RedErrorMessage from "common/components/RedErrorMessage";
import TdTooltip from "common/components/Tooltip";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useField, useFormikContext } from "formik";
import { Bsff } from "generated/graphql/types";
import styles from "./Transporter.module.scss";
import initialState from "./utils/initial-state";
import { isForeignVat } from "generated/constants/companySearchHelpers";
const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));

export default function Transporter({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsff>();

  const [{ value: isExemptedOfRecepisse }, ,] = useField<boolean>(
    "transporter.isExemptedOfRecepisse"
  );

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
        onCompanySelected={transporter => {
          if (transporter.transporterReceipt) {
            setFieldValue("transporter.recepisse", {
              number: transporter.transporterReceipt.receiptNumber,
              validityLimit: transporter.transporterReceipt.validityLimit,
              department: transporter.transporterReceipt.department,
            });
          } else {
            setFieldValue(
              "transporter.recepisse",
              initialState.transporter.recepisse
            );
          }
        }}
      />

      {!isForeignVat(values?.transporter?.company?.vatNumber!!) && (
        <>
          <h4 className="form__section-heading">
            Récépissé de déclaration de transport de déchets
          </h4>
          <div className="form__row">
            <Switch
              checked={isExemptedOfRecepisse}
              onChange={checked => {
                setFieldValue("transporter.isExemptedOfRecepisse", checked);
                setFieldValue(
                  "transporter.recepisse",
                  initialState.transporter.recepisse
                );
              }}
              label="Le transporteur déclare être exempté de récépissé conformément aux dispositions de l'article R.541-50 du code de l'environnement."
            />
          </div>
          {!isExemptedOfRecepisse && (
            <div className="form__row">
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

              <label>
                Département
                <Field
                  type="text"
                  name="transporter.recepisse.department"
                  placeholder="Ex: 83"
                  className={`td-input ${styles.transporterDepartment}`}
                  disabled={disabled}
                />
              </label>

              <RedErrorMessage name="transporter.recepisse.department" />

              <label>
                Limite de validité
                <Field
                  component={DateInput}
                  name="transporter.recepisse.validityLimit"
                  className={`td-input ${styles.transporterValidityLimit}`}
                  disabled={disabled}
                />
              </label>

              <RedErrorMessage name="transporter.recepisse.validityLimit" />
            </div>
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
              <TdTooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
              <TagsInput
                name="transporter.transport.plates"
                disabled={disabled}
                limit={2}
              />
            </label>
          </div>
        </>
      )}
    </>
  );
}

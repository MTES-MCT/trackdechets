import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import { Bsvhu } from "generated/graphql/types";
import React from "react";
import styles from "./Transporter.module.scss";
import initialState from "./utils/initial-state";

export default function Transporter({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsvhu>();
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
            setFieldValue(
              "transporter.recepisse.validityLimit",
              initialState.transporter.recepisse.validityLimit
            );
            setFieldValue("transporter.recepisse.department", "");
          }
        }}
      />

      {values.transporter?.company?.siret === null ? (
        <label>
          Numéro de TVA intracommunautaire
          <Field
            type="text"
            name="transporter.company.vatNumber"
            placeholder="Ex: DE 123456789"
            className="td-input"
            disabled={disabled}
          />
        </label>
      ) : (
        <>
          <h4 className="form__section-heading">Autorisations</h4>
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
        </>
      )}
    </>
  );
}

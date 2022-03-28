import RedErrorMessage from "common/components/RedErrorMessage";
import TdSwitch from "common/components/Switch";
import { FieldTransportModeSelect } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import { Transporter as TransporterType } from "generated/graphql/types";
import React from "react";
import styles from "./Transporter.module.scss";

type Values = {
  transporter: TransporterType;
};

export default function Transporter() {
  const { setFieldValue, values } = useFormikContext<Values>();

  return (
    <>
      <h4 className="form__section-heading">Transporteur</h4>
      <CompanySelector
        name="transporter.company"
        allowForeignCompanies={true}
        registeredOnlyCompanies={true}
        onCompanySelected={transporter => {
          if (transporter.transporterReceipt) {
            setFieldValue(
              "transporter.receipt",
              transporter.transporterReceipt.receiptNumber
            );
            setFieldValue(
              "transporter.validityLimit",
              transporter.transporterReceipt.validityLimit
            );
            setFieldValue(
              "transporter.department",
              transporter.transporterReceipt.department
            );
          } else {
            setFieldValue("transporter.receipt", "");
            setFieldValue("transporter.validityLimit", null);
            setFieldValue("transporter.department", "");
          }
        }}
      />

      <label>
        Mode de transport
        <Field name="transporter.mode" component={FieldTransportModeSelect} />
      </label>

      <h4 className="form__section-heading">Autorisations</h4>
      <div className="form__row">
        <TdSwitch
          checked={!!values.transporter.isExemptedOfReceipt}
          onChange={() =>
            setFieldValue(
              "transporter.isExemptedOfReceipt",
              !values.transporter.isExemptedOfReceipt
            )
          }
          label="Le transporteur déclare être exempté de récépissé conformément aux
          dispositions de l'article R.541-50 du code de l'environnement."
        />
      </div>
      {!values.transporter.isExemptedOfReceipt && (
        <div className="form__row">
          <label>
            Numéro de récépissé
            <Field
              type="text"
              name="transporter.receipt"
              className="td-input"
            />
          </label>

          <RedErrorMessage name="transporter.receipt" />

          <label>
            Département
            <Field
              type="text"
              name="transporter.department"
              placeholder="Ex: 83"
              className={`td-input ${styles.transporterDepartment}`}
            />
          </label>

          <RedErrorMessage name="transporter.department" />

          <label>
            Limite de validité (optionnel)
            <Field
              component={DateInput}
              name="transporter.validityLimit"
              className={`td-input ${styles.transporterValidityLimit}`}
            />
          </label>

          <RedErrorMessage name="transporter.validityLimit" />

          <label>
            Immatriculation (optionnel)
            <Field
              type="text"
              className={`td-input ${styles.transporterNumberPlate}`}
              name="transporter.numberPlate"
              placeholder="Plaque d'immatriculation du véhicule"
            />
          </label>

          <RedErrorMessage name="transporter.numberPlate" />
        </div>
      )}
    </>
  );
}

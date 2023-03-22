import RedErrorMessage from "common/components/RedErrorMessage";
import TdSwitch from "common/components/Switch";
import { FieldTransportModeSelect } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import { Transporter as TransporterType } from "generated/graphql/types";
import React from "react";
import styles from "./Transporter.module.scss";
import { isForeignVat } from "generated/constants/companySearchHelpers";

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
      <div className="form__row">
        <label>
          Mode de transport
          <Field name="transporter.mode" component={FieldTransportModeSelect} />
        </label>
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
      {!isForeignVat(values.transporter?.company?.vatNumber!!) && (
        <>
          <h4 className="form__section-heading">
            Exemption de récépissé de déclaration de transport de déchets
          </h4>
          <div className="form__row">
            <TdSwitch
              checked={!!values.transporter.isExemptedOfReceipt}
              onChange={() =>
                setFieldValue(
                  "transporter.isExemptedOfReceipt",
                  !values.transporter.isExemptedOfReceipt
                )
              }
              disabled={values.transporter.company?.orgId === null}
              label="Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'article R.541-50 du code de l'environnement."
            />
          </div>
        </>
      )}
    </>
  );
}

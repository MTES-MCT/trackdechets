import React from "react";
import { useFormikContext } from "formik";
import TdSwitch from "common/components/Switch";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsvhu } from "generated/graphql/types";
import initialState from "./utils/initial-state";
import { isForeignVat } from "generated/constants/companySearchHelpers";

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
    </>
  );
}

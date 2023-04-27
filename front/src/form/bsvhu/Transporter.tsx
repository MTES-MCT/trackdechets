import React from "react";
import { useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsvhu } from "generated/graphql/types";
import initialState from "./utils/initial-state";
import TransporterReceiptEditionSwitch from "form/common/components/company/TransporterReceiptEditionSwitch";

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
      <TransporterReceiptEditionSwitch
        transporter={values.transporter!}
        disabled={disabled}
        setFieldValue={setFieldValue}
      />
    </>
  );
}

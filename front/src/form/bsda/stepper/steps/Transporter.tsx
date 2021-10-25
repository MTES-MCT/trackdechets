import CompanySelector from "form/common/components/company/CompanySelector";
import { useFormikContext } from "formik";
import { Bsda } from "generated/graphql/types";
import React from "react";
import { Transport } from "./Transport";

export function Transporter({ disabled }) {
  const { setFieldValue } = useFormikContext<Bsda>();

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <CompanySelector
        disabled={disabled}
        name="transporter.company"
        heading="Entreprise de transport"
        allowForeignCompanies={true}
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
            setFieldValue("transporter.recepisse.validityLimit", null);
            setFieldValue("transporter.recepisse.department", "");
          }
        }}
      />

      <Transport disabled={disabled} />
    </>
  );
}

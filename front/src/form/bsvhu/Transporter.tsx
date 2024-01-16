import React from "react";
import { useFormikContext } from "formik";
import CompanySelector from "../common/components/company/CompanySelector";
import { Bsvhu } from "@td/codegen-ui";
import TransporterReceiptEditionSwitch from "../common/components/company/TransporterReceiptEditionSwitch";

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
      />
      <TransporterReceiptEditionSwitch
        transporter={values.transporter!}
        disabled={disabled}
        setFieldValue={setFieldValue}
      />
    </>
  );
}

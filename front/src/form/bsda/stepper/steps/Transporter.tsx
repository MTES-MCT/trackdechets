import CompanySelector from "../../../common/components/company/CompanySelector";
import { useFormikContext } from "formik";
import { Bsda, BsdaType } from "codegen-ui";
import React from "react";
import { Transport } from "./Transport";
import TransporterReceiptEditionSwitch from "../../../common/components/company/TransporterReceiptEditionSwitch";

export function Transporter({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Bsda>();

  const isDechetterie = values?.type === BsdaType.Collection_2710;

  if (isDechetterie) {
    return (
      <div className="notification">
        Vous effectuez une collecte en déchetterie. Il n'y a pas de transporteur
        à saisir.
      </div>
    );
  }

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
        isBsdaTransporter={true}
        registeredOnlyCompanies={true}
      />
      <TransporterReceiptEditionSwitch
        transporter={values.transporter!}
        disabled={disabled}
        setFieldValue={setFieldValue}
      />
      <Transport disabled={disabled} />
    </>
  );
}

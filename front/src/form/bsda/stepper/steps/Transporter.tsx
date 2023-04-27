import CompanySelector from "form/common/components/company/CompanySelector";
import { useFormikContext } from "formik";
import { Bsda, BsdaType } from "generated/graphql/types";
import React from "react";
import { Transport } from "./Transport";
import initialState from "../initial-state";
import TransporterReceiptEditionSwitch from "form/common/components/company/TransporterReceiptEditionSwitch";
import { onTransporterSelected } from "form/bsvhu/Transporter";

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

  const { transporter: initialTransporter } = initialState;

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
        onCompanySelected={onTransporterSelected(
          initialTransporter,
          setFieldValue
        )}
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

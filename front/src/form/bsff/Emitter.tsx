import React from "react";
import { useField } from "formik";
import { CompanyInput } from "generated/graphql/types";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FicheInterventionList } from "./FicheInterventionList";

export default function Emitter({ disabled }) {
  const [emitterCompanyField] = useField<CompanyInput>("emitter.company");

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
        name="emitter.company"
        heading="Entreprise émettrice"
      />

      <FicheInterventionList
        initialOperateurCompany={emitterCompanyField.value}
      />
    </>
  );
}

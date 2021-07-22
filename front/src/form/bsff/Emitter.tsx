import CompanySelector from "form/common/components/company/CompanySelector";
import React from "react";

export default function Emitter({ disabled }) {
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
    </>
  );
}

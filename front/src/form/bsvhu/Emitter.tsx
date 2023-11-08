import { RedErrorMessage } from "../../common/components";
import CompanySelector from "../common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import React from "react";

export default function Emitter({ disabled }) {
  const { setFieldValue } = useFormikContext();

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
        onCompanySelected={emitter => {
          if (emitter?.vhuAgrementDemolisseur) {
            setFieldValue(
              "emitter.agrementNumber",
              emitter.vhuAgrementDemolisseur.agrementNumber
            );
          } else {
            setFieldValue("emitter.agrementNumber", "");
          }
        }}
      />

      <div className="form__row">
        <label>
          Numéro d'agrément démolisseur
          <Field
            disabled={disabled}
            type="text"
            name="emitter.agrementNumber"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emitter.agrementNumber" />
      </div>
    </>
  );
}

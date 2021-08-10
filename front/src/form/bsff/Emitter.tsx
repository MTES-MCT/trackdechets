import React from "react";
import { FieldArray, useField } from "formik";
import { BsffFicheIntervention, CompanyInput } from "generated/graphql/types";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FicheInterventionList } from "./FicheInterventionList";

export default function Emitter({ disabled }) {
  const [emitterCompanyField] = useField<CompanyInput>("emitter.company");
  const [ficheInterventionsField] = useField<BsffFicheIntervention[]>(
    "ficheInterventions"
  );

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

      <FieldArray
        name="ficheInterventions"
        render={({ push, remove }) => (
          <FicheInterventionList
            ficheInterventions={ficheInterventionsField.value}
            initialOperateurCompany={emitterCompanyField.value}
            onAddFicheIntervention={ficheIntervention =>
              push(ficheIntervention)
            }
            onRemoveFicheIntervention={ficheIntervention =>
              remove(
                ficheInterventionsField.value.findIndex(
                  otherFicheIntervention =>
                    otherFicheIntervention.id === ficheIntervention.id
                )
              )
            }
          />
        )}
      />
    </>
  );
}

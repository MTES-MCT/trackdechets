import React from "react";
import { FieldArray, useField } from "formik";
import {
  Bsff,
  BsffFicheIntervention,
  CompanyInput,
} from "generated/graphql/types";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FicheInterventionList } from "./FicheInterventionList";

export default function Emitter({ disabled }) {
  const [{ value: emitterCompany }] = useField<CompanyInput>("emitter.company");
  const [{ value: ficheInterventions }] = useField<BsffFicheIntervention[]>(
    "ficheInterventions"
  );
  const [{ value: previousBsffs }] = useField<Bsff[]>("previousBsffs");

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

      {
        // Fiche d'interventions can be added to the very first BSFF, not the following ones
        previousBsffs.length <= 0 && (
          <FieldArray
            name="ficheInterventions"
            render={({ push, remove }) => (
              <FicheInterventionList
                ficheInterventions={ficheInterventions}
                initialOperateurCompany={emitterCompany}
                onAddFicheIntervention={ficheIntervention =>
                  push(ficheIntervention)
                }
                onRemoveFicheIntervention={ficheIntervention =>
                  remove(
                    ficheInterventions.findIndex(
                      otherFicheIntervention =>
                        otherFicheIntervention.id === ficheIntervention.id
                    )
                  )
                }
              />
            )}
          />
        )
      }
    </>
  );
}

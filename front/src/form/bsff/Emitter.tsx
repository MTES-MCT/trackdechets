import React from "react";
import { FieldArray, useField } from "formik";
import {
  BsffFicheIntervention,
  BsffType,
  CompanyInput,
} from "generated/graphql/types";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FicheInterventionList } from "./FicheInterventionList";

export default function Emitter({ disabled }) {
  const [{ value: emitterCompany }] = useField<CompanyInput>("emitter.company");
  const [{ value: ficheInterventions }] = useField<BsffFicheIntervention[]>(
    "ficheInterventions"
  );
  const [{ value: type }] = useField<BsffType>("type");

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

      {[BsffType.TracerFluide, BsffType.CollectePetitesQuantites].includes(
        type
      ) && (
        <FieldArray
          name="ficheInterventions"
          render={({ push, remove }) => (
            <FicheInterventionList
              max={type === BsffType.TracerFluide ? 1 : undefined}
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
      )}
    </>
  );
}

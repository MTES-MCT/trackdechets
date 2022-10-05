import React, { useEffect } from "react";
import { FieldArray, useField } from "formik";
import {
  Bsff,
  BsffFicheIntervention,
  BsffPackagingInput,
  BsffType,
  CompanyInput,
} from "generated/graphql/types";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FicheInterventionList } from "./FicheInterventionList";
import MyCompanySelector from "form/common/components/company/MyCompanySelector";

export default function Emitter({ disabled }) {
  const [{ value: emitterCompany }] = useField<CompanyInput>("emitter.company");
  const [{ value: ficheInterventions }] = useField<BsffFicheIntervention[]>(
    "ficheInterventions"
  );
  const [{ value: type }] = useField<BsffType>("type");

  const [{ value: previousBsffs }, , { setValue: setPreviousBsffs }] = useField<
    Bsff[]
  >("previousBsffs");
  const [{ value: packagings }, , { setValue: setPackagings }] = useField<
    BsffPackagingInput[]
  >("packagings");

  const heading =
    type === BsffType.TracerFluide
      ? "Détenteur"
      : type === BsffType.CollectePetitesQuantites
      ? "Opérateur"
      : type === BsffType.Groupement
      ? "Installation de tri, transit, regroupement ou traitement"
      : "Installation de tri, transit, regroupement";

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      {type === BsffType.TracerFluide ||
      type === BsffType.CollectePetitesQuantites ? (
        <CompanySelector
          disabled={disabled}
          name="emitter.company"
          heading={heading}
        />
      ) : (
        <>
          <h4 className="form__section-heading">{heading}</h4>
          <MyCompanySelector
            fieldName="emitter.company"
            siretEditable={true}
            onSelect={companySiret => {
              if (
                companySiret?.length &&
                previousBsffs?.length &&
                window.confirm(
                  "L'établissement sélectionné n'est pas compatible avec les bordereaux initiaux sélectionnés. Nous allons donc les dissocier."
                )
              ) {
                setPreviousBsffs([]);
                setPackagings([]);
              }
            }}
          />
        </>
      )}

      {[BsffType.CollectePetitesQuantites].includes(type) && (
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

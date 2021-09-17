import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda } from "generated/graphql/types";
import WorkSite from "form/common/components/work-site/WorkSite";
import { getInitialEmitterWorkSite } from "form/bsdd/utils/initial-state";

export function Emitter({ disabled }) {
  const { values } = useFormikContext<Bsda>();

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <div className="form__row">
        <label>
          <Field
            disabled={disabled}
            type="checkbox"
            name="emitter.isPrivateIndividual"
            className="td-checkbox"
          />
          Le MO ou le détenteur est un particulier
        </label>
      </div>

      {!values.emitter?.isPrivateIndividual && (
        <CompanySelector
          disabled={disabled}
          name="emitter.company"
          heading="Entreprise émettrice"
        />
      )}

      <WorkSite
        switchLabel="Je souhaite ajouter une adresse de chantier ou de collecte"
        headingTitle="Adresse chantier"
        designation="de l'entreprise"
        getInitialEmitterWorkSiteFn={getInitialEmitterWorkSite}
        disabled={disabled}
      />
    </>
  );
}

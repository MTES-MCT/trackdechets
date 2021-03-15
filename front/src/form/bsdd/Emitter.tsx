import CompanySelector from "form/common/components//company/CompanySelector";
import { RadioButton } from "form/common/components//custom-inputs/RadioButton";
import { Field, useFormikContext } from "formik";
import { Form } from "generated/graphql/types";
import React, { useEffect, useState } from "react";
import EcoOrganismes from "./components/eco-organismes/EcoOrganismes";
import WorkSite from "./components/work-site/WorkSite";
import "./Emitter.scss";

export default function Emitter() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const [lockEmitterType, setLockEmitterType] = useState(
    values.ecoOrganisme?.siret != null
  );

  useEffect(() => {
    if (values.ecoOrganisme?.siret) {
      setLockEmitterType(true);
      setFieldValue("emitter.type", "OTHER");
      return;
    }
    setLockEmitterType(false);
  }, [values.ecoOrganisme, setFieldValue]);

  return (
    <>
      <div className="form__row">
        <label htmlFor="id_customId">Autre Numéro Libre (optionnel)</label>
        <Field
          id="id_customId"
          type="text"
          className="td-input"
          placeholder="Utilisez votre propre numéro de BSD si nécessaire."
          name="customId"
        />
      </div>

      <EcoOrganismes name="ecoOrganisme" />

      {lockEmitterType && (
        <div className="form__row notification info">
          Lorsqu'un éco-organisme est indiqué comme responsable du déchet, le
          type d'émetteur est verrouillé à <strong>Autre détenteur</strong>.
        </div>
      )}

      <div className="form__row">
        <fieldset>
          <legend className="tw-font-semibold"> L'émetteur est</legend>
          <Field
            name="emitter.type"
            id="PRODUCER"
            label="Producteur du déchet"
            component={RadioButton}
            disabled={lockEmitterType}
          />
          <Field
            name="emitter.type"
            id="OTHER"
            label="Autre détenteur"
            component={RadioButton}
            disabled={lockEmitterType}
          />
          <Field
            name="emitter.type"
            id="APPENDIX2"
            label="Personne ayant transformé ou réalisé un traitement dont la provenance reste identifiable"
            component={RadioButton}
            disabled={lockEmitterType}
          />

          <Field
            name="emitter.type"
            id="APPENDIX1"
            label="Collecteur de petites quantités de déchets relevant d’une même rubrique"
            component={RadioButton}
            disabled={lockEmitterType}
          />
        </fieldset>
      </div>

      <CompanySelector name="emitter.company" heading="Entreprise émettrice" />

      <WorkSite />
    </>
  );
}

import { Field, useFormikContext } from "formik";
import React, { useState, useEffect } from "react";
import CompanySelector from "./company/CompanySelector";
import { RadioButton } from "./custom-inputs/RadioButton";
import "./Emitter.scss";
import { Form } from "../generated/graphql/types";
import EcoOrganismes from "./eco-organismes/EcoOrganismes";
import WorkSite from "./work-site/WorkSite";

export default function Emitter() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const [lockEmitterType, setLockEmitterType] = useState(
    values.ecoOrganisme?.id != null
  );

  useEffect(() => {
    if (values.ecoOrganisme?.id) {
      setLockEmitterType(true);
      setFieldValue("emitter.type", "OTHER");
      return;
    }
    setLockEmitterType(false);
  }, [values.ecoOrganisme, setFieldValue]);

  return (
    <>
      <div className="form__group">
        <label htmlFor="id_customId">Autre Numéro Libre (optionnel)</label>
        <Field
          id="id_customId"
          type="text"
          placeholder="Utilisez votre propre numéro de BSD si nécessaire."
          name="customId"
        />
      </div>

      <EcoOrganismes name="ecoOrganisme" />

      {lockEmitterType && (
        <div className="form__group notification info">
          Lorsqu'un éco-organisme est indiqué comme responsable du déchet, le
          type d'émetteur est verrouillé à <strong>Autre détenteur</strong>.
        </div>
      )}

      <div className="form__group">
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

      <h4>Entreprise émettrice</h4>
      <CompanySelector name="emitter.company" />

      <WorkSite />
    </>
  );
}

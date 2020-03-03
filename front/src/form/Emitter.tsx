import React, { useState } from "react";
import CompanySelector from "./company/CompanySelector";
import { Field, connect } from "formik";
import { RadioButton } from "./custom-inputs/RadioButton";
import "./Emitter.scss";
import WorkSite from "./work-site/WorkSite";

type Values = {
  customId: string;
};
export default connect<{}, Values>(function Emitter({ formik }) {
  const [displayCustomId, setDisplayCustomId] = useState(
    !!formik.values.customId
  );

  return (
    <>
      <div className="form__group">
        <label>
          <input
            type="checkbox"
            defaultChecked={displayCustomId}
            onChange={() => setDisplayCustomId(!displayCustomId)}
          />
          Je souhaite ajouter un numéro de BSD qui m'est propre
        </label>
        {displayCustomId && (
          <>
            <h4>Autre Numéro Libre</h4>
            <Field
              type="text"
              placeholder="Utilisez votre propre numéro de BSD si nécessaire."
              name="customId"
            />
          </>
        )}
      </div>
      <h4>Type d'émetteur</h4>

      <div className="form__group">
        <fieldset>
          <legend>L'émetteur est</legend>
          <Field
            name="emitter.type"
            id="PRODUCER"
            label="Producteur du déchet"
            component={RadioButton}
          />
          <Field
            name="emitter.type"
            id="OTHER"
            label="Autre détenteur"
            component={RadioButton}
          />
          <Field
            name="emitter.type"
            id="APPENDIX2"
            label="Personne ayant transformé ou réalisé un traitement dont la provenance reste identifiable"
            component={RadioButton}
          />

          <Field
            name="emitter.type"
            id="APPENDIX1"
            label="Collecteur de petites quantités de déchets relevant d’une même rubrique"
            component={RadioButton}
          />
        </fieldset>
      </div>

      <h4>Entreprise émettrice</h4>
      <CompanySelector name="emitter.company" />

      <WorkSite />
    </>
  );
});

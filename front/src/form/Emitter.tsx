import React, { useState } from "react";
import CompanySelector from "./company/CompanySelector";
import { Field, connect } from "formik";
import RadioButton from "./custom-inputs/RadioButton";
import "./Emitter.scss";

type Values = {
  emitter: { pickupSite: string };
};
export default connect<{}, Values>(function Emitter({ formik }) {
  const [pickupSite, setPickupSite] = useState(
    formik.values.emitter.pickupSite != ""
  );

  return (
    <React.Fragment>
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
      <Field component={CompanySelector} name="emitter.company" />

      <label>
        <input
          type="checkbox"
          defaultChecked={pickupSite}
          onChange={() => setPickupSite(!pickupSite)}
        />
        Je souhaite ajouter une adresse de chantier ou de collecte
      </label>
      {pickupSite && (
        <React.Fragment>
          <h4>Adresse chantier</h4>
          <Field
            component="textarea"
            className="textarea-pickup-site"
            placeholder="Nom / Adresse / Précisions..."
            name="emitter.pickupSite"
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
});

import React, { useState } from "react";
import CompanySelector from "./company/CompanySelector";
import { Field } from "formik";
import RadioButton from "./radio-button/RadioButton";

export default function Emitter() {
  const [pickupSite, setPickupSite] = useState(false);

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
        </fieldset>
      </div>

      <h4>Entreprise émettrice</h4>
      <CompanySelector name="emitter.company" />

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
          <Field component="textarea" name="emitter.pickupSite" />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

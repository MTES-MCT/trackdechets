import React, { useState } from "react";
import CompanySelector from "./company/CompanySelector";
import { Field } from "formik";

export default function Emitter() {
  const [pickupSite, setPickupSite] = useState(false);

  return (
    <React.Fragment>
      <h4>Type d'émetteur</h4>

      <div className="form__group">
        <fieldset>
          <legend>L'émetteur est:</legend>
          <label className="label-inline">
            <Field type="radio" name="emitter.type" value="1" />
            Producteur du déchet
          </label>
          <label className="label-inline">
            <Field type="radio" name="emitter.type" value="0" />
            Autre détenteur
          </label>
        </fieldset>
      </div>

      <h4>Entreprise émettrice</h4>
      <CompanySelector name="emitter.company" />

      <h4>Adresse chantier</h4>
      <label>
        <input
          type="checkbox"
          defaultChecked={pickupSite}
          onChange={() => setPickupSite(!pickupSite)}
        />
        Je souhaite ajouter une adresse de chantier ou de collecte
      </label>
      {pickupSite && <Field component="textarea" name="emitter.pickupSite" />}
    </React.Fragment>
  );
}

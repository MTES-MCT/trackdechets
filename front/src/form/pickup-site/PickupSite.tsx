import { Field, useFormikContext } from "formik";
import React, { useState } from "react";
import { Form } from "../model";

export default function PickupSite() {
  const { values } = useFormikContext<Form>();
  const [pickupSite, setPickupSite] = useState(
    Object.values(values.emitter.pickupSite).some(v => v != "")
  );

  return (
    <div className="form__group">
      <label>
        <input
          type="checkbox"
          defaultChecked={pickupSite}
          onChange={() => setPickupSite(!pickupSite)}
        />
        Je souhaite ajouter une adresse de chantier ou de collecte
      </label>
      {pickupSite && (
        <>
          <h4>Adresse chantier</h4>

          <div className="form__group">
            <label>
              Nom de l'entreprise
              <Field
                type="text"
                name="emitter.pickupSite.name"
                placeholder="Intitulé"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Adresse chantier
              <Field
                type="text"
                name="emitter.pickupSite.address"
                placeholder="Rue / numéro"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Commune
              <Field
                type="text"
                name="emitter.pickupSite.city"
                placeholder="Intitulé"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Code postal
              <Field
                type="input"
                name="emitter.pickupSite.postalCode"
                placeholder="Code"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Autre informations
              <Field
                component="textarea"
                className="textarea-pickup-site"
                placeholder="Champ libre pour préciser..."
                name="emitter.pickupSite.infos"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

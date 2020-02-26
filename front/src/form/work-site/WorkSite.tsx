import { Field, useFormikContext } from "formik";
import React, { useState } from "react";
import { Form } from "../model";

export default function WorkSite() {
  const { values } = useFormikContext<Form>();
  const [workSite, setWorkSite] = useState(
    Object.values(values.emitter.workSite).some(v => v != "")
  );

  return (
    <div className="form__group">
      <label>
        <input
          type="checkbox"
          defaultChecked={workSite}
          onChange={() => setWorkSite(!workSite)}
        />
        Je souhaite ajouter une adresse de chantier ou de collecte
      </label>
      {workSite && (
        <>
          <h4>Adresse chantier</h4>

          <div className="form__group">
            <label>
              Nom de l'entreprise
              <Field
                type="text"
                name="emitter.workSite.name"
                placeholder="Intitulé"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Adresse chantier
              <Field
                type="text"
                name="emitter.workSite.address"
                placeholder="Rue / numéro"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Commune
              <Field
                type="text"
                name="emitter.workSite.city"
                placeholder="Intitulé"
              />
            </label>
          </div>

          <div className="form__group">
            <label>
              Code postal
              <Field
                type="input"
                name="emitter.workSite.postalCode"
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
                name="emitter.workSite.infos"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

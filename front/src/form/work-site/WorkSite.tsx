import { Field, useFormikContext } from "formik";
import React, { useState, useEffect } from "react";
import { Form } from "../model";

const FIELDS = ["name", "address", "city", "postalCode", "infos"];

export default function WorkSite() {
  const { values, setFieldValue } = useFormikContext<Form>();
  const [showWorkSite, setShowWorkSite] = useState(
    FIELDS.some(field => values.emitter.workSite[field])
  );

  useEffect(() => {
    for (const field of FIELDS) {
      setFieldValue(`emitter.workSite.${field}`, "");
    }
  }, [showWorkSite]);

  return (
    <div className="form__group">
      <label>
        <input
          type="checkbox"
          defaultChecked={showWorkSite}
          onChange={() => setShowWorkSite(!showWorkSite)}
        />
        Je souhaite ajouter une adresse de chantier ou de collecte
      </label>
      {showWorkSite && (
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

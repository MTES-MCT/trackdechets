import { Field, useFormikContext } from "formik";
import React, { useState, useEffect } from "react";
import { Form } from "../../generated/graphql/types";
import WorkSiteAddress from "./WorkSiteAddress";

const FIELDS = ["name", "address", "city", "postalCode", "infos"];

export default function WorkSite() {
  const { values, setFieldValue } = useFormikContext<Form>();
  const [showWorkSite, setShowWorkSite] = useState(
    FIELDS.some(field =>
      values.emitter?.workSite ? values.emitter?.workSite[field] : null
    )
  );

  useEffect(() => {
    if (!showWorkSite) {
      for (const field of FIELDS) {
        setFieldValue(`emitter.workSite.${field}`, "");
      }
    }
  }, [showWorkSite, setFieldValue]);

  function setAddress(details) {
    setFieldValue(`emitter.workSite.address`, details.name);
    setFieldValue(`emitter.workSite.city`, details.city);
    setFieldValue(`emitter.workSite.postalCode`, details.postcode);
  }

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
            <WorkSiteAddress
              adress={values.emitter?.workSite?.address}
              city={values.emitter?.workSite?.city}
              postalCode={values.emitter?.workSite?.postalCode}
              onAddressSelection={details => setAddress(details)}
            />
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

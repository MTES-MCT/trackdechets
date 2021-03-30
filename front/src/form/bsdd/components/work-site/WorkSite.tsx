import TdSwitch from "common/components/Switch";
import { getInitialEmitterWorkSite } from "../../utils/initial-state";
import { Field, useFormikContext } from "formik";
import { Form } from "generated/graphql/types";
import React from "react";
import WorkSiteAddress from "./WorkSiteAddress";

export default function WorkSite() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const showWorkSite = !!values.emitter?.workSite;

  function handleWorksiteToggle() {
    if (showWorkSite) {
      setFieldValue("emitter.workSite", null, false);
    } else {
      setFieldValue("emitter.workSite", getInitialEmitterWorkSite(), false);
    }
  }

  function setAddress(details) {
    setFieldValue(`emitter.workSite.address`, details.name);
    setFieldValue(`emitter.workSite.city`, details.city);
    setFieldValue(`emitter.workSite.postalCode`, details.postcode);
  }

  return (
    <div className="form__row">
      <TdSwitch
        checked={showWorkSite}
        onChange={handleWorksiteToggle}
        label="Je souhaite ajouter une adresse de chantier ou de collecte"
      />

      {showWorkSite && values.emitter?.workSite && (
        <>
          <h4 className="form__section-heading">Adresse chantier</h4>

          <div className="form__row">
            <label>
              Nom de l'entreprise
              <Field
                type="text"
                name="emitter.workSite.name"
                placeholder="Intitulé"
                className="td-input"
              />
            </label>
          </div>

          <div className="form__row">
            <WorkSiteAddress
              adress={values.emitter?.workSite?.address}
              city={values.emitter?.workSite?.city}
              postalCode={values.emitter?.workSite?.postalCode}
              onAddressSelection={details => setAddress(details)}
            />
          </div>

          <div className="form__row">
            <label>
              Informations complémentaires
              <Field
                component="textarea"
                className="textarea-pickup-site td-textarea"
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

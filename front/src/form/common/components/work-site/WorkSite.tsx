import TdSwitch from "../../../../common/components/Switch";

import { Field, useFormikContext } from "formik";
import { Form } from "@td/codegen-ui";
import React from "react";
import WorkSiteAddress from "./WorkSiteAddress";

const DEFAULT_KEY = "workSite";

export default function WorkSite({
  switchLabel,
  headingTitle,
  designation,
  getInitialEmitterWorkSiteFn,
  disabled = false,
  modelKey = DEFAULT_KEY
}: {
  switchLabel: string;
  headingTitle: string;
  designation: string;
  getInitialEmitterWorkSiteFn: () => any;
  disabled?: boolean;
  modelKey?: string;
}) {
  const { values, setFieldValue } = useFormikContext<Form>();

  const showWorkSite = !!values.emitter?.[modelKey];

  function handleWorksiteToggle() {
    if (showWorkSite) {
      setFieldValue(`emitter.${modelKey}`, null, false);
    } else {
      setFieldValue(
        `emitter.${modelKey}`,
        getInitialEmitterWorkSiteFn(),
        false
      );
    }
  }

  function setAddress(details) {
    // `address` is passed as `name` because of adresse api return fields
    setFieldValue(`emitter.${modelKey}.address`, details.name);
    setFieldValue(`emitter.${modelKey}.city`, details.city);
    setFieldValue(`emitter.${modelKey}.postalCode`, details.postcode);
  }

  return (
    <div className="form__row">
      {!disabled && (
        <TdSwitch
          checked={showWorkSite}
          onChange={handleWorksiteToggle}
          label={switchLabel}
        />
      )}

      {showWorkSite && values.emitter?.[modelKey] && (
        <>
          <h4 className="form__section-heading">{headingTitle}</h4>

          <div className="form__row">
            <label>
              Nom {designation}
              <Field
                type="text"
                name={`emitter.${modelKey}.name`}
                placeholder="Intitulé"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>

          <div className="form__row">
            <WorkSiteAddress
              address={values.emitter?.[modelKey]?.address}
              city={values.emitter?.[modelKey]?.city}
              postalCode={values.emitter?.[modelKey]?.postalCode}
              onAddressSelection={details => setAddress(details)}
              designation={designation}
              disabled={disabled}
            />
          </div>

          <div className="form__row">
            <label>
              Informations complémentaires (optionnel)
              <Field
                component="textarea"
                className="textarea-pickup-site td-textarea"
                placeholder="Champ libre pour préciser..."
                name={`emitter.${modelKey}.infos`}
                disabled={disabled}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

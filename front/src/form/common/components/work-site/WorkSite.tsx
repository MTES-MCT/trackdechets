import TdSwitch from "common/components/Switch";

import { Field, useFormikContext } from "formik";
import { Form } from "generated/graphql/types";
import React from "react";
import WorkSiteAddress from "./WorkSiteAddress";

const DEFAULT_KEY = "workSite";

export default function WorkSite({
  switchLabel,
  headingTitle,
  designation,
  getInitialEmitterWorkSiteFn,
  disabled = false,
  key = DEFAULT_KEY,
}: {
  switchLabel: string;
  headingTitle: string;
  designation: string;
  getInitialEmitterWorkSiteFn: () => any;
  disabled?: boolean;
  key?: string;
}) {
  const { values, setFieldValue } = useFormikContext<Form>();

  const showWorkSite = !!values.emitter?.workSite;

  function handleWorksiteToggle() {
    if (showWorkSite) {
      setFieldValue(`emitter.${key}`, null, false);
    } else {
      setFieldValue(`emitter.${key}`, getInitialEmitterWorkSiteFn(), false);
    }
  }

  function setAddress(details) {
    setFieldValue(`emitter.${key}.address`, details.name);
    setFieldValue(`emitter.${key}.city`, details.city);
    setFieldValue(`emitter.${key}.postalCode`, details.postcode);
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

      {showWorkSite && values.emitter?.workSite && (
        <>
          <h4 className="form__section-heading">{headingTitle}</h4>

          <div className="form__row">
            <label>
              Nom {designation}
              <Field
                type="text"
                name={`emitter.${key}.name`}
                placeholder="Intitulé"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>

          <div className="form__row">
            <WorkSiteAddress
              adress={values.emitter?.workSite?.address}
              city={values.emitter?.workSite?.city}
              postalCode={values.emitter?.workSite?.postalCode}
              onAddressSelection={details => setAddress(details)}
              designation={designation}
              disabled={disabled}
            />
          </div>

          <div className="form__row">
            <label>
              Informations complémentaires
              <Field
                component="textarea"
                className="textarea-pickup-site td-textarea"
                placeholder="Champ libre pour préciser..."
                name={`emitter.${key}.infos`}
                disabled={disabled}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

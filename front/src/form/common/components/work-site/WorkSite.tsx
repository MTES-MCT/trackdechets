import TdSwitch from "common/components/Switch";

import { Field, useFormikContext } from "formik";
import { Form } from "generated/graphql/types";
import React from "react";
import WorkSiteAddress from "./WorkSiteAddress";

export default function WorkSite({
  switchLabel,
  headingTitle,
  designation,
  getInitialEmitterWorkSiteFn,
  disabled = false,
}: {
  switchLabel: string;
  headingTitle: string;
  designation: string;
  getInitialEmitterWorkSiteFn: () => any;
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<Form>();

  const showWorkSite = !!values.emitter?.workSite;

  function handleWorksiteToggle() {
    if (showWorkSite) {
      setFieldValue("emitter.workSite", null, false);
    } else {
      setFieldValue("emitter.workSite", getInitialEmitterWorkSiteFn(), false);
    }
  }

  function setAddress(details) {
    setFieldValue(`emitter.workSite.address`, details.name);
    setFieldValue(`emitter.workSite.city`, details.city);
    setFieldValue(`emitter.workSite.postalCode`, details.postcode);
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
                name="emitter.workSite.name"
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
                name="emitter.workSite.infos"
                disabled={disabled}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

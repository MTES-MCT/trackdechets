import TdSwitch from "common/components/Switch";

import { Field, useFormikContext } from "formik";
import { Bsdasri } from "generated/graphql/types";
import React from "react";
import PickupSiteAddress from "./PickupSiteAddress";

export default function PickupSite({
  switchLabel,
  headingTitle,
  designation,
  getInitialEmitterPickupSiteFn,
  disabled = false,
}: {
  switchLabel: string;
  headingTitle: string;
  designation: string;
  getInitialEmitterPickupSiteFn: () => any;
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const showPickupSite = !!values.emitter?.pickupSite;

  function handleWorksiteToggle() {
    if (showPickupSite) {
      setFieldValue("emitter.pickupSite", null, false);
    } else {
      setFieldValue(
        "emitter.pickupSite",
        getInitialEmitterPickupSiteFn(),
        false
      );
    }
  }

  function setAddress(details) {
    setFieldValue(`emitter.pickupSite.address`, details.name);
    setFieldValue(`emitter.pickupSite.city`, details.city);
    setFieldValue(`emitter.pickupSite.postalCode`, details.postcode);
  }

  return (
    <div className="form__row">
      {!disabled && (
        <TdSwitch
          checked={showPickupSite}
          onChange={handleWorksiteToggle}
          label={switchLabel}
        />
      )}

      {showPickupSite && values.emitter?.pickupSite && (
        <>
          <h4 className="form__section-heading">{headingTitle}</h4>

          <div className="form__row">
            <label>
              Nom {designation}
              <Field
                type="text"
                name="emitter.pickupSite.name"
                placeholder="Intitulé"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>

          <div className="form__row">
            <PickupSiteAddress
              adress={values.emitter?.pickupSite?.address}
              city={values.emitter?.pickupSite?.city}
              postalCode={values.emitter?.pickupSite?.postalCode}
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
                name="emitter.pickupSite.infos"
                value={values.emitter?.pickupSite?.infos || ""}
                disabled={disabled}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

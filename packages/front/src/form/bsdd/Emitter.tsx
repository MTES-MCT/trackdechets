import CompanySelector from "form/common/components/company/CompanySelector";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useField, useFormikContext } from "formik";
import { Form } from "@trackdechets/codegen/src/front.gen";
import React, { useEffect, useState } from "react";
import EcoOrganismes from "./components/eco-organismes/EcoOrganismes";
import WorkSite from "form/common/components/work-site/WorkSite";
import { getInitialEmitterWorkSite } from "form/bsdd/utils/initial-state";
import "./Emitter.scss";
import MyCompanySelector from "form/common/components/company/MyCompanySelector";
import { emitterTypeLabels } from "dashboard/constants";

export default function Emitter() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const [lockEmitterType, setLockEmitterType] = useState(
    values.ecoOrganisme?.siret != null
  );

  useEffect(() => {
    if (values.ecoOrganisme?.siret) {
      setLockEmitterType(true);
      setFieldValue("emitter.type", "OTHER");
      return;
    }
    setLockEmitterType(false);
  }, [values.ecoOrganisme, setFieldValue]);

  const [emitterTypeField] = useField("emitter.type");

  function onChangeEmitterType(e) {
    const previousEmitterType = values.emitter?.type;
    emitterTypeField.onChange(e);
    if (previousEmitterType === "APPENDIX2" && values.appendix2Forms?.length) {
      // make sure to empty appendix2 forms when de-selecting APPENDIX2
      setFieldValue("appendix2Forms", []);
    }
  }

  return (
    <>
      <div className="form__row">
        <label htmlFor="id_customId">Autre Numéro Libre (optionnel)</label>
        <Field
          id="id_customId"
          type="text"
          className="td-input"
          placeholder="Utilisez votre propre numéro de BSD si nécessaire."
          name="customId"
        />
      </div>

      <EcoOrganismes name="ecoOrganisme" />

      {lockEmitterType && (
        <div className="form__row notification info">
          Lorsqu'un éco-organisme est indiqué comme responsable du déchet, le
          type d'émetteur est verrouillé à <strong>Autre détenteur</strong>.
        </div>
      )}

      <div className="form__row">
        <fieldset>
          <legend className="tw-font-semibold"> L'émetteur est</legend>
          <Field
            name="emitter.type"
            id="PRODUCER"
            label={emitterTypeLabels["PRODUCER"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType}
          />
          <Field
            name="emitter.type"
            id="OTHER"
            label={emitterTypeLabels["OTHER"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType}
          />
          <Field
            name="emitter.type"
            id="APPENDIX2"
            label={emitterTypeLabels["APPENDIX2"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType}
          />

          <Field
            name="emitter.type"
            id="APPENDIX1"
            label={emitterTypeLabels["APPENDIX1"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType}
          />
        </fieldset>
      </div>

      {values.emitter?.type === "APPENDIX2" ? (
        <div className="tw-my-6">
          <h4 className="form__section-heading">Entreprise émettrice</h4>
          <MyCompanySelector
            fieldName="emitter.company"
            onSelect={() => {
              if (values.appendix2Forms?.length) {
                // make sure to empty appendix2 forms because new emitter may
                // not be recipient of the select appendix 2 forms
                setFieldValue("appendix2Forms", []);
              }
            }}
          />
        </div>
      ) : (
        <CompanySelector
          name="emitter.company"
          heading="Entreprise émettrice"
        />
      )}

      <WorkSite
        switchLabel="Je souhaite ajouter une adresse de chantier ou de collecte"
        headingTitle="Adresse chantier"
        designation="du chantier ou lieu de collecte"
        getInitialEmitterWorkSiteFn={getInitialEmitterWorkSite}
      />
    </>
  );
}

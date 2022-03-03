import CompanySelector from "form/common/components/company/CompanySelector";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useFormikContext } from "formik";
import { Form } from "generated/graphql/types";
import React, { useEffect, useMemo, useState } from "react";
import EcoOrganismes from "./components/eco-organismes/EcoOrganismes";
import WorkSite from "form/common/components/work-site/WorkSite";
import {
  getInitialCompany,
  getInitialEmitterWorkSite,
} from "form/bsdd/utils/initial-state";
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

  const emitterType = useMemo(() => values.emitter?.type, [values.emitter]);

  useEffect(() => {
    // make sure appendix2 forms is empty when emitter type is not APPENDIX2
    if (emitterType !== "APPENDIX2" && values.appendix2Forms?.length) {
      setFieldValue("appendix2Forms", []);
    }
    // make sure to remove favorite company when emitter type is set to APPENDIX2
    if (emitterType === "APPENDIX2") {
      setFieldValue("emitter.company", getInitialCompany());
    }
  }, [emitterType, values.appendix2Forms, setFieldValue]);

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
            disabled={lockEmitterType}
          />
          <Field
            name="emitter.type"
            id="OTHER"
            label={emitterTypeLabels["OTHER"]}
            component={RadioButton}
            disabled={lockEmitterType}
          />
          <Field
            name="emitter.type"
            id="APPENDIX2"
            label={emitterTypeLabels["APPENDIX2"]}
            component={RadioButton}
            disabled={lockEmitterType}
          />

          <Field
            name="emitter.type"
            id="APPENDIX1"
            label={emitterTypeLabels["APPENDIX1"]}
            component={RadioButton}
            disabled={lockEmitterType}
          />
        </fieldset>
      </div>

      {values.emitter?.type === "APPENDIX2" ? (
        <div className="tw-my-6">
          <h4 className="form__section-heading">Entreprise émettrice</h4>
          <MyCompanySelector fieldName="emitter.company" />
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

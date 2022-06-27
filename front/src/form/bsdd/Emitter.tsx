import CompanySelector from "form/common/components/company/CompanySelector";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useField, useFormikContext } from "formik";
import { Form } from "generated/graphql/types";
import React, { useEffect, useState } from "react";
import EcoOrganismes from "./components/eco-organismes/EcoOrganismes";
import WorkSite from "form/common/components/work-site/WorkSite";
import { getInitialEmitterWorkSite } from "form/bsdd/utils/initial-state";
import "./Emitter.scss";
import MyCompanySelector from "form/common/components/company/MyCompanySelector";
import { emitterTypeLabels } from "dashboard/constants";
import { isOmi } from "generated/constants/companySearchHelpers";
import { RedErrorMessage } from "common/components";

export default function Emitter({ disabled }) {
  const { values, handleChange, setFieldValue } = useFormikContext<Form>();

  const [lockEmitterType, setLockEmitterType] = useState(
    values.ecoOrganisme?.siret != null
  );

  const [lockEmitterProducer, setLockEmitterProducer] = useState(
    values.emitter?.isForeignShip || values.emitter?.isPrivateIndividual
  );

  useEffect(() => {
    if (values.ecoOrganisme?.siret) {
      setLockEmitterType(true);
      setFieldValue("emitter.type", "OTHER");
      return;
    }
    setLockEmitterType(false);
  }, [values.ecoOrganisme, setFieldValue]);

  useEffect(() => {
    if (values.emitter?.isForeignShip || values.emitter?.isPrivateIndividual) {
      setLockEmitterProducer(true);
      setLockEmitterType(false);
      setFieldValue("emitter.type", "PRODUCER");
      return;
    }
    setLockEmitterProducer(false);
  }, [
    values.emitter?.isForeignShip,
    values.emitter?.isPrivateIndividual,
    setFieldValue,
  ]);

  const [emitterTypeField] = useField("emitter.type");

  function onChangeEmitterType(e) {
    const previousEmitterType = values.emitter?.type;
    emitterTypeField.onChange(e);
    if (previousEmitterType === "APPENDIX2" && values.grouping?.length) {
      // make sure to empty appendix2 forms when de-selecting APPENDIX2
      setFieldValue("grouping", []);
    }
  }

  function omiNumberValidator(omi: string) {
    if (!isOmi(omi)) {
      return "Le numéro OMI (Organisation maritime international) de l'entreprise doit se composer des trois lettres OMI suivives de 7 chiffres (ex. OMI1234567)";
    }
    return undefined;
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
          type d'émetteur est verrouillé à "Autre détenteur".
        </div>
      )}

      {lockEmitterProducer && (
        <div className="form__row notification notification--warning">
          Lorsqu'un particulier ou un navire étranger est émetteur du déchet, le
          type d'émetteur est verrouillé à "Producteur". La signature de
          l'émetteur ne sera pas requise et après validation du bordereau la
          première signature attendue sera celle du transporteur.
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
            disabled={lockEmitterType || lockEmitterProducer}
          />
          <Field
            name="emitter.type"
            id="OTHER"
            label={emitterTypeLabels["OTHER"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType || lockEmitterProducer}
          />
          <Field
            name="emitter.type"
            id="APPENDIX2"
            label={emitterTypeLabels["APPENDIX2"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType || lockEmitterProducer}
          />

          <Field
            name="emitter.type"
            id="APPENDIX1"
            label={emitterTypeLabels["APPENDIX1"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterType || lockEmitterProducer}
          />
        </fieldset>
      </div>
      <div className="form__row">
        <label>
          <Field
            disabled={disabled}
            type="checkbox"
            name="emitter.isPrivateIndividual"
            className="td-checkbox"
            onChange={e => {
              handleChange(e);
              setFieldValue("emitter.company.siret", null);
              setFieldValue("emitter.company.vatNumber", null);
              setFieldValue("emitter.company.omiNumber", null);
              setFieldValue("emitter.company.contact", null);
              setFieldValue("emitter.company.name", null);
              setFieldValue("emitter.company.address", null);
              setFieldValue("emitter.company.country", null);
              setFieldValue("emitter.isForeignShip", false);
            }}
          />
          L'émetteur est un particulier
        </label>
        <label>
          <Field
            disabled={disabled}
            type="checkbox"
            name="emitter.isForeignShip"
            className="td-checkbox"
            onChange={e => {
              handleChange(e);
              setFieldValue("emitter.company.siret", null);
              setFieldValue("emitter.company.vatNumber", null);
              setFieldValue("emitter.company.contact", null);
              setFieldValue("emitter.company.name", null);
              setFieldValue("emitter.company.address", null);
              setFieldValue("emitter.company.country", null);
              setFieldValue("emitter.isPrivateIndividual", false);
            }}
          />
          L'émetteur est un navire étranger
        </label>
      </div>
      {values.emitter?.type !== "APPENDIX2" &&
        values.emitter?.isPrivateIndividual && (
          <div className="form__row">
            <div className="form__row">
              <label>
                Nom et prénom
                <Field
                  type="text"
                  name="emitter.company.name"
                  className="td-input"
                  disabled={disabled}
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Adresse
                <Field
                  type="text"
                  name="emitter.company.address"
                  className="td-input"
                  disabled={disabled}
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Téléphone (optionnel)
                <Field
                  type="text"
                  name="emitter.company.phone"
                  className="td-input td-input--small"
                  disabled={disabled}
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Mail (optionnel)
                <Field
                  type="text"
                  name="emitter.company.mail"
                  className="td-input td-input--medium"
                  disabled={disabled}
                />
              </label>
            </div>
          </div>
        )}
      {values.emitter?.type !== "APPENDIX2" && values.emitter?.isForeignShip && (
        <div className="form__row">
          <div className="form__row">
            <label>
              Numéro OMI (Organisation Maritime Internationale)
              <Field
                type="text"
                name="emitter.company.omiNumber"
                placeholder="OMI1234567"
                className="td-input"
                disabled={disabled}
                validate={omiNumberValidator}
              />
              <RedErrorMessage name="emitter.company.omiNumber" />
            </label>
          </div>
          <div className="form__row">
            <label>
              Personne à contacter (optionnel)
              <Field
                type="text"
                name="emitter.company.contact"
                placeholder="NOM Prénom"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Adresse (optionnel)
              <Field
                type="text"
                name="emitter.company.address"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Téléphone (optionnel)
              <Field
                type="text"
                name="emitter.company.phone"
                className="td-input td-input--small"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Mail (optionnel)
              <Field
                type="text"
                name="emitter.company.mail"
                className="td-input td-input--medium"
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      )}

      {values.emitter?.type === "APPENDIX2" && (
        <div className="tw-my-6">
          <h4 className="form__section-heading">Entreprise émettrice</h4>
          <MyCompanySelector
            fieldName="emitter.company"
            onSelect={() => {
              if (values.grouping?.length) {
                // make sure to empty appendix2 forms because new emitter may
                // not be recipient of the select appendix 2 forms
                setFieldValue("grouping", []);
              }
            }}
          />
        </div>
      )}

      {values.emitter?.type !== "APPENDIX2" &&
        !values.emitter?.isPrivateIndividual &&
        !values.emitter?.isForeignShip && (
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

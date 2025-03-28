import CompanySelector from "../common/components/company/CompanySelector";
import { RadioButton } from "../common/components/custom-inputs/RadioButton";
import { Field, useField, useFormikContext } from "formik";
import { CompanyType, EmitterType, Form } from "@td/codegen-ui";
import React, { useEffect } from "react";
import EcoOrganismes from "./components/eco-organismes/EcoOrganismes";
import WorkSite from "../common/components/work-site/WorkSite";
import {
  getInitialEmitterWorkSite,
  initialFormTransporter
} from "./utils/initial-state";
import "./Emitter.scss";
import MyCompanySelector from "../common/components/company/MyCompanySelector";
import { emitterTypeLabels } from "../../dashboard/constants";
import { isForeignVat, isOmi } from "@td/constants";
import { RedErrorMessage } from "../../common/components";
// import Tooltip from "../../common/components/Tooltip";
import { getInitialCompany } from "../../Apps/common/data/initialState";
import Tooltip from "../../Apps/common/Components/Tooltip/Tooltip";

export default function Emitter({ disabled }) {
  const ctx = useFormikContext<Form>();

  const { values, handleChange, setFieldValue, initialValues } = ctx;

  const hasInitialGrouping = !!initialValues?.grouping?.length; // siret is non editable once bsd contains grouped bsds
  const siretNonEditable = hasInitialGrouping && !!values?.id;
  const isGrouping = [EmitterType.Appendix2, EmitterType.Appendix1].some(
    type => values.emitter?.type === type
  );

  const isForeignShipOrPrivateIndividual =
    values.emitter?.isForeignShip || values.emitter?.isPrivateIndividual;

  const lockEmitterProducer =
    disabled || hasInitialGrouping || isForeignShipOrPrivateIndividual;

  // TRA-13753 - Un seul transporteur est autorisé en cas de bordereau de tournée dédiée
  const lockAppendix1 = (values.transporters ?? []).length > 1;

  const hasEcoOrganisme = values.ecoOrganisme;
  const emitterType = values.emitter?.type;

  useEffect(() => {
    if (values.emitter?.isForeignShip || values.emitter?.isPrivateIndividual) {
      setFieldValue("emitter.type", "PRODUCER");
      return;
    }
  }, [
    values.emitter?.isForeignShip,
    values.emitter?.isPrivateIndividual,
    setFieldValue
  ]);

  const [emitterTypeField] = useField("emitter.type") ?? "";

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
      return "Le numéro OMI (Organisation maritime international) de l'entreprise doit se composer des trois lettres OMI suivies de 7 chiffres (ex. OMI1234567)";
    }
    return undefined;
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}
      <div className="form__row">
        <label htmlFor="id_customId">Autre Numéro Libre (optionnel)</label>
        <Field
          id="id_customId"
          type="text"
          className="td-input"
          placeholder="Utilisez votre propre numéro de BSD si nécessaire."
          name="customId"
          disabled={disabled}
        />
      </div>

      <EcoOrganismes name="ecoOrganisme" disabled={disabled} />

      {isForeignShipOrPrivateIndividual && (
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
            disabled={lockEmitterProducer}
          />
          <Field
            name="emitter.type"
            id="OTHER"
            label={emitterTypeLabels["OTHER"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterProducer}
          />
          <Field
            name="emitter.type"
            id="APPENDIX2"
            label={emitterTypeLabels["APPENDIX2"]}
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterProducer}
          />

          <Field
            name="emitter.type"
            id="APPENDIX1"
            label={
              <div className="tw-flex tw-items-start">
                <span>{emitterTypeLabels["APPENDIX1"]}</span>
                <Tooltip
                  className="fr-ml-1w"
                  title={
                    "La collecte de tournée dédiée permet une collecte plus facile (ancienne annexe 1)," +
                    " mais son usage est conditionné à certains déchets et certains acteurs.\n" +
                    (lockAppendix1
                      ? "Impossible de sélectionner ce type de bordereau lorsque plusieurs transporteurs" +
                        " sont sélectionnés (multi-modal)."
                      : "")
                  }
                />
              </div>
            }
            component={RadioButton}
            onChange={onChangeEmitterType}
            disabled={lockEmitterProducer || lockAppendix1}
          />
        </fieldset>
        {hasEcoOrganisme &&
          emitterType &&
          [EmitterType.Producer, EmitterType.Other].includes(emitterType) && (
            <div className="fr-alert fr-alert--info fr-mt-2w fr-mb-2w">
              <p>
                Dans la partie <strong>Établissement émetteur</strong>, indiquez
                l'établissement (SIRET), la personne (particulier) ou le navire
                étranger (via le numéro OMI) qui est le producteur du déchet.
                L'éco-organisme ne doit pas être mentionné à la place de
                l’émetteur.
              </p>
            </div>
          )}
        {hasEcoOrganisme &&
          emitterType &&
          [EmitterType.Appendix2].includes(emitterType) && (
            <div className="fr-alert fr-alert--info fr-mt-2w fr-mb-2w">
              <p>
                Dans la partie <strong>Établissement émetteur</strong>, indiquez
                l'établissement (SIRET) ayant, par exemple, réalisé une
                opération de regroupement. L'éco-organisme ne doit pas être
                mentionné à la place de l’émetteur.
              </p>
            </div>
          )}
        {hasEcoOrganisme &&
          emitterType &&
          [EmitterType.Appendix1].includes(emitterType) && (
            <div className="fr-alert fr-alert--info fr-mt-2w fr-mb-2w">
              <p>
                Dans la partie <strong>Établissement émetteur</strong>, indiquez
                l'établissement (SIRET) du collecteur, et non celui du client ou
                producteur chez qui la collecte sera effectuée. L'éco-organisme
                ne doit pas être mentionné à la place de l’émetteur.
              </p>
            </div>
          )}
      </div>
      {!isGrouping && (
        <div className="form__row">
          <label>
            <Field
              disabled={disabled}
              type="checkbox"
              name="emitter.isPrivateIndividual"
              className="td-checkbox"
              onChange={e => {
                handleChange(e);
                setFieldValue("emitter.company", getInitialCompany(null));
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
                setFieldValue("emitter.company", getInitialCompany(null));
                setFieldValue("emitter.isPrivateIndividual", false);
              }}
            />
            L'émetteur est un navire étranger
          </label>
        </div>
      )}
      {!isGrouping && values.emitter?.isPrivateIndividual && (
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
      {!isGrouping && values.emitter?.isForeignShip && (
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

      {isGrouping && (
        <div className="tw-my-6">
          <h4 className="form__section-heading">Établissement émetteur</h4>

          <MyCompanySelector
            fieldName="emitter.company"
            siretEditable={!siretNonEditable}
            onSelect={company => {
              if (values.grouping?.length) {
                // make sure to empty appendix2 forms because new emitter may
                // not be recipient of the select appendix 2 forms
                setFieldValue("grouping", []);
              }
              if (values.emitter?.type === EmitterType.Appendix1) {
                setFieldValue("transporters", [
                  { ...initialFormTransporter, company }
                ]);
              }
            }}
            filter={companies => {
              if (values.emitter?.type === EmitterType.Appendix1) {
                const authorizedTypes = [
                  CompanyType.Collector,
                  CompanyType.Transporter,
                  CompanyType.Wasteprocessor,
                  CompanyType.WasteCenter
                ];
                return companies.filter(
                  company =>
                    !isForeignVat(company.orgId) &&
                    company.companyTypes.some(type =>
                      authorizedTypes.includes(type)
                    )
                );
              }
              return companies;
            }}
          />
        </div>
      )}

      {!isGrouping &&
        !values.emitter?.isPrivateIndividual &&
        !values.emitter?.isForeignShip && (
          <CompanySelector
            name="emitter.company"
            heading="Établissement émetteur"
            disabled={disabled}
          />
        )}

      {!isGrouping && (
        <WorkSite
          switchLabel="Je souhaite ajouter une adresse de chantier ou de collecte"
          headingTitle="Adresse chantier"
          designation="du chantier ou lieu de collecte"
          getInitialEmitterWorkSiteFn={getInitialEmitterWorkSite}
          disabled={disabled}
        />
      )}
    </>
  );
}

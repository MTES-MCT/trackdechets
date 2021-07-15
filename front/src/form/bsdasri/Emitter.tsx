import { RedErrorMessage, Label } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import React from "react";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import Packagings from "./components/packagings/Packagings";
import "./Bsdasri.scss";
import {
  getInitialEmitterWorkSite,
  getInitialQuantityFn,
} from "./utils/initial-state";
import WorkSite from "form/common/components/work-site/WorkSite";
import DateInput from "form/common/components/custom-inputs/DateInput";

import QuantityWidget from "./components/Quantity";

import { FillFieldsInfo, DisabledFieldsInfo } from "./utils/commons";
import classNames from "classnames";

import { BsdasriStatus, Bsdasri } from "generated/graphql/types";
import BsdasriSelector from "form/bsdasri/components/grouping/BsdasriSelector";
import { useParams } from "react-router-dom";
/**
 *
 * Emitter component with widget to group dasris
 */
export function RegroupingEmitter({ status, stepName }) {
  return (
    <BaseEmitter status={status} isRegrouping={true} stepName={stepName} />
  );
}
export default function Emitter({ status, stepName }) {
  return <BaseEmitter status={status} stepName={stepName} />;
}

export function BaseEmitter({ status, stepName, isRegrouping = false }) {
  const disabled = [
    BsdasriStatus.SignedByProducer,
    BsdasriStatus.Sent,
    BsdasriStatus.Received,
  ].includes(status);
  const emissionEmphasis = stepName === "emission";
  const { values } = useFormikContext<Bsdasri>();
  const { siret } = useParams<{ siret: string }>();
  const isUserCurrentEmitter = values?.emitter?.company?.siret === siret;
  return (
    <>
      {emissionEmphasis && <FillFieldsInfo />}
      {disabled && <DisabledFieldsInfo />}

      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      {isRegrouping && (
        <>
          <h3 className="form__section-heading">
            Bordereau dasri de groupement
          </h3>

          {values?.emitter?.company?.siret && !isUserCurrentEmitter && (
            <p className="notification notification--error">
              Pour préparer un bordereau de regroupement, vous devez y figurer
              comme producteur
            </p>
          )}
        </>
      )}

      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <CompanySelector
          disabled={disabled}
          name="emitter.company"
          heading="Personne responsable de l'élimination des déchets"
          optionalMail={true}
        />
      </div>

      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      {isRegrouping && (
        <>
          <h3 className="form__section-heading">
            Bordereau dasri de groupement
          </h3>

          {values?.emitter?.company?.siret && !isUserCurrentEmitter && (
            <p className="notification notification--error">
              Pour préparer un bordereau de regroupement, vous devez y figurer
              comme producteur
            </p>
          )}
        </>
      )}

      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <CompanySelector
          disabled={disabled}
          name="emitter.company"
          heading="Personne responsable de l'élimination des déchets"
          optionalMail={true}
        />
      </div>

      <WorkSite
        disabled={disabled}
        switchLabel="Je souhaite ajouter une adresse de collecte ou d'enlèvement"
        headingTitle="Adresse d'enlèvement"
        designation="du site d'enlèvement"
        getInitialEmitterWorkSiteFn={getInitialEmitterWorkSite}
      />

      <div className="form__row">
        <Label htmlFor="id_onBehalfOfEcoorganisme">
          <Field
            type="checkbox"
            className="td-checkbox"
            name="emitter.onBehalfOfEcoorganisme"
            id="id_onBehalfOfEcoorganisme"
            required={false}
            disabled={disabled}
          />
          Agit pour le compte de l'éco organisme agréé
        </Label>
        <RedErrorMessage name="emitter.onBehalfOfEcoorganisme" />
      </div>
      <h4 className="form__section-heading">Détail du déchet</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <fieldset>
          <legend className="tw-font-semibold">Code déchet</legend>
          <Field
            name="emission.wasteCode"
            id="18 01 03*"
            label="18 01 03* DASRI d'origine humaine"
            component={RadioButton}
            disabled={disabled}
          />
          <Field
            name="emission.wasteCode"
            id="18 01 02*"
            label="18 01 02* DASRI d'origine animale"
            component={RadioButton}
            disabled={disabled}
          />
        </fieldset>
      </div>
      {isRegrouping && isUserCurrentEmitter && (
        <BsdasriSelector name="regroupedBsdasris" />
      )}
      <h4 className="form__section-heading">Conditionnement</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <Field
          name="emission.wasteDetails.packagingInfos"
          component={Packagings}
          disabled={disabled}
        />
      </div>
      <h4 className="form__section-heading">Quantité remise</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <QuantityWidget
          disabled={disabled}
          switchLabel="Je souhaite ajouter une quantité"
          dasriSection="emission"
          getInitialQuantityFn={getInitialQuantityFn}
        />
      </div>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <label>
          Code ADR
          <Field
            disabled={disabled}
            type="text"
            name="emission.wasteDetails.onuCode"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emission.wasteDetails.onuCode" />
      </div>

      <div className="form__row">
        <label>
          Champ libre (optionnel)
          <Field
            disabled={disabled}
            component="textarea"
            name="emitter.customInfo"
            className="td-textarea"
          />
        </label>
      </div>

      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <label>
          Date de remise au collecteur transporteur
          <div className="td-date-wrapper">
            <Field
              name="emission.handedOverAt"
              component={DateInput}
              className="td-input"
              disabled={disabled}
            />
          </div>
        </label>
      </div>
    </>
  );
}

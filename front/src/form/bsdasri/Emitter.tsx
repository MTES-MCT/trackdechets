import { RedErrorMessage } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import React from "react";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import Packagings from "./components/packagings/Packagings";
import "./Bsdasri.scss";
import {
  getInitialEmitterPickupSiteFn,
  getInitialWeightFn,
} from "./utils/initial-state";
import PickupSite from "form/common/components/pickup-site/PickupSite";
import BsdasriEcoOrganismes from "./components/eco-organismes/EcoOrganismes";
import WeightWidget from "./components/Weight";

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

      {isRegrouping ? (
        <>
          <h3 className="form__section-heading">
            Bordereau de groupement DASRI
          </h3>

          {values?.emitter?.company?.siret && !isUserCurrentEmitter && (
            <p className="notification notification--error">
              Pour préparer un bordereau de regroupement, vous devez y figurer
              comme producteur
            </p>
          )}
        </>
      ) : (
        <h3 className="form__section-heading">Bordereau de suivi DASRI</h3>
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

      <PickupSite
        disabled={disabled}
        switchLabel="Je souhaite ajouter une adresse de collecte ou d'enlèvement"
        headingTitle="Adresse d'enlèvement"
        designation="du site d'enlèvement"
        getInitialEmitterPickupSiteFn={getInitialEmitterPickupSiteFn}
      />

      <BsdasriEcoOrganismes name="ecoOrganisme" />

      <h4 className="form__section-heading">Détail du déchet</h4>

      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <fieldset>
          <legend className="tw-font-semibold">Code déchet</legend>
          <Field
            name="waste.code"
            id="18 01 03*"
            label="18 01 03* DASRI d'origine humaine"
            component={RadioButton}
            disabled={disabled}
          />
          <Field
            name="waste.code"
            id="18 01 02*"
            label="18 01 02* DASRI d'origine animale"
            component={RadioButton}
            disabled={disabled}
          />
        </fieldset>
      </div>
      {isRegrouping && isUserCurrentEmitter && (
        <BsdasriSelector name="grouping" />
      )}
      <h4 className="form__section-heading">Conditionnement</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <Field
          name="emitter.emission.packagings"
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
        <WeightWidget
          disabled={disabled}
          switchLabel="Je souhaite ajouter un poids"
          dasriPath="emitter.emission"
          getInitialWeightFn={getInitialWeightFn}
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
            name="waste.adr"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="waste.adr" />
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
    </>
  );
}

import { RedErrorMessage } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import React from "react";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import Packagings from "../components/packagings/Packagings";
import "./Bsdasri.scss";
import {
  getInitialEmitterPickupSiteFn,
  getInitialWeightFn,
} from "../utils/initial-state";
import WorkSite from "form/common/components/work-site/WorkSite";
import BsdasriEcoOrganismes from "../components/eco-organismes/EcoOrganismes";
import WeightWidget from "../components/Weight";

import { FillFieldsInfo, DisabledFieldsInfo } from "../utils/commons";
import classNames from "classnames";

import { BsdasriStatus, Bsdasri, BsdasriType } from "generated/graphql/types";
import BsdasriSelector from "form/bsdasri/components/grouping/BsdasriSelector";
import BsdasriSelectorForSynthesis from "form/bsdasri/components/grouping/BsdasriSelectorForSynthesis";
import { useParams } from "react-router-dom";

export default function Emitter({ status, stepName, disabled = false }) {
  const editionDisabled =
    disabled ||
    [
      BsdasriStatus.SignedByProducer,
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
    ].includes(status);
  const { values } = useFormikContext<Bsdasri>();
  const isRegrouping = values.type === BsdasriType.Grouping;
  const isSynthesizing = values.type === BsdasriType.Synthesis;
  const emissionEmphasis = stepName === "emission";

  const { siret } = useParams<{ siret: string }>();
  const isUserCurrentEmitter = values?.emitter?.company?.siret === siret;
  return (
    <>
      {emissionEmphasis && <FillFieldsInfo />}
      {editionDisabled && <DisabledFieldsInfo />}
      {values.type === BsdasriType.Simple && (
        <h3 className="form__section-heading">Bordereau de suivi DASRI</h3>
      )}
      {isRegrouping && (
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
      )}
      {isSynthesizing && (
        <>
          <h3 className="form__section-heading">Bordereau de synthèse DASRI</h3>

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
          disabled={editionDisabled}
          name="emitter.company"
          heading="Personne responsable de l'élimination des déchets"
          optionalMail={true}
        />
      </div>

      <WorkSite
        disabled={editionDisabled}
        switchLabel="Je souhaite ajouter une adresse de collecte ou d'enlèvement"
        headingTitle="Adresse d'enlèvement"
        designation="du site d'enlèvement"
        getInitialEmitterWorkSiteFn={getInitialEmitterPickupSiteFn}
        modelKey="pickupSite"
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
            disabled={editionDisabled}
          />
          <Field
            name="waste.code"
            id="18 01 02*"
            label="18 01 02* DASRI d'origine animale"
            component={RadioButton}
            disabled={editionDisabled}
          />
        </fieldset>
      </div>
      {isRegrouping && isUserCurrentEmitter && (
        <BsdasriSelector name="grouping" />
      )}
      {isSynthesizing && isUserCurrentEmitter && (
        <BsdasriSelectorForSynthesis name="synthesizing" />
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
          disabled={editionDisabled}
        />
      </div>
      <h4 className="form__section-heading">Quantité remise</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        <WeightWidget
          disabled={editionDisabled}
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
            disabled={editionDisabled}
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
            disabled={editionDisabled}
            component="textarea"
            name="emitter.customInfo"
            className="td-textarea"
          />
        </label>
      </div>
    </>
  );
}

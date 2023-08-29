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
import BsdasriGroupingSelector from "form/bsdasri/components/grouping/BsdasriGroupingSelector";
import BsdasriSynthesisSelector from "form/bsdasri/components/grouping/BsdasriSynthesisSelector";
import { useParams } from "react-router-dom";
import Tooltip from "common/components/Tooltip";

export const customInfoToolTip =
  "Informations propres à l'entreprise. N'apparaît pas sur le bordereau.";
export default function GenericEmitter({ status, stepName, disabled = false }) {
  const { values } = useFormikContext<Bsdasri>();

  const isSynthesizing = values.type === BsdasriType.Synthesis;
  if (isSynthesizing) {
    return SynthesisEmitter({ status, stepName, editionDisabled: disabled });
  }

  return Emitter({ status, stepName, disabled });
}

export function SynthesisEmitter({
  status,
  stepName,
  editionDisabled = false,
  emissionEmphasis = false,
}) {
  const { values } = useFormikContext<Bsdasri>();
  const disabled = !!status && status !== BsdasriStatus.Initial;

  return (
    <>
      <h3 className="form__section-heading">Bordereau de synthèse DASRI</h3>
      <p>
        Votre établissement {values?.emitter?.company?.name} (
        {values?.emitter?.company?.siret}) apparaîtra comme le détenteur et le
        collecteur/transporteur sur ce bordereau de synthèse.
      </p>

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
            id="18 02 02*"
            label="18 02 02* DASRI d'origine animale"
            component={RadioButton}
            disabled={disabled}
          />
        </fieldset>
      </div>
      <BsdasriSynthesisSelector disabled={disabled} />
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
    </>
  );
}
export function Emitter({ status, stepName, disabled = false }) {
  const { values } = useFormikContext<Bsdasri>();
  const isRegrouping = values.type === BsdasriType.Grouping;

  const emissionEmphasis = stepName === "emission";
  const weightLabel = `Je souhaite préciser le poids ${
    isRegrouping
      ? "- report des poids des bsds sélectionnés, le cas échéant"
      : ""
  }`;
  const { siret } = useParams<{ siret: string }>();
  const isUserCurrentEmitter = values?.emitter?.company?.siret === siret;

  const editionAllowed =
    !disabled &&
    (status === BsdasriStatus.Initial ||
      // status is not set yet when a new bsdasri is created
      !status ||
      // emitter can still update any field after his own signature
      (status === BsdasriStatus.SignedByProducer && isUserCurrentEmitter));
  const editionDisabled = !editionAllowed;

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
            id="18 02 02*"
            label="18 02 02* DASRI d'origine animale"
            component={RadioButton}
            disabled={editionDisabled}
          />
        </fieldset>
      </div>
      {isRegrouping && isUserCurrentEmitter && (
        <BsdasriGroupingSelector name="grouping" />
      )}

      <h4 className="form__section-heading">Conditionnement</h4>
      <div
        className={classNames("form__row", {
          "field-emphasis": emissionEmphasis,
        })}
      >
        {isRegrouping && (
          <p className="tw-text-center tw-mb-2">
            Report des conditionnements sélectionnés / peut être modifié
          </p>
        )}
        <Field
          name="emitter.emission.packagings"
          component={Packagings}
          summaryHint="- Report des volumes sélectionnés"
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
          switchLabel={weightLabel}
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
          Mention ADR
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
          Champ libre (optionnel) <Tooltip msg={customInfoToolTip} />
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

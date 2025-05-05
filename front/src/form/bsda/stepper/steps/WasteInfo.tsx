import React, { lazy, useContext } from "react";
import { useParams } from "react-router-dom";
import { Field, useFormikContext } from "formik";
import NumberInput from "../../../common/components/custom-inputs/NumberInput";
import { getBsdaEditionDisabledSteps } from "../../utils/getBsdaEditionDisabledSteps";
import Tooltip from "../../../../Apps/common/Components/Tooltip/Tooltip";
import { Bsda, BsdaConsistence, BsdaType } from "@td/codegen-ui";
import { FieldSwitch } from "../../../../common/components";
import { BSDA_WASTES } from "@td/constants";
import { BsdaContext } from "../../FormContainer";
import EstimatedQuantityTooltip from "../../../../common/components/EstimatedQuantityTooltip";
import FormikPackagingList from "../../../../Apps/Forms/Components/PackagingList/FormikPackagingList";
import { bsdaPackagingTypes } from "../../../../Apps/Forms/Components/PackagingList/helpers";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
const TagsInput = lazy(
  () => import("../../../../common/components/tags-input/TagsInput")
);

export function WasteInfo({ disabled }) {
  const bsdaContext = useContext(BsdaContext);
  const { values } = useFormikContext<Bsda>();
  const { siret } = useParams<{ siret: string }>();
  const { disabledAfterEmission } = getBsdaEditionDisabledSteps(
    bsdaContext!,
    siret!
  );
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;
  const isGrouping = values?.type === BsdaType.Gathering;

  if (isEntreposageProvisoire) {
    return (
      <div className="notification">
        Vous effectuez une réexpédition. Les informations sur le déchet ont été
        automatiquement reportées et ne sont pas modifiables.
      </div>
    );
  }

  return (
    <>
      {(disabled || disabledAfterEmission) && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <h4 className="form__section-heading">Description du déchet</h4>
      <div className="form__row">
        <label>Code déchet</label>
        <Field
          as="select"
          name="waste.code"
          className="td-select"
          disabled={disabledAfterEmission || isGrouping}
        >
          <option />
          {BSDA_WASTES.map(item => (
            <option value={item.code} key={item.code}>
              {item.code} - {item.description}
            </option>
          ))}
        </Field>
      </div>

      <WasteInfoWorker disabled={disabled} />
    </>
  );
}

export function WasteInfoWorker({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Bsda>();
  const isDechetterie = values?.type === "COLLECTION_2710";

  return (
    <>
      <div className="form__row">
        <label>
          Code famille
          <Field
            as="select"
            name="waste.familyCode"
            className="td-select"
            disabled={disabled}
          >
            <option value="...">Sélectionnez une valeur...</option>
            <option value="1">
              1 - amiante pur utilisé en bourrage ou en sac
            </option>
            <option value="2">
              2 - amiante mélangé dans des poudres ou des produits minéraux sans
              liaison forte
            </option>
            <option value="3">
              3 - amiante intégré dans des liquides ou des solutions visqueuses
            </option>
            <option value="4">4 - amiante tissé ou tressé</option>
            <option value="5">5 - amiante en feuilles ou en plaques</option>
            <option value="6">6 - amiante lié à des matériaux inertes</option>
            <option value="7">
              7 - amiante noyé dans une résine ou une matière plastique
            </option>
            <option value="8">
              8 - amiante dans des matériels et équipements
            </option>
            <option value="9">
              9 - tous les matériaux contaminés susceptibles d'émettre des
              fibres
            </option>
          </Field>
        </label>
      </div>

      <div className="form__row">
        <label>
          Nom usuel du matériau
          <Field
            disabled={disabled}
            type="text"
            name="waste.materialName"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <div className="form__row fr-mt-8v">
        <ToggleSwitch
          onChange={e => {
            setFieldValue("waste.isSubjectToADR", e);
            if (!e) {
              setFieldValue("waste.adr", null);
            }
          }}
          inputTitle={"Test"}
          label="Le déchet est soumis à l'ADR"
          checked={values.waste?.isSubjectToADR ?? false}
        />
      </div>

      {values.waste?.isSubjectToADR && (
        <div className="form__row fr-ml-18v fr-mb-8v">
          <label>
            Mention au titre des règlements ADR/RID/ADN/IMDG
            <Field
              disabled={disabled}
              type="text"
              name="waste.adr"
              className="td-input"
            />
          </label>
        </div>
      )}

      <div className="form__row" style={{ flexDirection: "row" }}>
        <Field
          type="checkbox"
          component={FieldSwitch}
          name="waste.pop"
          disabled={disabled}
          label={
            <span>
              Le déchet contient des{" "}
              <a
                className="fr-link force-external-link-content force-underline-link"
                href="https://www.ecologique-solidaire.gouv.fr/polluants-organiques-persistants-pop"
                target="_blank"
                rel="noopener noreferrer"
              >
                polluants organiques persistants
              </a>
            </span>
          }
        />
        <div className="tw-ml-1">
          <Tooltip
            title="Le terme POP recouvre un ensemble de substances organiques qui
        possèdent 4 propriétés : persistantes, bioaccumulables, toxiques et mobiles."
          />
        </div>
      </div>

      <h4 className="form__section-heading">Conditionnement</h4>

      <FormikPackagingList
        fieldName="packagings"
        disabled={disabled}
        packagingTypes={bsdaPackagingTypes}
      />

      <div className="form__row">
        <label>
          Consistance
          <Field
            as="select"
            name="waste.consistence"
            id="id_mode"
            className="td-select td-input--small"
            disabled={disabled}
          >
            <option value={BsdaConsistence.Solide}>Solide</option>
            <option value={BsdaConsistence.Pulverulent}>Pulvérulents</option>
            <option value={BsdaConsistence.Other}>Autre</option>
          </Field>
        </label>
      </div>

      <h4 className="form__section-heading">Quantité</h4>
      <div className="form__row">
        <label>
          Quantité (en tonnes)
          <Field
            disabled={disabled}
            component={NumberInput}
            name="weight.value"
            className="td-input td-input--small"
            min="0"
            step="0.001"
          />
        </label>

        <div className="form__row">
          <label>
            <Field
              disabled={disabled}
              type="checkbox"
              name="weight.isEstimate"
              className="td-checkbox"
            />
            Ce poids est estimé <EstimatedQuantityTooltip />
          </label>
        </div>
      </div>

      {!isDechetterie && (
        <>
          <h4 className="form__section-heading">
            Numéros de scellés{" "}
            <Tooltip title="Ils peuvent être remplis au moment de la signature. Vous n'êtes pas obligé de les compléter à la création du bordereau." />
          </h4>
          <div className="form__row">
            <label htmlFor="waste.sealNumbers">
              Numéros de scellés{" "}
              <Tooltip title="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
            </label>
            <TagsInput name="waste.sealNumbers" disabled={disabled} />
          </div>
          <p>
            Vous avez saisi {values.waste?.sealNumbers?.length ?? 0} scellé(s)
            et{" "}
            {values.packagings?.reduce((prev, cur) => prev + cur.quantity, 0) ??
              0}{" "}
            conditionnement(s).
          </p>
        </>
      )}
    </>
  );
}

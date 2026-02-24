import React, { useMemo } from "react";
import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  FieldProps,
  useFormikContext
} from "formik";
import TdSwitch from "../../../../common/components/Switch";
import { Form, ParcelNumber as ParcelNumberType } from "@td/codegen-ui";
import Tooltip from "../../../../Apps/common/Components/Tooltip/Tooltip";
import { IconDelete1 } from "../../../../Apps/common/Components/Icons/Icons";
import TagsInput from "../../../../common/components/tags-input/TagsInput";
import { FormikParcelsVisualizer } from "../../../registry/common/ParcelsVisualizer/FormikParcelsVisualizer";

function ParcelSummaryList({
  parcels,
  onRemove
}: {
  parcels: ParcelNumberType[];
  onRemove: (idx: number) => void;
}) {
  if (!parcels.length) return null;

  return (
    <div className="tw-mb-4">
      <h6 className="tw-mb-2">Parcelles ajoutées :</h6>
      <ul className="tw-list-disc tw-ml-6">
        {parcels.map((parcel, idx) => {
          if (Object.keys(parcel).length === 0) return null;

          const parts: string[] = [];
          if (parcel.inseeCode) parts.push(`INSEE : ${parcel.inseeCode}`);
          if (parcel.parcelNumber || parcel.number)
            parts.push(`Parcelle : ${parcel.parcelNumber ?? parcel.number}`);
          if (
            parcel.prefix &&
            parcel.section &&
            (parcel.number || parcel.parcelNumber)
          )
            parts.push(
              `Parcelle détaillée : ${parcel.prefix}-${parcel.section}-${
                parcel.number ?? parcel.parcelNumber
              }`
            );
          if (parcel.lat !== undefined && parcel.lng !== undefined)
            parts.push(`GPS : ${parcel.lat}, ${parcel.lng}`);
          if (parcel.x !== undefined && parcel.y !== undefined)
            parts.push(`GPS (x/y) : ${parcel.x}, ${parcel.y}`);
          if (parcel.city) parts.push(`Adresse : ${parcel.city}`);
          if (parcel.featureId) parts.push(`FeatureId : ${parcel.featureId}`);
          if (parts.length === 0) parts.push("Parcelle incomplète");

          return (
            <li key={idx} className="tw-flex tw-items-center tw-mb-1">
              <span>{parts.join(" | ")}</span>
              <button
                type="button"
                className="tw-ml-2 tw-text-red-600 hover:tw-text-red-800"
                onClick={() => onRemove(idx)}
                aria-label="Supprimer"
              >
                <IconDelete1 aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ParcelNumbersSelector({ field }: FieldProps) {
  const { setFieldValue } = useFormikContext<Form>();
  const values: ParcelNumberType[] = field.value ?? [];
  const showParcelNumberSelector = values && values.length > 0;

  function handleparcelNumberToggle() {
    if (showParcelNumberSelector) {
      setFieldValue(field.name, [], false);
    } else {
      setFieldValue(field.name, [{}], false);
    }
  }

  return (
    <div>
      <div className="fr-mb-2w">
        <TdSwitch
          checked={showParcelNumberSelector}
          onChange={handleparcelNumberToggle}
          label="Je souhaite ajouter une parcelle cadastrale pour la traçabilité des terres et sédiments (optionnel)"
        />
      </div>

      {showParcelNumberSelector && (
        <FieldArray
          name={field.name}
          render={arrayHelpers => (
            <>
              <FormikParcelsVisualizer
                prefix={field.name + "."}
                disabled={false}
                onAddParcel={parcel => {
                  // Append new parcel if not duplicate
                  const city =
                    (parcel as any).address || (parcel as any).city || "";
                  const isDuplicate = values.some(
                    (p: ParcelNumberType) =>
                      p.inseeCode === parcel.inseeCode &&
                      p.parcelNumber === parcel.parcelNumber
                  );
                  if (!isDuplicate) {
                    setFieldValue(
                      field.name,
                      [...values, { ...parcel, city }],
                      false
                    );
                  }
                }}
              />
              <ParcelSummaryList
                parcels={values}
                onRemove={arrayHelpers.remove}
              />
            </>
          )}
        />
      )}

      <div className="form__row">
        <label htmlFor="wasteDetails.landIdentifiers">
          Identifiant(s) du terrain lorsque les terres ont été extraites d'un
          terrain placé en secteur d'information sur les sols au titre de
          l'article L. 125-6 (optionnel)
          <Tooltip
            className="fr-ml-1w"
            title="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun"
          />
        </label>
        <TagsInput name="wasteDetails.landIdentifiers" />
      </div>

      <div className="form__row">
        <label htmlFor="wasteDetails.analysisReferences">
          Références d'analyses (optionnel)
          <Tooltip
            className="fr-ml-1w"
            title="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun"
          />
        </label>
        <TagsInput name="wasteDetails.analysisReferences" />
      </div>
    </div>
  );
}

function ParcelDetails({ index, parcelNumber, arrayHelpers }) {
  const showParcelNumber = useMemo(() => {
    return (
      parcelNumber.prefix ||
      parcelNumber.section ||
      parcelNumber.number ||
      !("x" in parcelNumber)
    );
  }, [parcelNumber]);

  function handleGpsToggle(
    parcelNumber: ParcelNumber,
    index: number,
    arrayHelpers: FieldArrayRenderProps
  ) {
    if (showParcelNumber) {
      arrayHelpers.replace(index, {
        city: parcelNumber.city,
        inseeCode: parcelNumber.inseeCode,
        x: 0,
        y: 0
      });
    } else {
      arrayHelpers.replace(index, {
        city: parcelNumber.city,
        inseeCode: parcelNumber.inseeCode,
        prefix: "",
        number: "",
        section: ""
      });
    }
  }

  return (
    <>
      <div className="form__row">
        {showParcelNumber ? (
          <ParcelCadastral index={index} />
        ) : (
          <ParcelGps index={index} />
        )}
      </div>
      <div className="form__row">
        <TdSwitch
          checked={!showParcelNumber}
          onChange={() => handleGpsToggle(parcelNumber, index, arrayHelpers)}
          label="Le domaine n'est pas cadastré, je n'ai pas les numéros de parcelle,
          j'indique les coordonnées GPS (au format WGS 84)"
        />
      </div>
    </>
  );
}

function ParcelCadastral({ index }) {
  return (
    <div>
      <p>
        Si le numéro dont vous disposez ressemble à "000-AB-25", 000 est le
        prefixe, AB la section, et 25 le numéro de parcelle. Pour retrouver le
        numéro à partir d'une adresse, rendez-vous sur{" "}
        <a
          href="https://cadastre.data.gouv.fr/map"
          target="_blank"
          className="fr-link force-external-link-content force-underline-link"
          rel="noreferrer"
        >
          le site du cadastre
        </a>
        , ou{" "}
        <a
          href="https://errial.georisques.gouv.fr/#/"
          target="_blank"
          className="fr-link force-external-link-content force-underline-link"
          rel="noreferrer"
        >
          le site Errial
        </a>
      </p>
      <div className="tw-flex tw-justify-between">
        <div className="form__row">
          <label>
            Prefixe
            <Field
              type="text"
              name={`wasteDetails.parcelNumbers.${index}.prefix`}
              className="td-input td-input--small"
            />
          </label>
        </div>
        <div className="form__row">
          <label>
            Section
            <Field
              type="text"
              name={`wasteDetails.parcelNumbers.${index}.section`}
              className="td-input td-input--small"
            />
          </label>
        </div>
        <div className="form__row">
          <label>
            Numéro de parcelle
            <Field
              type="text"
              name={`wasteDetails.parcelNumbers.${index}.number`}
              className="td-input td-input--small"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ParcelGps({ index }) {
  return (
    <div>
      <div className="form__row">
        <label>
          Coordonnée latitude au format WGS 84 (entre -90° et 90°)
          <Field
            type="number"
            name={`wasteDetails.parcelNumbers.${index}.x`}
            className="td-input td-input--medium"
          />
        </label>
      </div>
      <div className="form__row">
        <label>
          Coordonnée longitude au format WGS 84 (entre -180° et 180°)
          <Field
            type="number"
            name={`wasteDetails.parcelNumbers.${index}.y`}
            className="td-input td-input--medium"
          />
        </label>
      </div>
    </div>
  );
}

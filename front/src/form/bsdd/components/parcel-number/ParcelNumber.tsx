import React, { useCallback, useMemo, useState } from "react";
import { FieldProps, useFormikContext } from "formik";
import { useLazyQuery } from "@apollo/client";
import {
  Form,
  ParcelNumber,
  Query,
  QueryGetCityNameByInseeCodeArgs,
  QueryGetCommuneByCoordinatesArgs
} from "@td/codegen-ui";

import TdSwitch from "../../../../common/components/Switch";
import Tooltip from "../../../../Apps/common/Components/Tooltip/Tooltip";
import TagsInput from "../../../../common/components/tags-input/TagsInput";
import {
  FormikParcelsVisualizer,
  type ParcelFromMap
} from "../../../registry/common/ParcelsVisualizer/FormikParcelsVisualizer";
import {
  GET_CITY_NAME_BY_INSEE_CODE,
  GET_COMMUNE_BY_COORDINATES
} from "./queries";

/**
 * Split a parcel number string "prefix-section-number" (e.g. "000-AB-25")
 * into its constituent parts.
 */
function splitParcelNumber(parcelNumber: string): {
  prefix: string;
  section: string;
  number: string;
} {
  const parts = parcelNumber.split("-");
  return {
    prefix: parts[0] ?? "",
    section: parts[1] ?? "",
    number: parts[2] ?? ""
  };
}

/**
 * Format a ParcelNumber as a display label.
 * Cadastre: "75056 | 000-AB-25 | Paris"
 * GPS:      "GPS : 48.852197, 2.310674"
 */
function formatParcelLabel(parcel: ParcelNumber): string {
  // GPS-based parcel (non-cadastered land)
  if (parcel.x != null && parcel.y != null && !parcel.prefix) {
    const label = `GPS : ${parcel.x}, ${parcel.y}`;
    return parcel.city ? `${label} | ${parcel.city}` : label;
  }

  // Cadastre-based parcel
  const parts: string[] = [];
  if (parcel.inseeCode) parts.push(parcel.inseeCode);
  if (parcel.prefix && parcel.section && parcel.number) {
    parts.push(`${parcel.prefix}-${parcel.section}-${parcel.number}`);
  }
  if (parcel.city) parts.push(parcel.city);

  return parts.join(" | ") || "Parcelle incomplète";
}

/**
 * Check whether a parcel already exists in the list.
 */
function isDuplicateParcel(
  existing: ParcelNumber[],
  newParcel: ParcelFromMap
): boolean {
  // GPS mode
  if (newParcel.x != null && newParcel.y != null) {
    return existing.some(p => p.x === newParcel.x && p.y === newParcel.y);
  }

  // Cadastre mode
  const { prefix, section, number } = splitParcelNumber(newParcel.parcelNumber);

  return existing.some(
    p =>
      p.inseeCode === newParcel.inseeCode &&
      p.prefix === prefix &&
      p.section === section &&
      p.number === number
  );
}

export function ParcelNumbersSelector({ field }: FieldProps) {
  const { setFieldValue } = useFormikContext<Form>();
  const values: ParcelNumber[] = useMemo(
    () => field.value ?? [],
    [field.value]
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(
    () => Array.isArray(field.value) && field.value.length > 0
  );

  const [getCityNameByInseeCode] = useLazyQuery<
    Pick<Query, "getCityNameByInseeCode">,
    QueryGetCityNameByInseeCodeArgs
  >(GET_CITY_NAME_BY_INSEE_CODE);

  const [getCommuneByCoordinates] = useLazyQuery<
    Pick<Query, "getCommuneByCoordinates">,
    QueryGetCommuneByCoordinatesArgs
  >(GET_COMMUNE_BY_COORDINATES);

  function handleParcelNumberToggle() {
    if (isEnabled) {
      setFieldValue(field.name, null, false);
      setIsEnabled(false);
    } else {
      setFieldValue(field.name, [], false);
      setIsEnabled(true);
    }
  }

  const handleAddParcel = useCallback(
    async (parcel: ParcelFromMap) => {
      if (isDuplicateParcel(values, parcel)) return;

      // GPS coordinate mode (non-cadastered land)
      if (parcel.x != null && parcel.y != null) {
        const { data } = await getCommuneByCoordinates({
          variables: { lat: parcel.x, lng: parcel.y }
        });
        const commune = data?.getCommuneByCoordinates;
        const newParcelNumber: ParcelNumber = {
          city: commune?.city ?? "",
          inseeCode: commune?.inseeCode,
          x: parcel.x,
          y: parcel.y
        };

        setFieldValue(field.name, [...values, newParcelNumber], false);

        return;
      }

      // Cadastre mode
      const { prefix, section, number } = splitParcelNumber(
        parcel.parcelNumber
      );

      const { data } = await getCityNameByInseeCode({
        variables: { inseeCode: parcel.inseeCode }
      });
      const city = data?.getCityNameByInseeCode ?? "";

      const newParcelNumber: ParcelNumber = {
        city,
        inseeCode: parcel.inseeCode,
        prefix,
        section,
        number
      };

      setFieldValue(field.name, [...values, newParcelNumber], false);
    },
    [
      values,
      field.name,
      setFieldValue,
      getCityNameByInseeCode,
      getCommuneByCoordinates
    ]
  );

  const handleRemoveParcel = useCallback(
    (index: number) => {
      setFieldValue(
        field.name,
        values.filter((_, i) => i !== index),
        false
      );
    },
    [values, field.name, setFieldValue]
  );

  const tags = useMemo(() => values.map(formatParcelLabel), [values]);

  return (
    <div>
      <div className="fr-mb-2w">
        <TdSwitch
          checked={isEnabled}
          onChange={handleParcelNumberToggle}
          label="Je souhaite ajouter une parcelle cadastrale pour la traçabilité des terres et sédiments (optionnel)"
        />
      </div>

      {isEnabled && (
        <FormikParcelsVisualizer
          disabled={false}
          onAddParcel={handleAddParcel}
          onRemoveParcel={handleRemoveParcel}
          tags={tags}
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

import React, { useCallback, useMemo, useState } from "react";
import { FieldProps, useFormikContext } from "formik";
import { Form, ParcelNumber } from "@td/codegen-ui";

import TdSwitch from "../../../../common/components/Switch";
import Tooltip from "../../../../Apps/common/Components/Tooltip/Tooltip";
import TagsInput from "../../../../common/components/tags-input/TagsInput";
import {
  FormikParcelsVisualizer,
  type ParcelFromMap
} from "../../../registry/common/ParcelsVisualizer/FormikParcelsVisualizer";

const CITY_API_URL = "https://geo.api.gouv.fr/communes";

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
 * Format a ParcelNumber as a display label (e.g. "75056 | 000-AB-25").
 */
function formatParcelLabel(parcel: ParcelNumber): string {
  const parts: string[] = [];
  if (parcel.inseeCode) parts.push(parcel.inseeCode);
  if (parcel.prefix && parcel.section && parcel.number) {
    parts.push(`${parcel.prefix}-${parcel.section}-${parcel.number}`);
  }
  if (parcel.city) parts.push(parcel.city);
  return parts.join(" | ") || "Parcelle incomplète";
}

/**
 * Fetch the city name from an INSEE code using the geo.api.gouv.fr API.
 */
async function fetchCityName(inseeCode: string): Promise<string> {
  try {
    const response = await fetch(`${CITY_API_URL}/${inseeCode}?fields=nom`);
    if (!response.ok) return "";
    const data = await response.json();
    return data?.nom ?? "";
  } catch {
    return "";
  }
}

/**
 * Check whether a parcel already exists in the list.
 */
function isDuplicateParcel(
  existing: ParcelNumber[],
  newParcel: ParcelFromMap
): boolean {
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

      const { prefix, section, number } = splitParcelNumber(
        parcel.parcelNumber
      );
      const city = await fetchCityName(parcel.inseeCode);

      const newParcelNumber: ParcelNumber = {
        city,
        inseeCode: parcel.inseeCode,
        prefix,
        section,
        number
      };

      setFieldValue(field.name, [...values, newParcelNumber], false);
    },
    [values, field.name, setFieldValue]
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

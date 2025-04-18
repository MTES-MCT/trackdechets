import React, { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  title?: string;
};

export function Parcels({ methods, disabled, prefix, title }: Props) {
  const coordinates = methods.getValues(`${prefix}Coordinates`);
  const [mode, setMode] = useState<"CODE" | "GPS">(
    coordinates?.length > 0 ? "GPS" : "CODE"
  );

  const {
    fields: inseeCodeFields,
    append: appendInseeCode,
    remove: removeInseeCode,
    replace: replaceInseeCode
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}InseeCodes`
  });

  const {
    append: appendNumber,
    remove: removeNumber,
    replace: replaceNumber
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}Numbers`
  });

  const {
    fields: coordinatesFields,
    append: appendCoordinate,
    remove: removeCoordinate,
    replace: replaceCoordinate
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}Coordinates`
  });

  function addParcel() {
    if (mode === "CODE") {
      appendInseeCode("");
      appendNumber("");
    }
    if (mode === "GPS") {
      appendCoordinate("");
    }
  }

  function deleteParcel(index: number) {
    if (mode === "CODE") {
      removeInseeCode(index);
      removeNumber(index);
    }
    if (mode === "GPS") {
      removeCoordinate(index);
    }
  }

  return (
    <div className="fr-col">
      <h4 className="fr-h4">{title ?? "Parcelles"}</h4>
      <div className="fr-col-6 fr-mb-2w">
        <Select
          label="Identification par"
          nativeSelectProps={{
            onChange: e => {
              const newMode = e.target.value as "CODE" | "GPS";
              if (newMode !== mode) {
                setMode(newMode as "CODE" | "GPS");

                // When switching from GPS to CODE, we need to clear the values
                replaceInseeCode(newMode === "CODE" ? [""] : []);
                replaceNumber(newMode === "CODE" ? [""] : []);
                replaceCoordinate(newMode === "CODE" ? [] : [""]);
              }
            }
          }}
          disabled={disabled}
        >
          <option value="CODE">Code INSEE de la parcelle</option>
          <option value="GPS">Coordonnées de la parcelle</option>
        </Select>
      </div>

      {mode === "CODE"
        ? inseeCodeFields.map((field, index) => (
            <div key={field.id} className="fr-mb-2w">
              <p className="fr-mb-2v tw-text-lg tw-font-bold">
                Parcelle n°{index + 1}
              </p>
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                <div className="fr-col-4">
                  <Input
                    label="Code INSEE"
                    nativeInputProps={{
                      type: "text",
                      disabled,
                      ...methods.register(`${prefix}InseeCodes.${index}`)
                    }}
                  />
                </div>
                <div className="fr-col-4">
                  <Input
                    label="Numéro de parcelle"
                    nativeInputProps={{
                      type: "text",
                      disabled,
                      ...methods.register(`${prefix}Numbers.${index}`)
                    }}
                  />
                </div>
                <div className="fr-col-3">
                  <Button
                    className="fr-mt-2v"
                    priority="secondary"
                    onClick={() => deleteParcel(index)}
                    disabled={disabled}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))
        : coordinatesFields.map((field, index) => (
            <div key={field.id} className="fr-mb-2w">
              <p className="fr-mb-2v tw-text-lg tw-font-bold">
                Parcelle n°{index + 1}
              </p>
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                <div className="fr-col-4">
                  <Input
                    label="Coordonnées GPS de la parcelle"
                    nativeInputProps={{
                      type: "text",
                      disabled,
                      ...methods.register(`${prefix}Coordinates.${index}`)
                    }}
                  />
                </div>
                <div className="fr-col-4">
                  <Button
                    className="fr-mt-2v"
                    priority="secondary"
                    onClick={() => deleteParcel(index)}
                    disabled={disabled}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}

      <Button
        className="fr-mt-2v"
        priority="secondary"
        onClick={addParcel}
        disabled={disabled}
      >
        Ajouter une parcelle
      </Button>
    </div>
  );
}

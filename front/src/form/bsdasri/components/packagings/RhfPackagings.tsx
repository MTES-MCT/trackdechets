import React, { useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { BsdasriPackagingType } from "@td/codegen-ui";
import { useFormContext, useFieldArray } from "react-hook-form";
import { PACKAGINGS_NAMES } from "../../utils/packagings";

export const emptyPackaging = {
  quantity: 1,
  type: null,
  volume: null,
  other: ""
};

const path = "destination.reception.packagings";

const BsdasriPackaging = ({ idx, remove, disabled }) => {
  const { register, getFieldState, getValues, setValue } = useFormContext();
  const name = `${path}.${idx}`;
  const packagingType = getValues(`${name}.type`);

  useEffect(() => {
    // reset `other` detail field when packaging type is not `Autre`
    if (packagingType !== BsdasriPackagingType.Autre) {
      setValue(`${name}.other`, "");
    }
  }, [packagingType, setValue, name]);

  // can't manage to retrieve typesafe state through formState
  const { error: quantityError } = getFieldState(`${name}.quantity`);
  const { error: typeError } = getFieldState(`${name}.type`);
  const { error: volumeError } = getFieldState(`${name}.volume`);
  const { error: otherError } = getFieldState(`${name}.other`);

  return (
    <div>
      {idx > 0 && <hr />}
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top fr-mb-1v">
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label="Nombre de coli(s)"
            state={quantityError && "error"}
            stateRelatedMessage={(quantityError?.message as string) ?? ""}
            nativeInputProps={{
              defaultValue: 1,
              ...register(`${name}.quantity`),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Type"
            disabled={disabled}
            nativeSelectProps={{ ...register(`${name}.type`) }}
            state={typeError && "error"}
            stateRelatedMessage={(typeError?.message as string) ?? ""}
          >
            {(
              Object.entries(PACKAGINGS_NAMES) as Array<
                [keyof typeof PACKAGINGS_NAMES, string]
              >
            ).map(([optionValue, optionLabel]) => (
              <option key={optionValue} value={optionValue} disabled={disabled}>
                {optionLabel}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label="Précisez"
            disabled={
              disabled ||
              getValues(`${name}.type`) !== BsdasriPackagingType.Autre
            }
            state={otherError && "error"}
            stateRelatedMessage={(otherError?.message as string) ?? ""}
            nativeInputProps={{
              defaultValue: "",
              ...register(`${name}.other`)
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label="Volume unitaire (l)"
            disabled={disabled}
            state={volumeError && "error"}
            stateRelatedMessage={(volumeError?.message as string) ?? ""}
            nativeInputProps={{
              ...register(`${name}.volume`),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
          />
        </div>

        <div className="fr-col-12 fr-col-md-1">
          {idx > 0 && !disabled && (
            <Button
              priority="tertiary"
              type="button"
              iconId="fr-icon-delete-bin-line"
              title="Supprimer ce conditionnement"
              nativeButtonProps={{ onClick: () => remove(idx) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const BsdasriPackagings = ({ disabled = false }) => {
  const { control } = useFormContext(); // retrieve  control for initial values
  const { fields, append, remove } = useFieldArray({
    control,
    name: path
  });

  return (
    <div>
      {fields.map((packaging, index) => (
        <BsdasriPackaging
          idx={index}
          key={packaging.id}
          remove={remove}
          disabled={disabled}
        />
      ))}
      {!disabled && (
        <div className="fr-col-12 fr-col-offset-6">
          <Button
            priority="secondary"
            type="button"
            onClick={() => append(emptyPackaging)}
          >
            Ajouter un conditionnement
          </Button>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";

import { useFormContext, useFieldArray } from "react-hook-form";
import { PACKAGINGS_NAMES } from "../../utils/packagings";

export const emptyPackaging = {
  quantity: 1,
  type: null,
  volume: null,
  other: ""
};

const path = "destination.reception.packagings";

const PaohPackaging = ({ idx, remove, disabled }) => {
  const { register, getFieldState } = useFormContext();
  const name = `${path}.${idx}`;

  const { error: typeError } = getFieldState(`${name}.type`);

  return (
    <div>
      {idx > 0 && <hr />}
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-1v">
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label="Nombre de coli(s)"
            nativeInputProps={{
              defaultValue: 1,
              ...register(`${name}.quantity`)
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
            <option value="">…</option>

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
            nativeInputProps={{
              ...register(`${name}.volume`),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
          ></Input>
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
  const { fields, append, remove } = useFieldArray({
    name: path
  });

  return (
    <div>
      {fields.map((packaging, index) => (
        <PaohPackaging
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

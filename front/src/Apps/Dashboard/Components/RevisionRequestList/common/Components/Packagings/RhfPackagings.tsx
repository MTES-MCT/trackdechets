import React, { useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import {
  BsdaPackagingType,
  BsdasriPackagingType,
  Packagings as BsddPackagingsType
} from "@td/codegen-ui";
import { useFormContext, useFieldArray } from "react-hook-form";
import { PACKAGINGS_BSD_NAMES } from "./packagings";
import { BsdTypename } from "../../../../../../common/types/bsdTypes";
import { selectPackagingRules } from "../../utils/rules";

export const emptyPackaging = {
  quantity: 1,
  type: null,
  volume: null,
  other: ""
};

const BsdPackaging = ({ bsdType, path, idx, remove, disabled }) => {
  const { register, getFieldState, getValues, setValue } = useFormContext();
  const name = `${path}.${idx}`;
  const packagingType = getValues(`${name}.type`);
  useEffect(() => {
    // reset `other` detail field when packaging type is not `Autre`
    if (
      ![
        BsdasriPackagingType.Autre,
        BsddPackagingsType.Autre,
        BsdaPackagingType.Other
      ].includes(packagingType)
    ) {
      setValue(`${name}.other`, "");
    }
  }, [packagingType, setValue, name]);

  // can't manage to retrieve typesafe state through formState
  const { error: quantityError } = getFieldState(`${name}.quantity`);
  const { error: typeError } = getFieldState(`${name}.type`);
  const { error: volumeError } = getFieldState(`${name}.volume`);
  const { error: otherError } = getFieldState(`${name}.other`);
  return (
    <>
      {idx > 0 && <hr />}
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-1v">
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label={
              bsdType === BsdTypename.Bsdd &&
              [BsddPackagingsType.Citerne, BsddPackagingsType.Benne].includes(
                packagingType
              )
                ? "Quantité"
                : "Nombre de coli(s)"
            }
            state={quantityError && "error"}
            stateRelatedMessage={(quantityError?.message as string) ?? ""}
            nativeInputProps={{
              defaultValue: 1,
              ...register(`${name}.quantity`),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
            disabled={
              bsdType === BsdTypename.Bsdd &&
              packagingType === BsddPackagingsType.Pipeline
            }
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
              Object.entries(PACKAGINGS_BSD_NAMES[bsdType]) as unknown as Array<
                [keyof typeof PACKAGINGS_BSD_NAMES, string]
              >
            ).map(([optionValue, optionLabel]) => (
              <option
                key={optionValue}
                value={optionValue}
                disabled={
                  disabled ||
                  selectPackagingRules(bsdType, getValues(path), optionValue)
                }
              >
                {optionLabel}
              </option>
            ))}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Input
            label="Précisez"
            disabled={
              disabled ||
              ![
                BsdasriPackagingType.Autre,
                BsddPackagingsType.Autre,
                BsdaPackagingType.Other
              ].includes(getValues(`${name}.type`))
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
            disabled={disabled || bsdType !== BsdTypename.Bsdasri}
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
    </>
  );
};

export const BsdPackagings = ({
  path,
  bsdType,
  disabledAddCta = false,
  disabled = false
}) => {
  const { control } = useFormContext(); // retrieve  control for initial values
  const { fields, append, remove } = useFieldArray({
    control,
    name: path
  });

  return (
    <>
      {fields.map((packaging, index) => (
        <BsdPackaging
          bsdType={bsdType}
          path={path}
          idx={index}
          key={packaging.id}
          remove={remove}
          disabled={disabled}
        />
      ))}
      {!disabled && (
        <div className="fr-col-12 fr-col-offset-8">
          <Button
            priority="secondary"
            type="button"
            onClick={() => append(emptyPackaging)}
            disabled={disabledAddCta}
          >
            Ajouter un conditionnement
          </Button>
        </div>
      )}
    </>
  );
};

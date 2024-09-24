import React, { useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useFormContext, useFieldArray } from "react-hook-form";
import { emptyPackaging } from "../initial-state";
import IdentificationNumber from "../../../../Forms/Components/IdentificationNumbers/IdentificationNumber";

const PaohPackaging = ({ idx, remove, paohType, disabled }) => {
  const { register, getFieldState, watch } = useFormContext();
  const name = `waste.packagings.${idx}`;

  const { error: typeError } = getFieldState(`${name}.type`);
  const { error: consistenceError } = getFieldState(`${name}.consistence`);
  const { error: identificationCodesError } = getFieldState(
    `${name}.identificationCodes`
  );
  const identificationCodes = watch(`${name}.identificationCodes`);

  return (
    <div>
      {idx > 0 && <hr />}
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-10v">
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Type"
            disabled={disabled}
            nativeSelectProps={{ ...register(`${name}.type`) }}
            state={typeError && "error"}
            stateRelatedMessage={(typeError?.message as string) ?? ""}
          >
            <option value="">…</option>

            {paohType === "PAOH" ? (
              <>
                <option value="LITTLE_BOX">Petite boîte</option>
                <option value="BIG_BOX">Grande boîte</option>
              </>
            ) : null}
            {paohType === "FOETUS" ? (
              <option value="RELIQUAIRE">Reliquaire</option>
            ) : null}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label="Volume (optionnel)"
            disabled={disabled}
            nativeInputProps={{
              ...register(`${name}.volume`),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
          ></Input>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="N° de contenant (optionnel)"
            disabled={disabled}
            nativeInputProps={{ ...register(`${name}.containerNumber`) }}
          ></Input>
        </div>
        <div className="fr-col-12 fr-col-md-1">
          <Input
            disabled={true}
            label="Unité(s)"
            nativeInputProps={{ defaultValue: 1 }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-1">
          {idx > 0 && !disabled && (
            <Button
              priority="tertiary"
              type="button"
              iconId="ri-delete-bin-line"
              title="Supprimer ce conditionnement"
              nativeButtonProps={{ onClick: () => remove(idx) }}
            />
          )}
        </div>
      </div>

      <div className="fr-mt-5v">
        <div className="fr-mt-3v">
          <p className="f fr-mb-1v">
            Codes d'identification utilisés par l'établissement
          </p>
          <IdentificationNumber
            disabled={disabled}
            name={`${name}.identificationCodes`}
            error={identificationCodesError && !identificationCodes.length}
            type={paohType}
          />
        </div>
      </div>
      <div className="fr-mt-10v">
        <RadioButtons
          orientation="horizontal"
          disabled={disabled}
          legend="Consistance"
          state={consistenceError && "error"}
          stateRelatedMessage={(consistenceError?.message as string) ?? ""}
          options={[
            {
              label: "Solide",
              nativeInputProps: {
                ...register(`${name}.consistence`),
                value: "SOLIDE"
              }
            },
            {
              label: "Liquide",
              nativeInputProps: {
                ...register(`${name}.consistence`),
                value: "LIQUIDE"
              }
            }
          ]}
        />
      </div>
    </div>
  );
};

export const PaohPackagings = ({ paohType, disabled = false }) => {
  const { fields, append, remove } = useFieldArray({
    name: "waste.packagings"
  });
  const { setValue, watch } = useFormContext();

  const packagings = watch("waste.packagings");

  useEffect(() => {
    setValue(`emitter.emission.detail.quantity`, packagings.length);
  }, [packagings, setValue]);

  return (
    <div className="fr-mb-2w">
      <h4 className="fr-h4">Conditionnement</h4>
      {fields.map((packaging, index) => (
        <PaohPackaging
          idx={index}
          key={packaging.id}
          remove={remove}
          disabled={disabled}
          paohType={paohType}
        />
      ))}
      {!disabled && (
        <div className="form__actions">
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

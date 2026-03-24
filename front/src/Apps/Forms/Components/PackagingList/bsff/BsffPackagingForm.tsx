import React, { useMemo } from "react";
import Select, { SelectProps } from "@codegouvfr/react-dsfr/Select";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import TagsInput from "../../TagsInput/TagsInput";

import {
  BsffPackagingInput,
  BsffPackagingType,
  Packagings
} from "@td/codegen-ui";

import { packagingTypeLabels } from "../helpers";
import { pluralize } from "@td/constants";

export type BsffPackagingFormProps = {
  packaging: BsffPackagingInput;
  packagingTypes: (Packagings | BsffPackagingType)[];
  packagingsLength: number;
  inputProps: {
    type: SelectProps["nativeSelectProps"];
    volume: InputProps["nativeInputProps"];
    quantity: InputProps["nativeInputProps"];
    other: InputProps["nativeInputProps"];
    identificationNumbers: {
      push: (v: string) => void;
      remove: (index: number) => void;
    };
    weight: InputProps["nativeInputProps"];
  };

  disabled?: boolean;

  errors?: Partial<Record<keyof BsffPackagingInput, string | undefined>>;

  touched?: Partial<Record<keyof BsffPackagingInput, boolean | undefined>>;
};

function BsffPackagingForm({
  packaging,
  packagingTypes,
  inputProps,
  disabled = false,
  errors,
  touched
}: BsffPackagingFormProps) {
  const packagingTypeOptions = useMemo(
    () =>
      packagingTypes.map(t => ({
        value: t,
        label: packagingTypeLabels[t]
      })),
    [packagingTypes]
  );

  const identificationNumbersLength =
    packaging.identificationNumbers?.length ?? 0;

  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters">
        {/* TYPE */}
        <div className="fr-col-md-5 fr-col-12">
          <Select
            label="Type de contenant"
            disabled={disabled}
            state={errors?.type && touched?.type ? "error" : "default"}
            stateRelatedMessage={errors?.type}
            nativeSelectProps={inputProps.type}
            className="fr-mb-2w"
          >
            <option value="">Sélectionnez une valeur</option>
            {packagingTypeOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {/* VOLUME */}
        <div className="fr-col-md-3 fr-col-12">
          <Input
            label="Volume en litres (litres)"
            disabled={disabled}
            state={errors?.volume && touched?.volume ? "error" : "default"}
            stateRelatedMessage={errors?.volume}
            nativeInputProps={{
              type: "number",
              step: "0.001",
              ...inputProps.volume
            }}
          />
        </div>

        {/* NUMERO */}
        <div className="fr-col-md-2 fr-col-12">
          <Input
            label="Nombre"
            disabled={disabled}
            state={errors?.quantity && touched?.quantity ? "error" : "default"}
            stateRelatedMessage={errors?.quantity}
            nativeInputProps={inputProps.quantity}
          />
        </div>

        {/* POIDS */}
        <div className="fr-col-md-2 fr-col-12">
          <Input
            label="Poids en kg"
            disabled={disabled}
            state={errors?.weight && touched?.weight ? "error" : "default"}
            stateRelatedMessage={errors?.weight}
            nativeInputProps={{
              type: "number",
              step: "0.001",
              ...inputProps.weight
            }}
          />
        </div>

        {/* AUTRE */}
        {packaging.type === BsffPackagingType.Autre && (
          <div className="fr-col-12">
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-md-6 fr-col-12">
                <Input
                  label="Nom du type de conditionnement"
                  disabled={disabled}
                  state={errors?.other && touched?.other ? "error" : "default"}
                  stateRelatedMessage={errors?.other}
                  nativeInputProps={inputProps.other}
                />
              </div>
            </div>
          </div>
        )}
        <div className="fr-col-12">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-6 fr-col-12">
              <TagsInput
                label="N° de contenant (optionnel)"
                tags={packaging.identificationNumbers ?? []}
                disabled={disabled}
                onAddTag={tag => inputProps.identificationNumbers.push(tag)}
                onDeleteTag={idx =>
                  inputProps.identificationNumbers.remove(idx)
                }
              />

              <p className="fr-info-text">
                Vous avez saisi {identificationNumbersLength}{" "}
                {pluralize("numéro", identificationNumbersLength)} pour{" "}
                {Number(packaging.quantity)}{" "}
                {pluralize("contenant", packaging.quantity)}
              </p>
            </div>
          </div>
        </div>
        {/* ALERT METIER */}
        {packaging.volume &&
          packaging.weight &&
          packaging.weight > packaging.volume * 1.5 && (
            <Alert
              severity="warning"
              description="Poids trop élevé par rapport au volume"
              small
            />
          )}
      </div>
    </>
  );
}

export default BsffPackagingForm;

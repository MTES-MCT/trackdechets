import Select, { SelectProps } from "@codegouvfr/react-dsfr/Select";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import React from "react";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import { numberToString } from "../../../Dashboard/Creation/bspaoh/utils/numbers";
import TagsInput from "../TagsInput/TagsInput";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";

type PackagingFormProps = {
  packaging: PackagingInfoInput;
  inputProps: {
    type: SelectProps["nativeSelectProps"];
    volume: InputProps["nativeInputProps"];
    quantity: InputProps["nativeInputProps"];
    other: InputProps["nativeInputProps"];
    identificationNumbers: {
      push: (v: string) => void;
      remove: (index: number) => void;
    };
  };
  packagingTypeOptions: { value: Packagings; label: string }[];
  disabled?: boolean;
  errors?: Partial<Record<keyof PackagingInfoInput, string>>;
  touched?: Partial<Record<keyof PackagingInfoInput, boolean>>;
};

function PackagingForm({
  packaging,
  inputProps,
  packagingTypeOptions,
  disabled = false,
  errors,
  touched
}: PackagingFormProps) {
  const maxQuantity =
    packaging.type === Packagings.Citerne || packaging.type === Packagings.Benne
      ? 2
      : null;

  const volumeUnit = packaging.type === Packagings.Benne ? "m3" : "litres";
  const packagingVolume =
    packaging.type === Packagings.Benne && packaging.volume
      ? // convertit l'affichage du volume en m3
        new Decimal(packaging.volume).dividedBy(1000).toNumber()
      : packaging.volume;

  const identificationNumbersLength =
    packaging.identificationNumbers?.length ?? 0;

  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-6 fr-col-12">
          <Select
            label="Type"
            disabled={disabled}
            state={errors?.type && touched?.type ? "error" : "default"}
            stateRelatedMessage={errors?.type}
            nativeSelectProps={inputProps.type}
            className="fr-mb-2w"
          >
            <option value="">...</option>
            {packagingTypeOptions.map(({ value, label }, idx) => (
              <option value={value} key={idx}>
                {label}
              </option>
            ))}
          </Select>
          {(packaging.type === Packagings.Citerne ||
            packaging.type === Packagings.Benne) && (
            <p className="fr-info-text">
              Un conditionnement en {packaging.type.toLowerCase()} exclut le
              mélange avec tout autre type de conditionnement
            </p>
          )}
        </div>
        <div className="fr-col-md-4 fr-col-12">
          <NonScrollableInput
            label={`Volume en ${volumeUnit} (optionnel)`}
            className="fr-mb-2w"
            disabled={disabled}
            state={errors?.volume && touched?.volume ? "error" : "default"}
            stateRelatedMessage={errors?.volume}
            nativeInputProps={{
              type: "number",
              inputMode: "decimal",
              step: "0.001", // mili-litres
              value: packagingVolume ?? "",
              ...inputProps.volume
            }}
          />

          <p className="fr-info-text">
            {volumeUnit === "litres"
              ? `Soit ${numberToString((packaging.volume || 0) / 1000)} m3`
              : `Soit ${numberToString(packaging.volume || 0, 0)} litres`}
          </p>
        </div>
        <div className="fr-col-md-2 fr-col-12">
          <NonScrollableInput
            label="Nombre"
            className="fr-mb-2w"
            state={errors?.quantity && touched?.quantity ? "error" : "default"}
            stateRelatedMessage={errors?.quantity}
            disabled={disabled}
            nativeInputProps={{
              type: "number",
              inputMode: "numeric",
              step: "1", // mili-litres
              ...(maxQuantity ? { max: maxQuantity } : {}),
              ...inputProps.quantity
            }}
          />
        </div>
      </div>
      {packaging.type === Packagings.Autre && (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Input
              label="Nom du type de contenant"
              disabled={disabled}
              state={errors?.other && touched?.other ? "error" : "default"}
              stateRelatedMessage={errors?.other}
              nativeInputProps={inputProps.other}
            />
          </div>
        </div>
      )}
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-10 fr-col-12">
          <TagsInput
            label="N° de contenant (optionnel)"
            tags={packaging.identificationNumbers ?? []}
            disabled={disabled}
            onAddTag={tag => inputProps.identificationNumbers.push(tag)}
            onDeleteTag={idx => inputProps.identificationNumbers.remove(idx)}
          />

          <p className="fr-info-text">
            Vous avez saisi {identificationNumbersLength}{" "}
            {pluralize("numéro", identificationNumbersLength)} pour{" "}
            {Number(packaging.quantity)}{" "}
            {pluralize("contenant", packaging.quantity)}
          </p>
        </div>
      </div>
    </>
  );
}

export default PackagingForm;

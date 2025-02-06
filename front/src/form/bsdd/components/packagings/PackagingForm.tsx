import Select from "@codegouvfr/react-dsfr/Select";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import React from "react";
import NonScrollableInput from "../../../../Apps/common/Components/NonScrollableInput/NonScrollableInput";
import Input from "@codegouvfr/react-dsfr/Input";
import { numberToString } from "../../../../Apps/Dashboard/Creation/bspaoh/utils/numbers";
import TagsInput from "../../../../Apps/Forms/Components/TagsInput/TagsInput";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";

type PackagingFormProps = {
  packaging: PackagingInfoInput;
  setPackaging: (packaging: PackagingInfoInput) => void;
  packagingTypeOptions: { value: Packagings; label: string }[];
  disabled?: boolean;
};

function PackagingForm({
  packaging,
  setPackaging,
  packagingTypeOptions,
  disabled = false
}: PackagingFormProps) {
  const maxQuantity =
    packaging.type === Packagings.Citerne || packaging.type === Packagings.Benne
      ? 2
      : null;

  const quantityError =
    maxQuantity && packaging.quantity > maxQuantity
      ? `Impossible de saisir plus de 2 ${packaging.type.toLocaleLowerCase()}s`
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
            nativeSelectProps={{
              value: packaging.type,
              onChange: event => {
                const packagingType = event.target.value as Packagings;
                setPackaging({
                  ...packaging,
                  type: packagingType,
                  other: packagingType === Packagings.Autre ? "" : null
                });
              }
            }}
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
            nativeInputProps={{
              type: "number",
              inputMode: "decimal",
              step: "0.001", // mili-litres
              value: packagingVolume ?? "",
              onChange: event => {
                const volume = () => {
                  const v = event.target.value;
                  if (v === "") return v;
                  if (packaging.type === Packagings.Benne) {
                    // le volume doit être passé en litres à l'API
                    return new Decimal(v).times(1000).toNumber();
                  }
                  return Number(v);
                };

                setPackaging({
                  ...packaging,
                  volume: volume() as number
                });
              }
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
            state={quantityError ? "error" : "default"}
            stateRelatedMessage={quantityError}
            disabled={disabled}
            nativeInputProps={{
              type: "number",
              inputMode: "numeric",
              step: "1", // mili-litres
              ...(maxQuantity ? { max: maxQuantity } : {}),
              value: packaging.quantity,
              onChange: event => {
                const quantity = event.target.value;
                setPackaging({
                  ...packaging,
                  quantity:
                    quantity === "" ? (quantity as any) : Number(quantity)
                });
              }
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
              nativeInputProps={{
                value: packaging.other ?? "",
                onChange: event =>
                  setPackaging({ ...packaging, other: event.target.value })
              }}
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
            onAddTag={tag =>
              setPackaging({
                ...packaging,
                identificationNumbers: [
                  ...(packaging.identificationNumbers ?? []),
                  tag
                ]
              })
            }
            onDeleteTag={idx =>
              setPackaging({
                ...packaging,
                identificationNumbers: packaging.identificationNumbers?.filter(
                  (_, index) => index !== idx
                )
              })
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
    </>
  );
}

export default PackagingForm;

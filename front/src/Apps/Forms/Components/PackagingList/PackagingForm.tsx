import Select, { SelectProps } from "@codegouvfr/react-dsfr/Select";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import React from "react";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import { numberToString } from "../../../Dashboard/Creation/bspaoh/utils/numbers";
import TagsInput from "../TagsInput/TagsInput";
import { pluralize } from "@td/constants";

export type PackagingFormProps = {
  // Valeur de `packaging` provenant du store Formik ou RHF
  packaging: PackagingInfoInput;
  // Nombre total de conditionnement qui permet de contrôler
  // l'affichage des types de conditionnements que l'on peut ajouter.
  packagingsLength: number;
  // Props que l'on passe aux différents champs du formulaire
  // pour qu'ils soient contrôlés via Formik (`getFieldProps(fieldName)`)
  // ou RHF (`register(fieldName)`)
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
  // Permet de griser les champs pour les rendre non éditable
  disabled?: boolean;
  // Erreurs sur chacun des champs
  errors?: Partial<Record<keyof PackagingInfoInput, string>>;
  // Permet de savoir si les différents champs ont été visité
  touched?: Partial<Record<keyof PackagingInfoInput, boolean>>;
};

const packagingTypeOptions = [
  { value: Packagings.Benne, label: "Benne" },
  { value: Packagings.Citerne, label: "Citerne" },
  { value: Packagings.Fut, label: "Fût" },
  { value: Packagings.Grv, label: "Grand Récipient Vrac (GRV)" },
  { value: Packagings.Autre, label: "Autre" }
];

/**
 * Formulaire permettant de renseigner un conditionnement (type, volume, nombre, N°).
 * Ce composant est indépendant de la librairie Formik ou RHF utilisée.
 * Voir les deux implémentations concrètes <FormikPackagingForm /> et <RHFPackagingForm />
 */
function PackagingForm({
  packaging,
  packagingsLength,
  inputProps,
  disabled = false,
  errors,
  touched
}: PackagingFormProps) {
  // On ne peut pas ajouter plus de deux citernes ou 2 bennes
  const maxQuantity =
    packaging.type === Packagings.Citerne || packaging.type === Packagings.Benne
      ? 2
      : null;

  // Cas particulier : le volume d'une benne s'exprime en m3
  const volumeUnit = packaging.type === Packagings.Benne ? "m3" : "litres";

  const identificationNumbersLength =
    packaging.identificationNumbers?.length ?? 0;

  const options =
    packagingsLength > 1
      ? // Un conditionnement en citerne ou benne exclut le mélange avec
        // tout autre type de conditionnement
        packagingTypeOptions.filter(
          o => o.value !== Packagings.Citerne && o.value !== Packagings.Benne
        )
      : packagingTypeOptions;

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
            {options.map(({ value, label }, idx) => (
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
              step: "1",
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
              step: "1",
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

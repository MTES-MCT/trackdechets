import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import Select, { SelectProps } from "@codegouvfr/react-dsfr/Select";
import {
  BsffPackagingInput,
  BsffPackagingType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";
import { packagingTypeLabels } from "../../../../Forms/Components/PackagingList/helpers";
import React, { useMemo } from "react";
import NonScrollableInput from "../../../../common/Components/NonScrollableInput/NonScrollableInput";
import { numberToString } from "../../bspaoh/utils/numbers";
import Alert from "@codegouvfr/react-dsfr/Alert";

export type PackagingFormProps = {
  // Valeur de `packaging` provenant du store Formik ou RHF
  packaging: PackagingInfoInput | BsffPackagingInput;
  // Nombre total de conditionnement qui permet de contrôler
  // l'affichage des types de conditionnements que l'on peut ajouter.
  packagingsLength: number;
  // Liste des types de conditionnement possible
  // À ajuster en fonction du type de bordereau
  packagingTypes: (Packagings | BsffPackagingType)[];
  // Props que l'on passe aux différents champs du formulaire
  // pour qu'ils soient contrôlés via Formik (`getFieldProps(fieldName)`)
  // ou RHF (`register(fieldName)`)
  inputProps: {
    type: SelectProps["nativeSelectProps"];
    volume: InputProps["nativeInputProps"];
    weight: InputProps["nativeInputProps"];
    other: InputProps["nativeInputProps"];
    numero: InputProps["nativeInputProps"];
  };
  // Permet de griser les champs pour les rendre non éditable
  disabled?: boolean;
  // Erreurs sur chacun des champs
  errors?: Partial<
    Record<keyof (PackagingInfoInput | BsffPackagingInput), string>
  >;
  // Permet de savoir si les différents champs ont été visité
  touched?: Partial<
    Record<keyof (PackagingInfoInput | BsffPackagingInput), boolean>
  >;
};

/**
 * Formulaire permettant de renseigner un conditionnement (type, volume, nombre, N°).
 * Ce composant est indépendant de la librairie Formik ou RHF utilisée.
 * Voir les deux implémentations concrètes <FormikPackagingForm /> et <RHFPackagingForm />
 */
function BsffPackagingForm({
  packaging,
  packagingsLength,
  packagingTypes,
  inputProps,
  disabled = false,
  errors,
  touched
}: PackagingFormProps) {
  const packagingTypeOptions = useMemo(
    () =>
      packagingTypes.map(t => ({
        value: t,
        label: packagingTypeLabels[t]
      })),
    [packagingTypes]
  );

  return (
    <>
      {/* ALERT METIER */}
      {packaging.volume &&
        packaging.weight &&
        packaging.weight > packaging.volume * 1.5 && (
          <div className="fr-mb-4w">
            <Alert
              severity="warning"
              description="Le poids renseigné semble trop élevé au regard du volume du contenant."
              small
            />
          </div>
        )}
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-6 fr-col-12">
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
        <div className="fr-col-md-4 fr-col-12">
          <NonScrollableInput
            label={`Volume en litres (optionnel)`}
            className="fr-mb-2w"
            disabled={disabled}
            state={errors?.volume && touched?.volume ? "error" : "default"}
            stateRelatedMessage={errors?.volume}
            nativeInputProps={{
              type: "number",
              inputMode: "decimal",
              step: "0.001",
              ...inputProps.volume
            }}
          />

          <p className="fr-info-text">
            Soit {numberToString((packaging.volume || 0) / 1000, 3)} m3
          </p>
        </div>
        <div className="fr-col-md-2 fr-col-12">
          <NonScrollableInput
            label="Poids en kg"
            className="fr-mb-2w"
            disabled={disabled}
            state={errors?.weight && touched?.weight ? "error" : "default"}
            stateRelatedMessage={errors?.weight}
            nativeInputProps={{
              type: "number",
              inputMode: "decimal",
              step: "0.001",
              ...inputProps.weight
            }}
          />
        </div>
      </div>
      {(packaging.type === Packagings.Autre ||
        packaging.type === BsffPackagingType.Autre) && (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Input
              label="Autre contenant (préciser)"
              disabled={disabled}
              state={errors?.other && touched?.other ? "error" : "default"}
              stateRelatedMessage={errors?.other}
              nativeInputProps={inputProps.other}
            />
          </div>
        </div>
      )}
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-12 fr-col-12">
          <Input
            label="N° de contenant (optionnel)"
            disabled={disabled}
            state={errors?.numero && touched?.numero ? "error" : "default"}
            stateRelatedMessage={errors?.numero}
            nativeInputProps={inputProps.numero}
          />
        </div>
      </div>
    </>
  );
}

export default BsffPackagingForm;

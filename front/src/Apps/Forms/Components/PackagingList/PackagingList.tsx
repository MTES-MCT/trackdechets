import {
  BsdaPackagingType,
  BsffPackagingType,
  BsffType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";
import React from "react";
import { emptyBsddPackaging } from "./helpers";
import { PackagingFormProps } from "./PackagingForm";
import { useFormContext, useWatch } from "react-hook-form";

// Props passé à l'implémentation concrète (Formik ou RHF)
// de PackagingForm dans le composant fonction enfant.
export type RenderPackagingFormProps = Omit<
  PackagingFormProps,
  "inputProps" | "errors" | "touched"
> & {
  // Nom du champ de liste des conditionnements
  fieldName: string;
  // Index du conditionnement courant
  idx: number;
};

export type PackagingListProps = {
  // Nom du champ de liste des conditionnements
  fieldName: string;
  // Liste des types de conditionnement possible
  // À ajuster en fonction du type de bordereau
  packagingTypes: (Packagings | BsdaPackagingType | BsffPackagingType)[];
  // Valeur de `packagingInfos` provenant du store Formik ou RHF
  packagingInfos: PackagingInfoInput[];
  // Permet de griser les champs
  disabled?: boolean;
  // Ajoute un conditionnement à la fin de la liste
  push: (packaging: PackagingInfoInput) => void;
  // Supprime le conditionnement situé à l'index `idx`
  remove: (idx: number) => void;
  // Implémentation concrète de <PackagingForm />
  children: React.FC<RenderPackagingFormProps>;
  // type du bordereau
  type: "BSDA" | "BSFF" |  "BSDD";
};

function PackagingList({
  fieldName,
  packagingTypes,
  packagingInfos,
  push,
  remove,
  disabled = false,
  children,
  type
}: PackagingListProps) {
  const { control } = useFormContext();
  let canAdd = true;
  if (type === "BSFF") {
    const bsffType = useWatch({ control, name: "type" });
    const maxPackagings =
      bsffType === BsffType.Reconditionnement ? 1 : Infinity;
    canAdd = packagingInfos.length < maxPackagings;
  } else {
    // RG BSDA : ne pas permettre plus de 1 citerne, benne, pipeline
    canAdd = packagingInfos.every(
      p =>
        p.type !== Packagings.Citerne &&
        p.type !== Packagings.Benne &&
        p.type !== Packagings.Pipeline
    );
  }

  return (
    <>
      {packagingInfos
        .filter(p => p.type !== Packagings.Pipeline)
        .map((p, idx) => (
          <div key={idx}>
            {children({
              fieldName,
              packagingTypes,
              packagingsLength: packagingInfos.length,
              idx,
              packaging: p,
              disabled
            })}
            {packagingInfos.length > 1 && (
              <>
                <button
                  type="button"
                  disabled={disabled}
                  className="fr-btn fr-btn--tertiary fr-mb-2w"
                  onClick={() => {
                    remove(idx);
                  }}
                >
                  Supprimer
                </button>
                <hr />
              </>
            )}
          </div>
        ))}
      {!disabled && canAdd && (
        <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
          <button
            type="button"
            disabled={disabled}
            className="fr-btn fr-btn--secondary"
            onClick={() => {
              push(emptyBsddPackaging);
            }}
          >
            Ajouter un conditionnement
          </button>
        </div>
      )}
      {type === "BSFF" && packagingInfos.length >= 1 && (
        <div className="fr-alert fr-alert--info fr-mb-4w">
          {`Un seul contenant est autorisé dans le cadre d'un reconditionnement.`}
        </div>
      )}
    </>
  );
}

export default PackagingList;

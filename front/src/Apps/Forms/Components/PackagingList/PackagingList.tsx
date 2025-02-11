import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import React from "react";
import { emptyPackaging } from "./helpers";
import { PackagingFormProps } from "./PackagingForm";

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
};

function PackagingList({
  fieldName,
  packagingInfos,
  push,
  remove,
  disabled = false,
  children
}: PackagingListProps) {
  const showAddButton = packagingInfos.every(
    p =>
      p.type !== Packagings.Citerne &&
      p.type !== Packagings.Benne &&
      p.type !== Packagings.Pipeline
  );

  return (
    <>
      {packagingInfos
        .filter(p => p.type !== Packagings.Pipeline)
        .map((p, idx) => (
          <div key={idx}>
            {children({
              fieldName,
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
      {showAddButton && (
        <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
          <button
            type="button"
            disabled={disabled}
            className="fr-btn fr-btn--secondary"
            onClick={() => {
              push(emptyPackaging);
            }}
          >
            Ajouter un conditionnement
          </button>
        </div>
      )}
    </>
  );
}

export default PackagingList;

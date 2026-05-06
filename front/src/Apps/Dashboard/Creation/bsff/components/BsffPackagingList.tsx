import {
  BsffPackagingType,
  BsffType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";
import React from "react";
import { PackagingFormProps } from "./BsffPackagingForm";
import { useWatch } from "react-hook-form";
import { emptyBsddPackaging } from "../../../../Forms/Components/PackagingList/helpers";

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
  packagingTypes: (Packagings | BsffPackagingType)[];
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

function BsffPackagingList({
  fieldName,
  packagingTypes,
  packagingInfos,
  push,
  remove,
  disabled = false,
  children
}: PackagingListProps) {
  // récupère le type BSFF
  const bsffType = useWatch({
    name: "type"
  });

  // RG métier

  const isReconditionnement = bsffType === BsffType.Reconditionnement;
  const isGroupement = bsffType === BsffType.Groupement;
  const isReexpedition = bsffType === BsffType.Reexpedition;
  const showbutton = isGroupement || isReexpedition;
  const repackaging: any[] = useWatch({ name: "repackaging" }) ?? [];

  const tableIds = new Set(
    isReconditionnement ? repackaging.map(r => r.id).filter(Boolean) : []
  );

  const isFromTable = (p: PackagingInfoInput) =>
    isReconditionnement && tableIds.has((p as any).id);

  const manualCount = isReconditionnement
    ? packagingInfos.filter(p => !isFromTable(p)).length
    : 0;

  const canAdd = !isReconditionnement || manualCount < 1;
  return (
    <>
      {/* MESSAGE INFO */}
      {isReconditionnement && manualCount >= 1 && (
        <div className="fr-alert fr-alert--info fr-mb-4w">
          Un seul contenant est autorisé dans le cadre d'un reconditionnement.
          Ex. : 1 citerne
        </div>
      )}
      {packagingInfos.map((p, idx) => {
        const fromTable = isFromTable(p);

        return (
          <div key={idx}>
            {children({
              fieldName,
              packagingTypes,
              packagingsLength: packagingInfos.length,
              idx,
              packaging: p,
              disabled: disabled || fromTable
            })}

            {!fromTable && packagingInfos.length > 1 && !showbutton && (
              <>
                <button
                  type="button"
                  disabled={disabled}
                  className="fr-btn fr-btn--tertiary fr-mb-2w"
                  onClick={() => remove(idx)}
                >
                  Supprimer
                </button>
                <hr />
              </>
            )}
          </div>
        );
      })}
      {/* BOUTON AJOUT */}
      {!disabled && canAdd && !showbutton && (
        <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
          <button
            type="button"
            className="fr-btn fr-btn--secondary"
            onClick={() => push(emptyBsddPackaging)}
          >
            Ajouter un conditionnement
          </button>
        </div>
      )}
    </>
  );
}

export default BsffPackagingList;

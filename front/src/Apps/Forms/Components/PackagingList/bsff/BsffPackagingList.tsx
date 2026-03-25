import {
  BsffPackagingType,
  BsffPackagingInput,
  BsffType
} from "@td/codegen-ui";
import React from "react";
import { emptyBsffPackaging } from "../helpers";
import { BsffPackagingFormProps } from "./BsffPackagingForm";
import { useFormContext, useWatch } from "react-hook-form";

// Props passé à l'implémentation concrète (Formik ou RHF)
export type RenderPackagingFormProps = Omit<
  BsffPackagingFormProps,
  "inputProps" | "errors" | "touched"
> & {
  fieldName: string;
  idx: number;
};

export type PackagingListProps = {
  fieldName: string;

  packagingTypes: BsffPackagingType[];
  packagingInfos: BsffPackagingInput[];

  disabled?: boolean;

  push: (packaging: BsffPackagingInput) => void;
  remove: (idx: number) => void;

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
  const { control } = useFormContext();

  // récupère le type BSFF
  const bsffType = useWatch({
    control,
    name: "type"
  });

  // RG métier
  const maxPackagings = bsffType === BsffType.Reconditionnement ? 1 : Infinity;

  const canAdd = packagingInfos.length < maxPackagings;

  return (
    <>
      {packagingInfos.map((p, idx) => (
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
                onClick={() => remove(idx)}
              >
                Supprimer
              </button>
              <hr />
            </>
          )}
        </div>
      ))}

      {/* BOUTON AJOUT */}
      {!disabled && canAdd && (
        <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
          <button
            type="button"
            className="fr-btn fr-btn--secondary"
            onClick={() => push(emptyBsffPackaging)}
          >
            Ajouter un conditionnement
          </button>
        </div>
      )}

      {/* MESSAGE INFO */}
      {packagingInfos.length >= maxPackagings && (
        <div className="fr-alert fr-alert--info fr-mb-4w">
          Un seul contenant est autorisé dans le cadre d'un reconditionnement.
          Ex. : 1 citerne
        </div>
      )}
    </>
  );
}

export default BsffPackagingList;

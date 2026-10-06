import {
  BsffPackagingInput,
  BsffPackagingType,
  BsffType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";
import React, { useRef } from "react";
import { PackagingFormProps } from "./BsffPackagingForm";
import { useWatch } from "react-hook-form";
import { emptyBsffPackaging } from "../../../../Forms/Components/PackagingList/helpers";

export interface RenderPackagingFormProps
  extends Omit<PackagingFormProps, "inputProps" | "errors" | "touched"> {
  fieldName: string;
  idx: number;
  volumeEditable?: boolean;
}

export type PackagingListProps = {
  fieldName: string;
  packagingTypes: (Packagings | BsffPackagingType)[];
  packagingInfos: (PackagingInfoInput | BsffPackagingInput)[];
  disabled?: boolean;
  volumeEditable?: boolean;
  push: (packaging: PackagingInfoInput | BsffPackagingInput) => void;
  remove: (idx: number) => void;
  children: React.FC<RenderPackagingFormProps>;
};

function BsffPackagingList({
  fieldName,
  packagingTypes,
  packagingInfos = [],
  push,
  remove,
  disabled = false,
  volumeEditable = false,

  children
}: PackagingListProps) {
  const bsffType = useWatch({ name: "type" });

  const stableKeys = useRef<
    Map<PackagingInfoInput | BsffPackagingInput, string>
  >(new Map());
  const getStableKey = (
    p: PackagingInfoInput | BsffPackagingInput,
    idx: number
  ): string => {
    const id = (p as any).id;
    if (id) return `table-${id}`;
    if (!stableKeys.current.has(p)) {
      stableKeys.current.set(p, `manual-${Date.now()}-${idx}-${Math.random()}`);
    }
    return stableKeys.current.get(p)!;
  };

  const isReconditionnement = bsffType === BsffType.Reconditionnement;
  const isGroupement = bsffType === BsffType.Groupement;
  const isReexpedition = bsffType === BsffType.Reexpedition;
  const showbutton = isGroupement || isReexpedition;

  const canAdd = !isReconditionnement;

  return (
    <>
      {isReconditionnement && (
        <div className="fr-alert fr-alert--info fr-mb-4w">
          Un seul contenant est autorisé dans le cadre d'un reconditionnement.
          Ex. : 1 citerne
        </div>
      )}

      {packagingInfos.map((p, idx) => {
        const stableKey = getStableKey(p, idx);

        return (
          <div key={stableKey}>
            {children({
              fieldName,
              packagingTypes,
              packagingsLength: packagingInfos.length,
              idx,
              packaging: p,
              disabled,
              volumeEditable
            })}

            {!disabled && !showbutton && packagingInfos.length > 1 && (
              <>
                <button
                  type="button"
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

      {!disabled && canAdd && !showbutton && (
        <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
          <button
            type="button"
            className="fr-btn fr-btn--secondary"
            onClick={() => push({ ...emptyBsffPackaging })}
          >
            Ajouter un conditionnement
          </button>
        </div>
      )}
    </>
  );
}

export default BsffPackagingList;

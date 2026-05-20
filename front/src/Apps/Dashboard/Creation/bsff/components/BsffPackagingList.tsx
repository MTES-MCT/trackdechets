import {
  BsffPackagingType,
  BsffType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";
import React, { useRef } from "react";
import { PackagingFormProps } from "./BsffPackagingForm";
import { useWatch } from "react-hook-form";
import { emptyBsddPackaging } from "../../../../Forms/Components/PackagingList/helpers";

export interface RenderPackagingFormProps
  extends Omit<PackagingFormProps, "inputProps" | "errors" | "touched"> {
  fieldName: string;
  idx: number;
  volumeEditable?: boolean;
}

export type PackagingListProps = {
  fieldName: string;
  packagingTypes: (Packagings | BsffPackagingType)[];
  packagingInfos: PackagingInfoInput[];
  disabled?: boolean;
  volumeEditable?: boolean;
  push: (packaging: PackagingInfoInput) => void;
  remove: (idx: number) => void;
  onRemoveFromTable?: (id: string) => void;
  children: React.FC<RenderPackagingFormProps>;
};

function BsffPackagingList({
  fieldName,
  packagingTypes,
  packagingInfos = [],
  push,
  remove,
  onRemoveFromTable,
  disabled = false,
  volumeEditable = false,

  children
}: PackagingListProps) {
  const bsffType = useWatch({ name: "type" });
  const repackaging: any[] = useWatch({ name: "repackaging" }) ?? [];

  const stableKeys = useRef<Map<PackagingInfoInput, string>>(new Map());
  const getStableKey = (p: PackagingInfoInput, idx: number): string => {
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

  const tableIds = new Set<string>(
    isReconditionnement ? repackaging.map((r: any) => r.id).filter(Boolean) : []
  );

  const isFromTable = (p: PackagingInfoInput) =>
    isReconditionnement && !!(p as any).id && tableIds.has((p as any).id);

  const manualCount = isReconditionnement
    ? packagingInfos.filter(p => !isFromTable(p)).length
    : 0;

  const canAdd = !isReconditionnement || manualCount < 1;

  return (
    <>
      {isReconditionnement && manualCount >= 1 && (
        <div className="fr-alert fr-alert--info fr-mb-4w">
          Un seul contenant est autorisé dans le cadre d'un reconditionnement.
          Ex. : 1 citerne
        </div>
      )}

      {packagingInfos.map((p, idx) => {
        const fromTable = isFromTable(p);
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

            {fromTable
              ? !disabled && (
                  <>
                    <button
                      type="button"
                      className="fr-btn fr-btn--tertiary fr-mb-2w"
                      onClick={() => onRemoveFromTable?.((p as any).id)}
                    >
                      Retirer
                    </button>
                    <hr />
                  </>
                )
              : !disabled &&
                !showbutton &&
                (isReconditionnement
                  ? tableIds.size > 0 || manualCount > 1
                  : packagingInfos.length > 1) && (
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

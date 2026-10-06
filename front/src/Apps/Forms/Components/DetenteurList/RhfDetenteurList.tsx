import * as React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { BsdType, BsffType } from "@td/codegen-ui";
import { DetenteurAccordion } from "../DetenteurAccordion/DetenteurAccordion";
import { RhfDetenteurForm } from "../DetenteurForm/RhfDetenteurForm";
import { BsffEquipmentHolderForm } from "../../../Dashboard/Creation/bsff/components/BsffEquipmentHolderForm";

type RhfDetenteurListProps = {
  orgId?: string;
  fieldName: string;
  bsdType: BsdType;
};

export function RhfDetenteurList({
  orgId,
  fieldName
}: Readonly<RhfDetenteurListProps>) {
  const { control, watch } = useFormContext();

  const { fields, insert, remove, swap } = useFieldArray({
    control,
    name: fieldName
  });

  const type = watch("type");

  const isTracerFluide = type === BsffType.TracerFluide;
  const isOperator = type === BsffType.CollectePetitesQuantites;
  const isReconditionnement = type === BsffType.Reconditionnement;

  const usesEquipmentHolderForm = isTracerFluide || isOperator;

  const INSTALLATION_TYPES = [
    BsffType.Reexpedition,
    BsffType.Groupement,
    BsffType.Reconditionnement
  ];

  const isInstallationType = INSTALLATION_TYPES.includes(type);

  const emptyHolder = React.useCallback(() => {
    const makeRandomSuffix = () => {
      if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0].toString(36);
      }

      return Date.now().toString(36);
    };

    return usesEquipmentHolderForm
      ? {
          numero: isTracerFluide
            ? `DETENTEUR_${Date.now()}_${makeRandomSuffix()}`
            : "",
          isExempted: false,
          holderType: "",
          identification: "",
          detenteur: {
            isPrivateIndividual: false,
            company: {}
          },
          packagings: []
        }
      : {};
  }, [isTracerFluide, usesEquipmentHolderForm]);

  React.useEffect(() => {
    if (fields.length === 0 && !isReconditionnement) {
      insert(0, emptyHolder());
    }
  }, [emptyHolder, fields.length, insert, isReconditionnement]);

  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(
    isReconditionnement ? null : 0
  );

  return (
    <>
      {fields.map((fieldItem, idx) => {
        const numero = idx + 1;

        const isExpanded = isReconditionnement || expandedIdx === idx;

        const onAdd = () => {
          insert(idx + 1, emptyHolder());
          setExpandedIdx(idx + 1);
        };

        const onDelete = () => {
          remove(idx);

          if (expandedIdx === idx) {
            setExpandedIdx(null);
          } else if (expandedIdx !== null && expandedIdx > idx) {
            setExpandedIdx(expandedIdx - 1);
          }
        };

        const onShiftUp = () => {
          if (idx === 0) {
            return;
          }

          swap(idx, idx - 1);

          if (expandedIdx === idx) {
            setExpandedIdx(idx - 1);
          } else if (expandedIdx === idx - 1) {
            setExpandedIdx(idx);
          }
        };

        const onShiftDown = () => {
          if (idx === fields.length - 1) {
            return;
          }

          swap(idx, idx + 1);

          if (expandedIdx === idx) {
            setExpandedIdx(idx + 1);
          } else if (expandedIdx === idx + 1) {
            setExpandedIdx(idx);
          }
        };

        return (
          <DetenteurAccordion
            key={fieldItem.id}
            numero={numero}
            name={`${numero} - Détenteur de l'équipement`}
            expanded={isExpanded}
            onExpanded={() => {
              if (isReconditionnement) {
                return;
              }

              setExpandedIdx(current => (current === idx ? null : idx));
            }}
            onActorAdd={onAdd}
            onActorDelete={onDelete}
            onActorShiftUp={onShiftUp}
            onActorShiftDown={onShiftDown}
            disableAdd={false}
            disableDelete={fields.length <= 1}
            disableUp={idx === 0}
            disableDown={idx === fields.length - 1}
            deleteLabel="Supprimer"
            hideHeader={isInstallationType && !isReconditionnement}
          >
            {usesEquipmentHolderForm ? (
              <BsffEquipmentHolderForm
                orgId={orgId}
                fieldName={`${fieldName}.${idx}`}
                showInterventionSection={isOperator}
              />
            ) : (
              <RhfDetenteurForm
                orgId={orgId}
                fieldName={`${fieldName}.${idx}`}
              />
            )}
          </DetenteurAccordion>
        );
      })}
    </>
  );
}

import * as React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import Button from "@codegouvfr/react-dsfr/Button";
import { BsdType } from "@td/codegen-ui";
import { DetenteurAccordion } from "../DetenteurAccordion/DetenteurAccordion";
import { RhfDetenteurForm } from "../DetenteurForm/RhfDetenteurForm";
import { BsffType } from "@td/codegen-ui";

type RhfDetenteurListProps = {
  orgId?: string;
  fieldName: string;
  bsdType: BsdType;
};

export function RhfDetenteurList({ orgId, fieldName }: RhfDetenteurListProps) {
  const { control, watch } = useFormContext();
  const { fields, insert, remove, swap } = useFieldArray({
    control,
    name: fieldName
  });

  const type = watch("type");

  const INSTALLATION_TYPES = [
    BsffType.Reexpedition,
    BsffType.Groupement,
    BsffType.Reconditionnement
  ];

  const isInstallationType = INSTALLATION_TYPES.includes(type);
  React.useEffect(() => {
    if (fields.length === 0) {
      insert(0, {});
    }
  }, [fields.length, insert]);

  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(0);

  return (
    <>
      {fields.map((fieldItem, idx) => {
        const numero = idx + 1;

        const onAdd = () => {
          insert(idx + 1, {});
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
          if (idx === 0) return;
          swap(idx, idx - 1);
          if (expandedIdx === idx) {
            setExpandedIdx(idx - 1);
          } else if (expandedIdx === idx - 1) {
            setExpandedIdx(idx);
          }
        };

        const onShiftDown = () => {
          if (idx === fields.length - 1) return;
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
            expanded={expandedIdx === idx}
            onExpanded={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onActorAdd={onAdd}
            onActorDelete={onDelete}
            onActorShiftUp={onShiftUp}
            onActorShiftDown={onShiftDown}
            disableAdd={false}
            disableDelete={fields.length <= 1}
            disableUp={idx === 0}
            disableDown={idx === fields.length - 1}
            deleteLabel="Supprimer"
            hideHeader={isInstallationType}
          >
            <RhfDetenteurForm orgId={orgId} fieldName={`${fieldName}.${idx}`} />
          </DetenteurAccordion>
        );
      })}
    </>
  );
}

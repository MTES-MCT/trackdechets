import * as React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { TransporterAccordion } from "../TransporterAccordion/TransporterAccordion";
import { BsdType } from "@td/codegen-ui";
import { Loader } from "../../../common/Components";
import { initialFormTransporter } from "../../../../form/bsdd/utils/initial-state";
import TransporterDisplay from "../TransporterDisplay/TransporterDisplay";
import { AnyTransporterInput } from "../../types";
import { useTransportersRhf } from "../../hooks/useTransportersRhf";
import { useDeleteTransporter } from "../../hooks/useDeleteTransporter";
import { initialTransporter } from "../../../common/data/initialState";
import Button from "@codegouvfr/react-dsfr/Button";
import { RhfTransporterForm } from "../TransporterForm/RhfTransporterForm";

type RhfTransporterListProps = {
  orgId?: string;
  fieldName: string;
  bsdType: BsdType;
};

export function RhfTransporterList<
  TransporterInput extends AnyTransporterInput
>({ orgId, fieldName, bsdType }: RhfTransporterListProps) {
  const { control } = useFormContext();

  const { fields, insert, remove, swap } = useFieldArray({
    control,
    name: fieldName
  });

  const transporters = useTransportersRhf<TransporterInput>(fieldName, bsdType);
  const [deleteFormTransporter, { loading: deleteFormTransporterLoading }] =
    useDeleteTransporter(bsdType)!;

  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(
    fields.length === 1 ? 0 : null
  );

  const initialTransporterData = React.useMemo(
    () =>
      bsdType === BsdType.Bsdd ? initialFormTransporter : initialTransporter,
    [bsdType]
  );

  return (
    <>
      {fields.length === 0 && (
        <Button
          type="button"
          className="transporter__header__button"
          priority="secondary"
          iconPosition="right"
          iconId="ri-add-line"
          title="Ajouter"
          onClick={() => {
            insert(0, initialTransporterData);
            setExpandedIdx(0);
          }}
        >
          Ajouter
        </Button>
      )}

      {fields.map((fieldItem, idx) => {
        const t = transporters[idx];

        if (!t) return null;

        const hasTakenOver = Boolean(t?.takenOverAt);
        const previousHasTakenOver =
          idx > 0 ? Boolean(transporters[idx - 1]?.takenOverAt) : false;
        const nextHasTakenOver =
          idx < transporters.length - 1 &&
          Boolean(transporters[idx + 1]?.takenOverAt);

        const disableAdd = transporters.length >= 5 || nextHasTakenOver;
        const disableDelete =
          hasTakenOver || (transporters.length === 1 && !t?.company?.name);
        const disableUp =
          hasTakenOver ||
          previousHasTakenOver ||
          transporters.length === 1 ||
          idx === 0;
        const disableDown =
          hasTakenOver ||
          transporters.length === 1 ||
          idx === transporters.length - 1;

        const deleteLabel = transporters.length === 1 ? "Effacer" : "Supprimer";
        const numero = idx + 1;
        const accordionName = `${numero} - ${
          t?.company?.name && t.company.name.length > 0
            ? t.company.name
            : "Transporteur"
        }`;

        const onTransporterAdd = () => {
          insert(idx + 1, initialTransporterData);
          setExpandedIdx(idx + 1);
        };

        const onTransporterDelete = () => {
          if (t?.id) {
            deleteFormTransporter({
              variables: { id: t.id },
              onCompleted: () => {
                remove(idx);
                if (fields.length === 1) insert(0, initialTransporterData);
              }
            });
          } else {
            remove(idx);
            if (fields.length === 1) insert(0, initialTransporterData);
          }
        };

        return (
          <TransporterAccordion
            key={fieldItem.id}
            numero={numero}
            name={accordionName}
            onTransporterAdd={onTransporterAdd}
            onTransporterDelete={onTransporterDelete}
            onTransporterShiftDown={() =>
              idx + 1 < fields.length && swap(idx, idx + 1)
            }
            onTransporterShiftUp={() => idx > 0 && swap(idx, idx - 1)}
            onExpanded={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            disableAdd={disableAdd}
            disableDelete={disableDelete}
            disableUp={disableUp}
            disableDown={disableDown}
            expanded={expandedIdx === idx}
            deleteLabel={deleteLabel}
          >
            {t?.takenOverAt ? (
              <TransporterDisplay transporter={t} />
            ) : (
              <RhfTransporterForm
                orgId={orgId}
                fieldName={`${fieldName}.${idx}`}
                bsdType={bsdType}
              />
            )}
          </TransporterAccordion>
        );
      })}

      {deleteFormTransporterLoading && <Loader />}
    </>
  );
}

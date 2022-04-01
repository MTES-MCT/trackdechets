import { useQuery } from "@apollo/client";
import {
  Loader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components";
import { GET_BSDAS } from "form/bsda/stepper/queries";
import { FieldArray, useFormikContext } from "formik";
import {
  Bsda,
  BsdaInput,
  BsdaPackaging,
  BsdaStatus,
  Query,
  QueryBsdasArgs,
} from "generated/graphql/types";
import React from "react";
import { useParams } from "react-router-dom";
import initialState from "../../stepper/initial-state";

type Props = { name: string; code: string; bsdaId: string };

export function BsdaPicker({ name, code, bsdaId }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "bsdas">, QueryBsdasArgs>(GET_BSDAS, {
    variables: {
      where: {
        status: { _eq: BsdaStatus.AwaitingChild },
        _or: [{ groupedIn: { _eq: null } }, { groupedIn: { _eq: bsdaId } }],
        forwardedIn: { _eq: null },
        destination: {
          operation: { code: { _eq: code } },
          company: { siret: { _eq: siret } },
        },
      },
    },
    fetchPolicy: "network-only",
  });
  const {
    values: { forwarding, grouping },
    setFieldValue,
  } = useFormikContext<BsdaInput>();

  const isForwardingPicker = name === "forwarding";

  function onGroupingChange(groupedBsdas: Bsda[]) {
    setFieldValue(
      "weight.value",
      groupedBsdas?.reduce(
        (prev, cur) => prev + (cur.destination?.reception?.weight ?? 0),
        0
      ) ?? 0
    );
    setFieldValue(
      "waste.sealNumbers",
      groupedBsdas?.reduce(
        (prev, cur) => prev.concat(cur.waste?.sealNumbers ?? []),
        [] as string[]
      ) ?? initialState.waste.sealNumbers
    );
    setFieldValue(
      "packagings",
      groupedBsdas?.reduce((prev, cur) => {
        for (const packaging of cur.packagings ?? []) {
          const found = prev.find(
            pp => pp.type === packaging.type && pp.other === packaging.other
          );
          if (found) {
            found.quantity += packaging.quantity;
          } else {
            prev.push(packaging);
          }
        }
        return prev;
      }, [] as BsdaPackaging[]) ?? initialState.packagings
    );

    const { country, ...company } =
      groupedBsdas?.[0]?.destination?.company ??
      initialState.destination.company;
    setFieldValue("emitter.company", company);
  }

  function onForwardingChange(bsda: Bsda) {
    setFieldValue("weight.value", bsda?.destination?.reception?.weight ?? 0);
    setFieldValue(
      "waste.sealNumbers",
      bsda?.waste?.sealNumbers ?? initialState.waste.sealNumbers
    );
    setFieldValue(
      "waste.materialName",
      bsda?.waste?.materialName ?? initialState.waste.materialName
    );
    setFieldValue("waste.code", bsda?.waste?.code ?? initialState.waste.code);
    setFieldValue("packagings", bsda?.packagings ?? initialState.packagings);

    const { country, ...company } =
      bsda?.destination?.company ?? initialState.destination.company;
    setFieldValue("emitter.company", company);
  }

  if (data == null) {
    return <Loader />;
  }

  const bsdas = data.bsdas.edges.map(e => e.node);
  if (bsdas.length === 0) {
    return <div className="notification">Aucun BSDA disponible à associer</div>;
  }

  if (isForwardingPicker) {
    return (
      <PickerTable
        onClick={bsda => {
          setFieldValue("forwarding", bsda.id);
          onForwardingChange(bsda);
        }}
        isSelected={bsda => forwarding === bsda.id}
        bsdas={bsdas}
      />
    );
  }

  return (
    <FieldArray
      name="grouping"
      render={({ push, remove }) => (
        <PickerTable
          onClick={bsda => {
            const clickedBsdaIndex = grouping!.findIndex(id => id === bsda.id);
            const isSelected = clickedBsdaIndex >= 0;

            if (isSelected) {
              remove(clickedBsdaIndex);
              onGroupingChange(
                bsdas.filter(b => grouping?.includes(b.id) && b.id !== bsda.id)
              );
            } else {
              push(bsda.id);
              onGroupingChange([
                ...bsdas.filter(b => grouping?.includes(b.id)),
                bsda,
              ]);
            }
          }}
          isSelected={bsda => grouping!.findIndex(id => id === bsda.id) >= 0}
          bsdas={bsdas}
        />
      )}
    />
  );
}

function PickerTable({ bsdas, onClick, isSelected }) {
  return (
    <Table isSelectable>
      <TableHead>
        <TableRow>
          <TableHeaderCell />
          <TableHeaderCell>Numéro</TableHeaderCell>
          <TableHeaderCell>Déchet</TableHeaderCell>
          <TableHeaderCell>Émetteur</TableHeaderCell>
          <TableHeaderCell>Transporteur</TableHeaderCell>
          <TableHeaderCell>Destinataire</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bsdas.map(bsda => {
          return (
            <TableRow key={bsda.id} onClick={() => onClick(bsda)}>
              <TableCell>
                <input
                  type="checkbox"
                  className="td-input"
                  checked={isSelected(bsda)}
                  readOnly
                />
              </TableCell>
              <TableCell>{bsda.id}</TableCell>
              <TableCell>
                {bsda.waste?.code} - {bsda.waste?.materialName ?? "inconnue"}
              </TableCell>
              <TableCell>{bsda.emitter?.company?.name}</TableCell>
              <TableCell>{bsda.transporter?.company?.name}</TableCell>
              <TableCell>{bsda.destination?.company?.name}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

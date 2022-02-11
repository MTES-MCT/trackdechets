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
  BsdaInput,
  BsdaPackaging,
  BsdaStatus,
  Query,
  QueryBsdasArgs,
} from "generated/graphql/types";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import initialState from "../../stepper/initial-state";

type Props = { name: string; code: string };

export function BsdaPicker({ name, code }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "bsdas">, QueryBsdasArgs>(GET_BSDAS, {
    variables: {
      where: {
        status: { _eq: BsdaStatus.AwaitingChild },
        groupedIn: { _eq: null },
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

  // `forwarding` change effect
  useEffect(() => {
    if (!data) return;
    const forwardedBsda = data.bsdas.edges.find(
      edge => edge.node.id === forwarding
    )?.node;
    setFieldValue(
      "weight.value",
      forwardedBsda?.destination?.reception?.weight ?? 0
    );
    setFieldValue(
      "waste.sealNumbers",
      forwardedBsda?.waste?.sealNumbers ?? initialState.waste.sealNumbers
    );
    setFieldValue(
      "waste.materialName",
      forwardedBsda?.waste?.materialName ?? initialState.waste.materialName
    );
    setFieldValue(
      "waste.code",
      forwardedBsda?.waste?.code ?? initialState.waste.code
    );
    setFieldValue(
      "packagings",
      forwardedBsda?.packagings ?? initialState.packagings
    );

    const { country, ...company } =
      forwardedBsda?.destination?.company ?? initialState.destination.company;
    setFieldValue("emitter.company", company);
  }, [forwarding, data, setFieldValue]);

  // `grouping` change effect
  useEffect(() => {
    if (!data) return;
    const groupedBsdas = data.bsdas.edges
      .filter(edge => grouping?.includes(edge.node.id))
      .map(edge => edge.node);

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
            pp => pp.type === packaging.type && pp.other == packaging.other
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
  }, [grouping, data, setFieldValue]);

  if (data == null) {
    return <Loader />;
  }

  if (data.bsdas.edges.length === 0) {
    return <div className="notification">Aucun BSDA disponible à associer</div>;
  }

  if (isForwardingPicker) {
    return (
      <PickerTable
        onClick={bsda => {
          setFieldValue("forwarding", bsda.id);
        }}
        isSelected={bsda => forwarding === bsda.id}
        bsdas={data.bsdas}
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
              return;
            }
            push(bsda.id);
          }}
          isSelected={bsda => grouping!.findIndex(id => id === bsda.id) >= 0}
          bsdas={data.bsdas}
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
        {bsdas.edges.map(({ node: bsda }) => {
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

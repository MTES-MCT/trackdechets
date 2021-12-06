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
import { FieldArray, useField } from "formik";
import {
  BsdaStatus,
  CompanyInput,
  Query,
  QueryBsdasArgs,
} from "generated/graphql/types";
import React from "react";

type Props = { singleSelect: boolean; name: string; code: string };
export function BsdaPicker({ singleSelect, name, code }: Props) {
  const { data } = useQuery<Pick<Query, "bsdas">, QueryBsdasArgs>(GET_BSDAS, {
    variables: {
      where: {
        status: { _eq: BsdaStatus.AwaitingChild },
        destination: { operation: { code: { _eq: code } } },
      },
    },
    fetchPolicy: "network-only",
  });
  const [emitter, , { setValue: setEmitterCompany }] = useField<CompanyInput>(
    "emitter.company"
  );

  const [{ value: forwarding }, , { setValue }] = useField<string>(name);
  const [{ value: grouping }] = useField<string[]>(name);

  const isSingleValue = name === "forwarding";

  if (data == null) {
    return <Loader />;
  }

  if (data.bsdas.edges.length === 0) {
    return <div className="notification">Aucun BSDA disponible à associer</div>;
  }

  if (isSingleValue) {
    return (
      <PickerTable
        onClick={bsda => setValue(bsda.id)}
        isSelected={bsda => forwarding === bsda.id}
        bsdas={data.bsdas}
      />
    );
  }

  return (
    <FieldArray
      name={name}
      render={({ push, remove, pop }) => (
        <PickerTable
          onClick={bsda => {
            const previousBsdaIndex = grouping.findIndex(id => id === bsda.id);
            const isSelected = previousBsdaIndex >= 0;
            if (singleSelect) {
              setValue(bsda.id);
              return;
            }

            if (isSelected) {
              remove(previousBsdaIndex);
              return;
            }

            if (singleSelect) pop();
            push(bsda.id);

            if (!emitter && bsda.destination?.company) {
              const { country, ...company } = bsda.destination.company;
              setEmitterCompany(company);
            }
          }}
          isSelected={bsda => grouping.findIndex(id => id === bsda.id) >= 0}
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

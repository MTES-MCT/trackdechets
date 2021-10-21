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
import { BsdaStatus, Query, QueryBsdasArgs } from "generated/graphql/types";
import React from "react";

type Props = { singleSelect: boolean; name: string };
export function BsdaPicker({ singleSelect, name }: Props) {
  const { data } = useQuery<Pick<Query, "bsdas">, QueryBsdasArgs>(GET_BSDAS, {
    variables: {
      where: {
        status: { _eq: BsdaStatus.AwaitingChild },
      },
    },
  });

  const [{ value: associations }] = useField<string[]>(name);

  if (data == null) {
    return <Loader />;
  }

  return (
    <FieldArray
      name={name}
      render={({ push, remove, pop }) => (
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
            {data.bsdas.edges.map(({ node: bsda }) => {
              const previousBsdaIndex = associations.findIndex(
                id => id === bsda.id
              );
              const isSelected = previousBsdaIndex >= 0;

              return (
                <TableRow
                  key={bsda.id}
                  onClick={() => {
                    if (isSelected) {
                      remove(previousBsdaIndex);
                      return;
                    }

                    if (singleSelect) pop();
                    push(bsda.id);
                  }}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="td-input"
                      checked={isSelected}
                      readOnly
                    />
                  </TableCell>
                  <TableCell>{bsda.id}</TableCell>
                  <TableCell>
                    {bsda.waste?.code} -{" "}
                    {bsda.waste?.materialName ?? "inconnue"}
                  </TableCell>
                  <TableCell>{bsda.emitter?.company?.name}</TableCell>
                  <TableCell>{bsda.transporter?.company?.name}</TableCell>
                  <TableCell>{bsda.destination?.company?.name}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    />
  );
}

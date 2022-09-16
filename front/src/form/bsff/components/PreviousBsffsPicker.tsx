import * as React from "react";
import { useQuery } from "@apollo/client";
import { FieldArray, useField } from "formik";
import {
  Bsff,
  BsffStatus,
  BsffType,
  Query,
  QueryBsffsArgs,
} from "generated/graphql/types";
import { GET_BSFF_FORMS } from "../utils/queries";
import {
  Loader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components";
import { OPERATION } from "../utils/constants";

interface PreviousBsffsPickerProps {
  bsffType: BsffType;
  max?: number;
}

export function PreviousBsffsPicker({
  bsffType,
  max = Infinity,
}: PreviousBsffsPickerProps) {
  const code_in = Object.values(OPERATION)
    .filter(operation => operation.successors.includes(bsffType))
    .map(operation => operation.code);

  const instruction =
    bsffType === BsffType.Groupement
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'ungroupement."
      : bsffType === BsffType.Reconditionnement
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'un reconditionnement."
      : bsffType === BsffType.Reexpedition
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'une réexpédition."
      : "";

  const { data } = useQuery<Pick<Query, "bsffs">, QueryBsffsArgs>(
    GET_BSFF_FORMS,
    {
      variables: {
        where: {
          status: { _eq: BsffStatus.IntermediatelyProcessed },
          destination: {
            operation: {
              code: { _in: code_in },
            },
          },
        },
      },
      // make sure we have fresh data here
      fetchPolicy: "cache-and-network",
    }
  );
  const [{ value: previousBsffs }] = useField<Bsff[]>("previousBsffs");

  if (data == null) {
    return <Loader />;
  }

  // remove bsffs that have already been grouped, forwarded or repackaged
  const pickableBsffs = data.bsffs.edges
    .map(({ node: bsff }) => bsff)
    .filter(bsff => {
      return !bsff.groupedIn && !bsff.repackagedIn && !bsff.forwardedIn;
    });

  if (!pickableBsffs?.length) {
    return (
      <div>
        {`Aucune BSFF éligible pour ${
          bsffType === BsffType.Groupement
            ? "un regroupement"
            : bsffType === BsffType.Reconditionnement
            ? "un reconditionnement"
            : bsffType === BsffType.Reexpedition
            ? "une réexpédition"
            : ""
        }
        `}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      <p style={{ marginBottom: "0.25rem" }}>{instruction}</p>
      <FieldArray
        name="previousBsffs"
        render={({ push, remove }) => (
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
              {pickableBsffs.map(bsff => {
                const previousBsffIndex = previousBsffs.findIndex(
                  previousBsff => previousBsff.id === bsff.id
                );
                const isSelected = previousBsffIndex >= 0;

                return (
                  <TableRow
                    key={bsff.id}
                    onClick={() => {
                      if (isSelected) {
                        remove(previousBsffIndex);
                      } else {
                        if (previousBsffs.length >= max) {
                          window.alert(
                            `Vous ne pouvez pas sélectionner plus de ${max} BSFFs avec ce type de BSFF.`
                          );
                          return;
                        }
                        push(bsff);
                      }
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
                    <TableCell>{bsff.id}</TableCell>
                    <TableCell>
                      {bsff.waste?.code} - Nature :{" "}
                      {bsff.waste?.description ?? "inconnue"}
                    </TableCell>
                    <TableCell>{bsff.emitter?.company?.name}</TableCell>
                    <TableCell>{bsff.transporter?.company?.name}</TableCell>
                    <TableCell>{bsff.destination?.company?.name}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      />
    </div>
  );
}

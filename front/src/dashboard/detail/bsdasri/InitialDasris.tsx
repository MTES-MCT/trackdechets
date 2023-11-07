import React from "react";
import { formatDate } from "../../../common/datetime";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableRowDigest
} from "../../../common/components";

export const InitialDasris = ({ initialBsdasris }) => {
  if (!initialBsdasris?.length) {
    return <div>Aucun bordereau associé</div>;
  }

  return (
    <Table style={{ tableLayout: "fixed" }}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Id</TableHeaderCell>
          <TableHeaderCell>Quantité</TableHeaderCell>
          <TableHeaderCell>Volume</TableHeaderCell>
          <TableHeaderCell>Poids</TableHeaderCell>
          <TableHeaderCell>Enlèvement</TableHeaderCell>
          <TableHeaderCell>Code postal</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {initialBsdasris.map(el => (
          <TableRow key={el.id}>
            <TableCell>{el.id}</TableCell>
            <TableCell>{el.quantity}</TableCell>
            <TableCell>{el.volume}</TableCell>
            <TableCell>{el.weight || "Pesée non effectuée"}</TableCell>
            <TableCell>{formatDate(el.takenOverAt)}</TableCell>
            <TableCell>{el.postalCode}</TableCell>
          </TableRow>
        ))}
        <TableRowDigest>
          <TableCell>
            <strong>Total</strong>{" "}
          </TableCell>
          <TableCell>
            {initialBsdasris.reduce((prev, curr) => prev + curr.quantity, 0)}
          </TableCell>
          <TableCell>
            {initialBsdasris.reduce((prev, curr) => prev + curr.volume, 0)}
          </TableCell>

          <TableCell>
            {Number.parseFloat(
              initialBsdasris
                .reduce((prev, curr) => prev + curr.weight, 0)
                .toFixed(3)
            ) || "N/A"}
          </TableCell>
          <TableCell>{null}</TableCell>
          <TableCell>{null}</TableCell>
        </TableRowDigest>
      </TableBody>
    </Table>
  );
};

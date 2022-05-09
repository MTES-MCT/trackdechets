import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components/Table";
import { useDownloadPdf } from "dashboard/components/BSDList/BSDD/BSDDActions/useDownloadPdf";
import { InitialBsda } from "generated/graphql/types";
import { IconPdf } from "common/components/Icons";

export function InitialBsdas({ bsdas }: { bsdas: InitialBsda[] }) {
  const [downloadPdf] = useDownloadPdf({});
  return (
    <Table style={{ tableLayout: "fixed" }}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Identifiant</TableHeaderCell>
          <TableHeaderCell>Code déchet</TableHeaderCell>
          <TableHeaderCell>CAP (exutoire)</TableHeaderCell>
          <TableHeaderCell>Quantité (en T)</TableHeaderCell>
          <TableHeaderCell>Télécharger</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bsdas.map(bsda => (
          <TableRow key={bsda.id}>
            <TableCell>{bsda.id}</TableCell>
            <TableCell>{bsda.waste?.code}</TableCell>
            <TableCell>
              {bsda.destination?.operation?.nextDestination?.cap ??
                bsda.destination?.cap}
            </TableCell>
            <TableCell>{bsda?.destination?.reception?.weight}</TableCell>
            <TableCell>
              <button
                type="button"
                className="btn btn--slim btn--small btn--outline-primary"
                onClick={() => downloadPdf({ variables: { id: bsda.id } })}
              >
                <IconPdf size="18px" color="blueLight" />
                <span>Pdf</span>
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../common/components/Table";
import { InitialBsda } from "codegen-ui";
import { IconPdf } from "../../../Apps/common/Components/Icons/Icons";
import { useDownloadPdf } from "../../components/BSDList/BSDa/BSDaActions/useDownloadPdf";

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
          <TableHeaderCell>Exutoire prévu</TableHeaderCell>
          <TableHeaderCell>Télécharger</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bsdas.map(bsda => (
          <TableRow key={bsda.id}>
            <TableCell>{bsda.id}</TableCell>
            <TableCell>
              {bsda.waste?.code} {bsda.waste?.materialName}
            </TableCell>
            <TableCell>
              {bsda.destination?.operation?.nextDestination?.cap ??
                bsda.destination?.cap}
            </TableCell>
            <TableCell>{bsda?.destination?.reception?.weight}</TableCell>
            <TableCell>
              {[
                bsda?.destination?.operation?.nextDestination?.company?.name,
                bsda?.destination?.operation?.nextDestination?.company?.siret
              ]
                .filter(Boolean)
                .join(" - ")}
            </TableCell>
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

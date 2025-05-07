import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../../common/components/Table";
import { InitialBsda } from "@td/codegen-ui";
import { IconPdf } from "../../../common/Components/Icons/Icons";
import { useDownloadPdf } from "../../../../dashboard/components/BSDList/BSDa/BSDaActions/useDownloadPdf";
import Button from "@codegouvfr/react-dsfr/Button";

export function InitialBsdas({ bsdas }: { bsdas: InitialBsda[] }) {
  const [downloadPdf] = useDownloadPdf({});
  return (
    <Table style={{ tableLayout: "fixed", marginBottom: "5px" }}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Identifiant</TableHeaderCell>
          <TableHeaderCell>Dénomination</TableHeaderCell>
          <TableHeaderCell>CAP (exutoire)</TableHeaderCell>
          <TableHeaderCell>Qté</TableHeaderCell>
          <TableHeaderCell>Action</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bsdas.map(bsda => (
          <TableRow key={bsda.id}>
            <TableCell>{bsda.id}</TableCell>
            <TableCell>{bsda.waste?.materialName}</TableCell>
            <TableCell>
              {bsda.destination?.operation?.nextDestination?.cap ??
                bsda.destination?.cap}
            </TableCell>
            <TableCell>{bsda?.destination?.reception?.weight}</TableCell>
            <TableCell>
              <Button
                type="button"
                onClick={() => downloadPdf({ variables: { id: bsda.id } })}
                priority="tertiary"
                size="small"
              >
                <IconPdf size="14px" />
                <span className="fr-ml-1w">PDF</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

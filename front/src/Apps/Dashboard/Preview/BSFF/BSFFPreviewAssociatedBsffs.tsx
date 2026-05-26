import React from "react";
import { Bsff } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { useDownloadPdf } from "../../../../dashboard/components/BSDList/BSDa/BSDaActions/useDownloadPdf";

interface BSFFPreviewAssociatedBsffsProps {
  bsd: Bsff;
}
const BSFFPreviewAssociatedBsffs = ({
  bsd
}: BSFFPreviewAssociatedBsffsProps) => {
  const initialBsffs = bsd.forwarding ? [bsd.forwarding] : bsd.grouping;
  const [downloadPdf] = useDownloadPdf({});

  return (
    <div className="fr-table fr-table--no-scroll" id="table-0-component">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table id="table-0">
              <thead>
                <tr>
                  <th>N° de bordereau</th>
                  <th>Dénomination usuelle</th>
                  <th>CAP (exutoire)</th>
                  <th>Quantité</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {initialBsffs?.map((bsff, idx) => (
                  <tr
                    key={bsff.id}
                    id={`table-0-row-key-${idx + 1}`}
                    data-row-key={idx + 1}
                  >
                    <td>{bsff.id}</td>
                    <td>{bsff.waste?.materialName}</td>
                    <td>
                      {bsff.destination?.operation?.nextDestination?.cap ??
                        bsff.destination?.cap}
                    </td>
                    <td>
                      {bsff.destination?.reception?.acceptedWeight ??
                        bsff.destination?.reception?.weight}
                    </td>
                    <td>
                      <Button
                        type="button"
                        onClick={() =>
                          downloadPdf({ variables: { id: bsff.id } })
                        }
                        priority="tertiary"
                        size="small"
                        iconId="ri-file-pdf-line"
                        iconPosition="right"
                      >
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BSFFPreviewAssociatedBsffs;

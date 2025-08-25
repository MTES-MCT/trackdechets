import React from "react";
import { Bsda } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { useDownloadPdf } from "../../../../dashboard/components/BSDList/BSDa/BSDaActions/useDownloadPdf";

interface BSDAPreviewNextBsdaProps {
  bsd: Bsda;
}
const BSDAPreviewNextBsda = ({ bsd }: BSDAPreviewNextBsdaProps) => {
  const bsda = bsd.forwardedIn ?? bsd.groupedIn!;
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
                  {!bsda.isDraft && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                <tr key={bsda.id}>
                  <td>{bsda.id}</td>
                  <td>{bsda.waste?.materialName}</td>
                  <td>
                    {bsda.destination?.operation?.nextDestination?.cap ??
                      bsda.destination?.cap}
                  </td>
                  {!bsda.isDraft && (
                    <td>
                      <Button
                        type="button"
                        onClick={() =>
                          downloadPdf({ variables: { id: bsda.id } })
                        }
                        priority="tertiary"
                        size="small"
                        iconId="ri-file-pdf-line"
                        iconPosition="right"
                      >
                        PDF
                      </Button>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BSDAPreviewNextBsda;

import React, { useMemo } from "react";
import { Bsff } from "@td/codegen-ui";
import { getPackagingInfosSummary } from "../../../common/utils/packagingsBsffSummary";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
} from "../BSDPreviewComponents";
import { TableBody } from "react-stately";
// import { Table, TableCell, TableHead, TableRow } from "front/src/common/components";
import {
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../../../../front/src/common/components";

// import { PACKAGINGS_NAMES } from "front/src/form/bsff/components/packagings/Packagings";
import { PACKAGINGS_NAMES } from "../../../../form/bsff/components/packagings/Packagings";

interface BSFFPreviewWasteProps {
  bsd: Bsff;
}
const BSFFPreviewWaste = ({ bsd }: BSFFPreviewWasteProps) => {
  const contenant = useMemo(
    () =>
      bsd?.packagings
        ? getPackagingInfosSummary(bsd.packagings, { expanded: true })
        : "",
    [bsd]
  );

  return (
    <PreviewContainer>
      <PreviewContainerRow title={"Quantité"}>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label={`Poids ${bsd.weight?.isEstimate ? "estimé" : "réel"}`}
            tooltip={
              bsd.weight?.isEstimate
                ? `"Quantité estimée conformément à l'article 5.4.1.1.3.2 de l'ADR" si soumis`
                : undefined
            }
            value={bsd.weight?.value}
            units={"t"}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow label="Quantité réelle reçue" value="-" units={"t"} />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow title={"Opérations à la destination"} separator>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label="Opération prévue"
            value={bsd.destination?.plannedOperationCode}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label="Opération réalisée"
            value={bsd.destination?.plannedOperationCode}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewDateRow
            label="Date de traitement"
            value={bsd.destination?.reception?.date}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow title={"Contenants"} separator>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
              tableLayout: "fixed"
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e3e3fd",
                  backgroundColor: "#f5f5fe"
                }}
              >
                {[
                  { label: "Nom", width: "15%" },
                  { label: "Numéro", width: "15%" },
                  { label: "Quantité (kg)", width: "12%" },
                  { label: "Volume (litres)", width: "12%" },
                  { label: "Acceptation", width: "15%" },
                  { label: "Opération", width: "12%" },
                  { label: "Destination ultérieure", width: "19%" }
                ].map(({ label, width }) => (
                  <th
                    key={label}
                    style={{
                      width,
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#3a3a3a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {bsd.packagings?.map((packaging, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #e8e8e8",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafafa"
                  }}
                >
                  {[
                    packaging.name ?? packaging.type,
                    packaging.numero ?? "-",
                    packaging.weight ?? "-",
                    packaging.volume ?? "-",
                    packaging.acceptation?.status ?? "-",
                    packaging.operation?.code ?? "-",
                    packaging.operation?.nextDestination?.company?.name ?? "-"
                  ].map((value, i) => (
                    <td
                      key={i}
                      style={{
                        padding: "10px 12px",
                        color: "#1e1e1e",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={String(value)}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSFFPreviewWaste;

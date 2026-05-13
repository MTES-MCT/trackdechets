import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { BsffType, BsdType, Query, QueryBsffArgs } from "@td/codegen-ui";
import { GET_BSFF_FORM } from "../../../common/queries/bsff/queries";
import { Loader } from "../../../common/Components";
import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import BSDPreviewTabs from "../BSDPreviewTabs";
import BSFFPreviewWaste from "./BSFFPreviewWaste";
import BSFFPreviewEmitter from "./BSFFPreviewEmitter";
import BSFFPreviewTransport from "./BSFFPreviewTransport";
import BSFFPreviewDestination from "./BSFFPreviewDestination";
import BSFFPreviewActors from "./BSFFPreviewActors";
import BSFFPreviewAssociatedBsffs from "./BSFFPreviewAssociatedBsffs";
import { useBsffDownloadPdf } from "../../Components/Pdf/useDownloadPdf";
import BSDPreviewHeader from "../BSDPreviewHeader";
import {
  PreviewContainerCol,
  PreviewTextRow,
  PreviewDateRow
} from "../BSDPreviewComponents";
import { getPackagingInfosSummary } from "../../../common/utils/packagingsBsffSummary";
import QRCodeIcon from "react-qr-code";
import { TBsdStatusCode } from "../../../common/types/bsdTypes";
import BSFFPreviewNextBsff from "./BSFFPreviewNextBsff";

interface BSFFPreviewContentProps {
  bsdId: string;
}
const BSFFPreviewContent = ({ bsdId }: BSFFPreviewContentProps) => {
  const [downloadBsffPdf] = useBsffDownloadPdf({
    ...{
      variables: { id: bsdId }
    }
  });

  const { data, loading } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: bsdId!
      },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const bsd = data?.bsff!;
  const isMultiModal = bsd?.transporters.length > 1;
  const initialBsffs = bsd?.forwarding ? [bsd?.forwarding] : bsd?.grouping;
  const emitterLabel =
    bsd?.type === BsffType.CollectePetitesQuantites
      ? "Opérateur"
      : bsd?.type === BsffType.TracerFluide
      ? "Autre détenteur"
      : "Installation de tri, transit, regroupement";
  const tabsList = [
    {
      tabId: "dechet",
      label: "Déchet",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    {
      tabId: "emetteur",
      label: emitterLabel,
      iconId: "fr-icon-map-pin-2-fill" as FrIconClassName
    },
    ...(!(bsd?.type === BsffType.TracerFluide)
      ? [
          {
            tabId: "transport",
            label: "Transporteur" + (isMultiModal ? "s" : ""),
            iconId: "ri-truck-fill" as RiIconClassName
          }
        ]
      : []),
    {
      tabId: "destination",
      label: "Destinataire",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    ...(!!initialBsffs?.length
      ? [
          {
            tabId: "associes",
            label:
              initialBsffs?.length > 1
                ? `BSFFs associés (${initialBsffs?.length})`
                : "BSFF associé",
            iconId: "fr-icon-arrow-right-line" as FrIconClassName
          }
        ]
      : [])
  ];

  const tabsContent = useMemo(
    () => ({
      dechet: <BSFFPreviewWaste bsd={bsd} />,
      emetteur: <BSFFPreviewEmitter bsd={bsd} />,
      transport: <BSFFPreviewTransport bsd={bsd} />,
      destination: <BSFFPreviewDestination bsd={bsd} />,
      bsffSuite: <BSFFPreviewNextBsff bsd={bsd} />,
      acteurs: <BSFFPreviewActors bsd={bsd} />,
      associes: <BSFFPreviewAssociatedBsffs bsd={bsd} />
    }),
    [bsd]
  );

  const contenant = useMemo(
    () =>
      bsd?.packagings
        ? getPackagingInfosSummary(bsd.packagings, { hideDetails: true })
        : "",
    [bsd]
  );

  return (
    <>
      {!loading && bsd && (
        <>
          <BSDPreviewHeader
            title={bsd.id}
            bsdType={bsd?.type as BsffType}
            bsdStatus={bsd.status as TBsdStatusCode}
            wasteType={BsdType.Bsff}
          >
            <>
              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow label="Code déchet" value={bsd.waste?.code} />

                <PreviewDateRow label="Dernière action" value={bsd.updatedAt} />
              </PreviewContainerCol>

              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow label="Contenants" value={contenant} />

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

              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow
                  label="Dénomination usuelle"
                  value={bsd.waste?.description}
                />

                <PreviewTextRow
                  label="Mention ADR"
                  value={bsd.waste?.adr ?? "Non soumis à l'ADR"}
                />
              </PreviewContainerCol>

              {!bsd.isDraft && (
                <PreviewContainerCol gridWidth={3}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}
                  >
                    <QRCodeIcon value={bsd.id} size={96} />
                    <span
                      className="fr-text--xs"
                      style={{ textAlign: "center" }}
                    >
                      Ce QR code contient le numéro du bordereau{" "}
                    </span>
                  </div>
                </PreviewContainerCol>
              )}
            </>
          </BSDPreviewHeader>
          <BSDPreviewTabs
            tabsList={tabsList}
            tabsContent={tabsContent}
            onDownloadPdf={downloadBsffPdf}
          />
        </>
      )}
      {loading && <Loader />}
    </>
  );
};

export default BSFFPreviewContent;

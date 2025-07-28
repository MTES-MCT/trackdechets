import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { BsdaType, BsdType, Query, QueryBsdaArgs } from "@td/codegen-ui";
import { GET_BSDA } from "../../../common/queries/bsda/queries";
import { Loader } from "../../../common/Components";
import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import BSDPreviewTabs from "../BSDPreviewTabs";
import BSDAPreviewWaste from "./BSDAPreviewWaste";
import BSDAPreviewEmitter from "./BSDAPreviewEmitter";
import BSDAPreviewWorker from "./BSDAPreviewWorker";
import BSDAPreviewTransport from "./BSDAPreviewTransport";
import BSDAPreviewDestination from "./BSDAPreviewDestination";
import BSDAPreviewActors from "./BSDAPreviewActors";
import BSDAPreviewAssociatedBsdas from "./BSDAPreviewAssociatedBsdas";
import { useBsdaDownloadPdf } from "../../Components/Pdf/useDownloadPdf";
import BSDPreviewHeader from "../BSDPreviewHeader";
import {
  PreviewContainerCol,
  PreviewTextRow,
  PreviewDateRow,
  PreviewExpandableRow
} from "../BSDPreviewComponents";
import { getPackagingInfosSummary } from "../../../common/utils/packagingsBsddSummary";
import QRCodeIcon from "react-qr-code";
import { TBsdStatusCode } from "../../../common/types/bsdTypes";

interface BSDAPreviewContentProps {
  bsdId: string;
}
const BSDAPreviewContent = ({ bsdId }: BSDAPreviewContentProps) => {
  const [downloadBsdaPdf] = useBsdaDownloadPdf({
    ...{
      variables: { id: bsdId }
    }
  });

  const { data, loading } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(
    GET_BSDA,
    {
      variables: {
        id: bsdId!
      },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const bsd = data?.bsda!;

  const isMultiModal = bsd?.transporters.length > 1;
  const actorsPresent =
    bsd?.ecoOrganisme ||
    bsd?.broker ||
    (bsd?.intermediaries && bsd?.intermediaries.length > 0);
  const initialBsdas = bsd?.forwarding ? [bsd?.forwarding] : bsd?.grouping;

  const tabsList = [
    {
      tabId: "dechet",
      label: "Déchet",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    {
      tabId: "emetteur",
      label: "Émetteur",
      iconId: "fr-icon-map-pin-2-fill" as FrIconClassName
    },
    ...(!!bsd?.worker?.company?.name
      ? [
          {
            tabId: "entreprise",
            label: "Ent. de travaux",
            iconId: "ri-hammer-fill" as FrIconClassName
          }
        ]
      : []),
    ...(!(bsd?.type === BsdaType.Collection_2710)
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
    ...(actorsPresent
      ? [
          {
            tabId: "acteurs",
            label: "Autres acteurs",
            iconId: "fr-icon-arrow-right-line" as FrIconClassName
          }
        ]
      : []),
    ...(!!initialBsdas?.length
      ? [
          {
            tabId: "associes",
            label: "BSDA(s) associé(s)",
            iconId: "fr-icon-arrow-right-line" as FrIconClassName
          }
        ]
      : [])
  ];

  const tabsContent = useMemo(
    () => ({
      dechet: <BSDAPreviewWaste bsd={bsd} />,
      emetteur: <BSDAPreviewEmitter bsd={bsd} />,
      entreprise: <BSDAPreviewWorker bsd={bsd} />,
      transport: <BSDAPreviewTransport bsd={bsd} />,
      destination: <BSDAPreviewDestination bsd={bsd} />,
      acteurs: <BSDAPreviewActors bsd={bsd} />,
      associes: <BSDAPreviewAssociatedBsdas bsd={bsd} />
    }),
    [bsd]
  );

  const conditionnement = useMemo(
    () => (bsd?.packagings ? getPackagingInfosSummary(bsd.packagings) : ""),
    [bsd]
  );

  return (
    <>
      {!loading && bsd && (
        <>
          <BSDPreviewHeader
            title={bsd.id}
            bsdStatus={bsd.status as TBsdStatusCode}
            wasteType={BsdType.Bsda}
          >
            <>
              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow label="Code déchet" value={bsd.waste?.code} />

                <PreviewTextRow
                  label="Code famille"
                  value={bsd.waste?.familyCode}
                />

                <PreviewTextRow
                  label="Consistance"
                  value={bsd.waste?.consistence}
                />

                <PreviewDateRow label="Dernière action" value={bsd.updatedAt} />
              </PreviewContainerCol>

              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow
                  label="Conditionnement"
                  value={conditionnement}
                />

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

                <PreviewExpandableRow
                  label="Scellés"
                  values={bsd.waste?.sealNumbers}
                />
              </PreviewContainerCol>

              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow
                  label="Dénomination usuelle"
                  value={bsd.waste?.materialName}
                />

                <PreviewTextRow
                  label="Mention ADR"
                  value={bsd.waste?.adr ?? "Non soumis à l'ADR"}
                />

                <PreviewTextRow
                  label="Éco-organisme"
                  value={bsd.ecoOrganisme?.name}
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
            onDownloadPdf={downloadBsdaPdf}
          />
        </>
      )}
      {loading && <Loader />}
    </>
  );
};

export default BSDAPreviewContent;

import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { BsdType, Query, QueryBsvhuArgs } from "@td/codegen-ui";
import { GET_VHU_FORM } from "../../../common/queries/bsvhu/queries";
import { Loader } from "../../../common/Components";
import { FrIconClassName } from "@codegouvfr/react-dsfr";
import BSDPreviewTabs from "../BSDPreviewTabs";
import BSVHUPreviewWaste from "./BSVHUPreviewWaste";
import BSVHUPreviewEmitter from "./BSVHUPreviewEmitter";
import BSVHUPreviewTransport from "./BSVHUPreviewTransport";
import BSVHUPreviewDestination from "./BSVHUPreviewDestination";
import BSVHUPreviewActors from "./BSVHUPreviewActors";
import { useBsvhuDownloadPdf } from "../../Components/Pdf/useDownloadPdf";
import BSDPreviewHeader from "../BSDPreviewHeader";
import {
  PreviewContainerCol,
  PreviewTextRow,
  PreviewDateRow,
  PreviewBooleanRow
} from "../BSDPreviewComponents";
import QRCodeIcon from "react-qr-code";
import { TBsdStatusCode } from "../../../common/types/bsdTypes";

interface BSVHUPreviewContentProps {
  bsdId: string;
}
const BSVHUPreviewContent = ({ bsdId }: BSVHUPreviewContentProps) => {
  const [downloadBsvhuPdf] = useBsvhuDownloadPdf({
    ...{
      variables: { id: bsdId }
    }
  });

  const { data, loading } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsdId!
      },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const bsd = data?.bsvhu!;

  const tabsList = [
    {
      tabId: "dechet",
      label: "Déchet",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    {
      tabId: "emetteur",
      label: "Émetteur",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    {
      tabId: "transport",
      label: "Transporteur",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    {
      tabId: "destination",
      label: "Destinataire",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    },
    {
      tabId: "acteurs",
      label: "Autres acteurs",
      iconId: "fr-icon-arrow-right-line" as FrIconClassName
    }
  ];

  const tabsContent = useMemo(
    () => ({
      dechet: <BSVHUPreviewWaste bsd={bsd} />,
      emetteur: <BSVHUPreviewEmitter bsd={bsd} />,
      transport: <BSVHUPreviewTransport bsd={bsd} />,
      destination: <BSVHUPreviewDestination bsd={bsd} />,
      acteurs: <BSVHUPreviewActors bsd={bsd} />
    }),
    [bsd]
  );

  return (
    <>
      {!loading && bsd && (
        <>
          <BSDPreviewHeader
            title={bsd.id}
            bsdStatus={bsd.status as TBsdStatusCode}
            wasteType={BsdType.Bsvhu}
          >
            <>
              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow label="Code déchet" value={bsd.wasteCode} />

                <PreviewTextRow
                  label="Dénomination usuelle du déchet"
                  value={
                    bsd.wasteCode === "16 01 04*"
                      ? "VHU non dépollués"
                      : "VHU dépollués"
                  }
                />

                <PreviewTextRow
                  label="Conditionnement"
                  value={bsd.quantity}
                  units={bsd.packaging === "LOT" ? "lot(s)" : "unité(s)"}
                />
              </PreviewContainerCol>

              <PreviewContainerCol gridWidth={3}>
                <PreviewBooleanRow
                  label="Véhicule électrique ou hybride"
                  value={bsd.containsElectricOrHybridVehicles}
                />

                <PreviewDateRow label="Dernière action" value={bsd.updatedAt} />

                <PreviewTextRow
                  label="Éco-organisme ou système individuel"
                  value={bsd.ecoOrganisme?.name}
                />
              </PreviewContainerCol>

              <PreviewContainerCol gridWidth={3}>
                <div></div>
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
            onDownloadPdf={downloadBsvhuPdf}
          />
        </>
      )}
      {loading && <Loader />}
    </>
  );
};

export default BSVHUPreviewContent;

import React, { useMemo } from "react";
import { Loader } from "../../../common/Components";
import { useQuery } from "@apollo/client";
import {
  BsffPackaging,
  BsffPackagingType,
  Query,
  QueryBsffArgs,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import {
  DsfrDataList,
  DsfrDataListDescription,
  DsfrDataListItem,
  DsfrDataListTerm,
  Modal
} from "../../../../common/components";
import Table from "@codegouvfr/react-dsfr/Table";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { getOperationModesFromOperationCode } from "../../../common/operationModes";
import Badge from "../../Components/Badge/Badge";
import { BsdStatusCode, TBsdStatusCode } from "../../../common/types/bsdTypes";
import SignBsffPackagingButton from "./SignBsffPackagingButton";
import { GET_BSFF } from "./queries";
import { pluralize } from "@td/constants";
import { differenceInDays } from "date-fns";

interface SignPackagingsModalProps {
  bsffId: string;
  onClose: () => void;
}

function getSignBtnLabel(packaging: BsffPackaging): string | null {
  if (!!packaging.operation?.signature?.date) {
    // Calcule le nombre de jours depuis la signature du traitement
    const daysOld = differenceInDays(
      new Date(),
      new Date(packaging.operation.signature.date)
    );

    if (daysOld <= 60 && !packaging.nextBsff) {
      // La correction est autorisée pendant un maximum de 60 jours
      // après la signature de traitement du contenant et tant que le
      // contenant n'a pas été groupé / réexpédié / reconditionné
      return "Corriger";
    }
    return null;
  }
  if (packaging.acceptation?.signature?.date) {
    if (packaging.acceptation?.status === WasteAcceptationStatus.Refused) {
      return null;
    }

    return "Traiter";
  }
  return "Accepter";
}

function packagingTypeLabel(packaging: BsffPackaging) {
  switch (packaging.type) {
    case BsffPackagingType.Bouteille:
      return "Bouteille";
    case BsffPackagingType.Conteneur:
      return "Conteneur";
    case BsffPackagingType.Citerne:
      return "Citerne";
    case BsffPackagingType.Autre:
      return packaging.other;
  }
}

// Calcule un statut "apparent" pour le contenant permettant
// l'affichage d'un badge
function packagingStatus(packaging: BsffPackaging) {
  let status: TBsdStatusCode = BsdStatusCode.Received;

  if (packaging?.acceptation?.signature?.date) {
    // Le contenant a été accepté ou refusé

    if (packaging.acceptation?.status === WasteAcceptationStatus.Refused) {
      // Le contenant a été refusé
      status = BsdStatusCode.Refused;
    } else {
      // Le contenant a été accepté
      if (packaging?.operation?.signature?.date && packaging?.operation?.code) {
        // Le contenant a été traité
        const operationModes = getOperationModesFromOperationCode(
          packaging.operation.code
        );
        if (operationModes.length > 0) {
          // Il s'agit d'un code de traitement final
          status = BsdStatusCode.Processed;
        } else {
          // Il s'agit d'un code de traitement non final

          if (packaging.nextBsff) {
            status = BsdStatusCode.Grouped;
          }

          status = BsdStatusCode.IntermediatelyProcessed;
        }
      } else {
        status = BsdStatusCode.Accepted;
      }
    }
  }

  return status;
}

export function SignBsffPackagingsModal({
  bsffId,
  onClose
}: SignPackagingsModalProps) {
  const { data, loading, error } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF,
    {
      variables: {
        id: bsffId
      }
    }
  );

  const packagingsWithStatus = useMemo(
    () =>
      (data?.bsff?.packagings ?? []).map(p => ({
        ...p,
        status: packagingStatus(p) as TBsdStatusCode
      })),
    [data]
  );

  const packagingsRecap = useMemo(() => {
    if (!packagingStatus.length) {
      return "";
    }
    const received = packagingsWithStatus.length;
    const accepted = packagingsWithStatus.filter(
      p => p.status === BsdStatusCode.Accepted
    ).length;
    const refused = packagingsWithStatus.filter(
      p => p.status === BsdStatusCode.Refused
    ).length;
    const processed = packagingsWithStatus.filter(
      p => p.status === BsdStatusCode.Processed
    ).length;
    const intermediatelyProcessed = packagingsWithStatus.filter(
      p => p.status === BsdStatusCode.IntermediatelyProcessed
    ).length;
    const grouped = packagingsWithStatus.filter(
      p => p.status === BsdStatusCode.Grouped
    ).length;

    const recapItems = [
      {
        count: accepted,
        text: `${accepted} ${pluralize("accepté", accepted)}`
      },
      { count: refused, text: `${refused} ${pluralize("refusé", refused)}` },
      {
        count: processed,
        text: `${processed} ${pluralize("traité", processed)}`
      },
      {
        count: intermediatelyProcessed,
        text: `${intermediatelyProcessed} ${pluralize(
          "en attente de traitement",
          intermediatelyProcessed
        )}`
      },
      { count: grouped, text: `${grouped} annexé à un bordereau suite` }
    ]
      .filter(({ count }) => count > 0)
      .map(({ text }) => text);

    let recap = `${received} ${pluralize("contenant", received)} ${pluralize(
      "réceptionné",
      received
    )}`;

    if (recapItems.length > 0) {
      recap += ` dont ${recapItems.join(" - ")}`;
    }

    return recap;
  }, [packagingsWithStatus]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        description={error.message}
        title="Erreur"
        small
      />
    );
  }

  if (data) {
    const { bsff } = data;

    const headers = [
      "Type",
      "Numéro",
      "Quantité",
      "Code déchet",
      "Dénomination",
      "Opération",
      "Statut",
      ""
    ];

    const tableData = packagingsWithStatus.map(p => {
      // poids accepté ou à défaut poids renseigné au départ
      const weight = p.acceptation?.weight ?? p.weight;
      const weightWithUnit = weight ? `${weight} kg` : "";

      const wasteCode = p.acceptation?.wasteCode ?? bsff.waste?.code;
      const wasteDescription =
        p.acceptation?.wasteDescription ?? bsff?.waste?.description;

      const signBtnLabel = getSignBtnLabel(p);

      return [
        packagingTypeLabel(p),
        p.numero,
        weightWithUnit,
        wasteCode,
        wasteDescription,
        p.operation?.code ?? "-",
        <Badge status={p.status} />,
        signBtnLabel && (
          <SignBsffPackagingButton
            packagingId={p.id}
            btnLabel={signBtnLabel}
            priority="secondary"
          />
        )
      ];
    });

    return (
      <Modal
        onClose={onClose}
        ariaLabel="Signer l'opération des contentants"
        title="Gérer les contenants"
        isOpen
        size="XL"
      >
        <DsfrDataList>
          <DsfrDataListItem>
            <DsfrDataListTerm>BSFF n°</DsfrDataListTerm>
            <DsfrDataListDescription>{bsff.id}</DsfrDataListDescription>
          </DsfrDataListItem>
        </DsfrDataList>
        <Table
          caption="Liste des contenants du BSFF" // accessibilité
          noCaption
          headers={headers}
          data={tableData}
        ></Table>
        <div>{packagingsRecap}</div>
      </Modal>
    );
  }
}

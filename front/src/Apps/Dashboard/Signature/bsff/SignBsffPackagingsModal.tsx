import React from "react";
import { Loader } from "../../../common/Components";
import { useQuery } from "@apollo/client";
import {
  BsffPackaging,
  BsffPackagingType,
  Query,
  QueryBsffArgs,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import { GET_BSFF_FORM } from "../../../common/queries/bsff/queries";
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

interface SignPackagingsModalProps {
  bsffId: string;
  onClose: () => void;
}

function getSignBtnLabel(packaging: BsffPackaging): string | null {
  if (!!packaging.operation?.signature?.date) {
    // Calcule le nombre de jours depuis la signature du traitement
    const daysOld =
      (new Date().getTime() -
        new Date(packaging.operation.signature.date).getTime()) /
      (1000 * 3600 * 24);

    if (daysOld <= 60) {
      // La correction n'est autorisée pendant un maximum de 60 jours
      // après la signature de traitement du contenant
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
    GET_BSFF_FORM,
    {
      variables: {
        id: bsffId
      }
    }
  );

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

    const tableData = bsff.packagings.map(p => {
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
        p.operation?.code ?? "",
        <Badge status={packagingStatus(p)} />,
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
          <DsfrDataListItem>
            <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
            <DsfrDataListDescription>
              {bsff.waste?.code}
            </DsfrDataListDescription>
          </DsfrDataListItem>
          <DsfrDataListItem>
            <DsfrDataListTerm>Description</DsfrDataListTerm>
            <DsfrDataListDescription>
              {bsff.waste?.description}
            </DsfrDataListDescription>
          </DsfrDataListItem>
          <DsfrDataListItem>
            <DsfrDataListTerm>Quantité</DsfrDataListTerm>
            <DsfrDataListDescription>
              {bsff.weight?.value} kg {bsff.weight?.isEstimate ? "estimé" : ""}
            </DsfrDataListDescription>
          </DsfrDataListItem>
        </DsfrDataList>
        <Table
          caption="Liste des contenants du BSFF" // accessibilité
          noCaption
          headers={headers}
          data={tableData}
        ></Table>
      </Modal>
    );
  }
}

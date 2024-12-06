import React from "react";
import { Loader } from "../../../common/Components";
import { useQuery } from "@apollo/client";
import {
  Bsff,
  BsffPackaging,
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
import {
  SignBsffPackagingAcceptation,
  SignBsffPackagingOperation
} from "./PackagingAction";

interface SignPackagingsModalProps {
  bsffId: string;
  onClose: () => void;
}

function getPackagingAction(bsff: Bsff, packaging: BsffPackaging) {
  if (packaging.operation?.signature?.date) {
    return null;
  }
  if (packaging.acceptation?.signature?.date) {
    if (packaging.acceptation?.status === WasteAcceptationStatus.Refused) {
      return null;
    }

    return <SignBsffPackagingOperation packaging={packaging} bsff={bsff} />;
  }
  return <SignBsffPackagingAcceptation packaging={packaging} bsff={bsff} />;
}

export function SignPackagingsModal({
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
      "Numéro",
      "Type de contenant",
      "Volume",
      "Poids",
      "Code déchet",
      "Dénomination",
      "Qté acceptée",
      "Statut",
      ""
    ];

    const tableData = bsff.packagings.map(p => {
      const volume = p.volume ? `${p.volume} litres` : "";
      const weight = p.weight ? `${p.weight} kg` : "";
      const acceptedWeight = p.acceptation?.weight
        ? `${p.acceptation?.weight} kg`
        : "";

      return [
        p.numero,
        p.type,
        volume,
        weight,
        p.acceptation?.wasteCode,
        p.acceptation?.wasteDescription,
        acceptedWeight,
        "",
        getPackagingAction(bsff, p)
      ];
    });

    return (
      <Modal
        onClose={onClose}
        ariaLabel="Signer l'opération des contentants"
        isOpen
        size="XL"
      >
        <h4 className="fr-h4">Gestion des contenants</h4>
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

import React from "react";
import {
  DsfrDataList,
  DsfrDataListDescription,
  DsfrDataListItem,
  DsfrDataListTerm,
  Modal
} from "../../../../common/components";
import { useQuery } from "@apollo/client";
import { BsffPackaging, Query, QueryBsffPackagingArgs } from "@td/codegen-ui";
import { GET_BSFF_PACKAGING } from "./queries";
import { Loader } from "../../../common/Components";
import Alert from "@codegouvfr/react-dsfr/Alert";
import SignBsffPackagingForm from "./SignBsffPackagingForm";

type SignBsffPackagingModalProps = {
  packagingId: string;
  onClose: () => void;
};

function getModalTitle(packaging: BsffPackaging) {
  if (packaging.operation?.signature) {
    return `Corriger le contenant ${packaging.numero}`;
  }
  if (packaging?.acceptation?.signature) {
    return `Signer le traitement du contenant ${packaging.numero}`;
  }
  return `Signer l'acceptation du contenant ${packaging.numero}`;
}

/**
 * Modale permettant de :
 * - mettre à jour les infos d'acceptation et signer l'acceptation.
 * - mettre à jour les infos de traitement et signer le traitement.
 * - corriger les infos d'acceptation et de traitement jusqu'à
 * 6 mois après la signature du traitement.
 *
 * Les règles suivantes s'appliquent pour l'affichage des champs
 * du formulaire :
 * - lors de l'acceptation, seul les champs relatifs à l'acceptation apparaissent
 * (quantité, code déchet, description, etc)
 * - lors du traitement et lors d'une correction, on fait apparaitre à la fois
 * les champs relatifs à l'acceptation et les champs relatifs au traitement.
 */
function SignBsffPackagingModal({
  packagingId,
  onClose
}: SignBsffPackagingModalProps) {
  const { data, error, loading } = useQuery<
    Pick<Query, "bsffPackaging">,
    QueryBsffPackagingArgs
  >(GET_BSFF_PACKAGING, {
    variables: { id: packagingId }
  });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert title="Erreur" description={error.message} severity="error" />
    );
  }

  if (data) {
    const packaging = data.bsffPackaging;

    const modalTitle = getModalTitle(packaging);

    return (
      <Modal
        onClose={onClose}
        ariaLabel={modalTitle}
        title={modalTitle}
        size="L"
        isOpen
      >
        <DsfrDataList>
          <DsfrDataListItem>
            <DsfrDataListTerm>BSFF n°</DsfrDataListTerm>
            <DsfrDataListDescription>
              {packaging.bsff?.id ?? ""}
            </DsfrDataListDescription>
          </DsfrDataListItem>
        </DsfrDataList>
        <SignBsffPackagingForm
          packaging={packaging}
          onCancel={onClose}
          onSuccess={onClose}
        />
      </Modal>
    );
  }

  return null;
}

export default SignBsffPackagingModal;

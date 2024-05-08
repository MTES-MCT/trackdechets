import React from "react";
import { useMutation } from "@apollo/client";
import {
  BsdType,
  Mutation,
  MutationUpdateBsdaTransporterArgs,
  MutationUpdateBsdasriArgs,
  MutationUpdateBsffArgs,
  MutationUpdateBspaohArgs,
  MutationUpdateFormTransporterArgs
} from "@td/codegen-ui";
import TdModal from "../../../common/Components/Modal/Modal";
import { NotificationError } from "../../../common/Components/Error/Error";
import {
  BsdCurrentTransporterInfos,
  BsdDisplay
} from "../../../common/types/bsdTypes";
import { UPDATE_BSDA_TRANSPORTER } from "../../../common/queries/bsda/queries";
import { UPDATE_BSDD_TRANSPORTER } from "../../../common/queries/bsdd/queries";
import { UPDATE_BSFF_FORM } from "../../../common/queries/bsff/queries";
import { UPDATE_BSDASRI } from "../../../common/queries/bsdasri/queries";
import { UPDATE_BSPAOH } from "../../../common/queries/bspaoh/queries";
import TransporterInfoEditForm from "./TransporterInfoEditForm";
import { Loader } from "../../../common/Components";

interface TransporterInfoEditModalProps {
  bsd: BsdDisplay;
  currentTransporter: BsdCurrentTransporterInfos;
  isOpen: boolean;
  onClose: () => void;
}

const TransporterInfoEditModal = ({
  bsd,
  currentTransporter,
  isOpen,
  onClose
}: TransporterInfoEditModalProps) => {
  const [
    updateTransporterInfoBsda,
    { error: errorBsda, loading: loadingBsda }
  ] = useMutation<
    Pick<Mutation, "updateBsdaTransporter">,
    MutationUpdateBsdaTransporterArgs
  >(UPDATE_BSDA_TRANSPORTER);

  const [
    updateTransporterInfoBsdd,
    { error: errorBsdd, loading: loadingBsdd }
  ] = useMutation<
    Pick<Mutation, "updateFormTransporter">,
    MutationUpdateFormTransporterArgs
  >(UPDATE_BSDD_TRANSPORTER);

  const [
    updateTransporterInfoBsff,
    { error: errorBsff, loading: loadingBsff }
  ] = useMutation<Pick<Mutation, "updateBsff">, MutationUpdateBsffArgs>(
    UPDATE_BSFF_FORM
  );

  const [
    updateTransporterInfoBsdasri,
    { error: errorBsdasri, loading: loadingBsdasri }
  ] = useMutation<Pick<Mutation, "updateBsdasri">, MutationUpdateBsdasriArgs>(
    UPDATE_BSDASRI
  );

  const [
    updateTransporterInfoBspaoh,
    { error: errorBspaoh, loading: loadingBspaoh }
  ] = useMutation<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
    UPDATE_BSPAOH
  );

  const onSubmitForm = async data => {
    if (bsd.type === BsdType.Bsdd) {
      await updateTransporterInfoBsdd({
        variables: {
          id: currentTransporter.transporterId!,
          input: {
            numberPlate: data.plates?.toString(),
            customInfo: data.customInfo
          }
        }
      });
      return;
    }
    const formattedPlates =
      typeof data.plates === "string" && data.plates
        ? data.plates?.split(",")
        : data.plates?.length
        ? data.plates
        : [];
    if (bsd.type === BsdType.Bsda) {
      await updateTransporterInfoBsda({
        variables: {
          id: currentTransporter.transporterId!,
          input: {
            customInfo: data.customInfo,
            transport: {
              plates: formattedPlates
            }
          }
        }
      });
    } else if (bsd.type === BsdType.Bsff) {
      await updateTransporterInfoBsff({
        variables: {
          id: bsd.id,
          input: {
            transporter: {
              customInfo: data.customInfo,
              transport: { plates: formattedPlates }
            }
          }
        }
      });
    } else if (bsd.type === BsdType.Bsdasri) {
      await updateTransporterInfoBsdasri({
        variables: {
          id: bsd.id,
          input: {
            transporter: {
              customInfo: data.customInfo,
              transport: { plates: formattedPlates }
            }
          }
        }
      });
    } else if (bsd.type === BsdType.Bspaoh) {
      await updateTransporterInfoBspaoh({
        variables: {
          id: bsd.id,
          input: {
            transporter: {
              customInfo: data.customInfo,
              transport: { plates: formattedPlates }
            }
          }
        }
      });
    }
  };

  const error =
    errorBsdd || errorBsda || errorBsdasri || errorBsff || errorBspaoh;
  const loading =
    loadingBsdd ||
    loadingBsda ||
    loadingBsdasri ||
    loadingBsff ||
    loadingBspaoh;

  // if (
  //   bsd.type === BsdType.Bsda &&
  //   !["SIGNED_BY_PRODUCER", "SIGNED_BY_WORKER", "INITIAL"].includes(bsd.status)
  // ) {
  //   return null;
  // }
  return (
    <TdModal
      isOpen={isOpen}
      ariaLabel="Modifier les informations de transport"
      onClose={onClose}
    >
      <TransporterInfoEditForm
        currentTransporter={currentTransporter}
        onSubmitForm={onSubmitForm}
        onClose={onClose}
      />
      {loading && <Loader />}
      {error && <NotificationError apolloError={error} />}
    </TdModal>
  );
};

export default React.memo(TransporterInfoEditModal);

import React from "react";
import { useMutation } from "@apollo/client";
import {
  BsdType,
  Mutation,
  MutationUpdateBsdaArgs,
  MutationUpdateBsdasriArgs,
  MutationUpdateBsffArgs
} from "@td/codegen-ui";
import { UPDATE_BSDA } from "../../../common/queries/bsda/queries";
import TdModal from "../../../common/Components/Modal/Modal";
import { NotificationError } from "../../../common/Components/Error/Error";
import { BsdDisplay } from "../../../common/types/bsdTypes";
import { UPDATE_TRANSPORT_INFO } from "../../../common/queries/bsdd/queries";
import { UPDATE_BSFF_FORM } from "../../../common/queries/bsff/queries";
import { UPDATE_BSDASRI } from "../../../common/queries/bsdasri/queries";
import TransporterInfoEditForm from "./TransporterInfoEditForm";
import { Loader } from "../../../common/Components";

interface TransporterInfoEditModalProps {
  bsd: BsdDisplay;
  isOpen: boolean;
  onClose: () => void;
}

const TransporterInfoEditModal = ({
  bsd,
  isOpen,
  onClose
}: TransporterInfoEditModalProps) => {
  const [
    updateTransporterInfoBsda,
    { error: errorBsda, loading: loadingBsda }
  ] = useMutation<Pick<Mutation, "updateBsda">, MutationUpdateBsdaArgs>(
    UPDATE_BSDA
  );

  const [
    updateTransporterInfoBsdd,
    { error: errorBsdd, loading: loadingBsdd }
  ] = useMutation(UPDATE_TRANSPORT_INFO);

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

  const onSubmitForm = async data => {
    if (bsd.type === BsdType.Bsdd) {
      await updateTransporterInfoBsdd({
        variables: {
          id: bsd.id,
          transporterNumberPlate: data.plates?.toString(),
          transporterCustomInfo: data.customInfo
        }
      });
      return;
    }
    const formattedPlates =
      typeof data.plates === "string" && Boolean(data.plates)
        ? data.plates?.split(",")
        : data.plates?.length
        ? data.plates
        : [];
    if (bsd.type === BsdType.Bsda) {
      await updateTransporterInfoBsda({
        variables: {
          id: bsd.id,
          input: {
            transporter: {
              customInfo: data.customInfo,
              transport: {
                plates: formattedPlates
              }
            }
          }
        }
      });
      return;
    }
    if (bsd.type === BsdType.Bsff) {
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
      return;
    }
    if (bsd.type === BsdType.Bsdasri) {
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
      return;
    }
  };

  const error = errorBsdd || errorBsda || errorBsdasri || errorBsff;
  const loading = loadingBsdd || loadingBsda || loadingBsdasri || loadingBsff;

  if (
    bsd.type === BsdType.Bsda &&
    !["SIGNED_BY_PRODUCER", "SIGNED_BY_WORKER", "INITIAL"].includes(bsd.status)
  ) {
    return null;
  }
  return (
    <TdModal
      isOpen={isOpen}
      ariaLabel="Modifier les informations de transport"
      onClose={onClose}
    >
      <TransporterInfoEditForm
        bsd={bsd}
        onSubmitForm={onSubmitForm}
        onClose={onClose}
      />
      {loading && <Loader />}
      {error && <NotificationError apolloError={error} />}
    </TdModal>
  );
};

export default React.memo(TransporterInfoEditModal);

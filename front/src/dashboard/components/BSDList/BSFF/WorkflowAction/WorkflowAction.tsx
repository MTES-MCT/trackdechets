import React from "react";
import { BsffStatus, UserPermission } from "@td/codegen-ui";
import { BsffFragment } from "../types";
import { PublishBsff } from "./PublishBsff";
import { SignEmission } from "./SignEmission";
import { SignTransport } from "./SignTransport";
import { SignReception } from "./SignReception";
import { SignPackagings } from "../../../../../Apps/Dashboard/Validation/bsff/SignPackagings";
import { useParams } from "react-router-dom";
import { usePermissions } from "../../../../../common/contexts/PermissionsContext";
import SignBsffPackagingButton from "../../../../../Apps/Dashboard/Validation/bsff/SignBsffPackagingButton";

export interface WorkflowActionProps {
  form: BsffFragment;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { siret } = useParams<{ siret: string }>();
  const { form } = props;
  const {
    orgPermissions: { permissions }
  } = usePermissions(siret);

  const emitterSiret = form.bsffEmitter?.company?.siret;
  const transporterSiret = form.bsffTransporter?.company?.orgId;
  const destinationSiret = form.bsffDestination?.company?.siret;

  if (
    form.isDraft &&
    [emitterSiret, transporterSiret, destinationSiret].includes(siret) &&
    permissions.includes(UserPermission.BsdCanUpdate)
  ) {
    return <PublishBsff bsffId={form.id} />;
  }

  switch (form.bsffStatus) {
    case BsffStatus.Initial:
      if (siret !== emitterSiret) return null;
      if (!permissions.includes(UserPermission.BsdCanSignEmission)) return null;
      return <SignEmission bsffId={form.id} />;

    case BsffStatus.SignedByEmitter:
      if (siret !== transporterSiret) {
        return null;
      }
      if (!permissions.includes(UserPermission.BsdCanSignTransport))
        return null;
      return <SignTransport bsffId={form.id} />;

    case BsffStatus.Sent:
      if (siret !== destinationSiret) return null;
      if (!permissions.includes(UserPermission.BsdCanSignAcceptation))
        return null;
      return <SignReception bsffId={form.id} />;

    case BsffStatus.Received: {
      if (siret !== destinationSiret) return null;
      if (!permissions.includes(UserPermission.BsdCanSignOperation))
        return null;
      if (form.packagings?.length === 1) {
        return (
          <SignBsffPackagingButton
            packagingId={form.packagings[0].id}
            btnLabel="Valider l'acceptation"
          />
        );
      }
      return <SignPackagings bsffId={form.id} />;
    }

    case BsffStatus.Accepted:
      if (siret !== destinationSiret) return null;
      if (!permissions.includes(UserPermission.BsdCanSignOperation))
        return null;
      if (form.packagings?.length === 1) {
        return (
          <SignBsffPackagingButton
            packagingId={form.packagings[0].id}
            btnLabel="Signer le traitement"
          />
        );
      }
      return <SignPackagings bsffId={form.id} />;

    case BsffStatus.PartiallyRefused:
      if (siret !== destinationSiret) return null;
      if (!permissions.includes(UserPermission.BsdCanSignOperation))
        return null;
      return <SignPackagings bsffId={form.id} />;

    default:
      return null;
  }
}

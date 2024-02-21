import React from "react";
import { BsffStatus, UserPermission } from "@td/codegen-ui";
import { BsffFragment } from "../types";
import { PublishBsff } from "./PublishBsff";
import { SignEmission } from "./SignEmission";
import { SignTransport } from "./SignTransport";
import { SignReception } from "./SignReception";
import { SignBsffOperationOnePackaging } from "./SignOperation";
import { SignBsffAcceptationOnePackaging } from "./SignAcceptation";
import { SignPackagings } from "./SignPackagings";
import { useParams, useMatch } from "react-router-dom";
import routes from "../../../../../Apps/routes";
import { usePermissions } from "../../../../../common/contexts/PermissionsContext";

export interface WorkflowActionProps {
  form: BsffFragment;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { siret } = useParams<{ siret: string }>();
  const { form } = props;
  const { permissions } = usePermissions();

  const isActTab = !!useMatch(routes.dashboard.bsds.act);
  const isToCollectTab = !!useMatch(routes.dashboard.transport.toCollect);
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
      if (siret !== emitterSiret || !isActTab) return null;
      if (!permissions.includes(UserPermission.BsdCanSignEmission)) return null;
      return <SignEmission bsffId={form.id} />;

    case BsffStatus.SignedByEmitter:
      if (siret !== transporterSiret) {
        if (!isToCollectTab) {
          return null;
        }
        return null;
      }
      if (!permissions.includes(UserPermission.BsdCanSignTransport))
        return null;
      return <SignTransport bsffId={form.id} />;

    case BsffStatus.Sent:
      if (siret !== destinationSiret || !isActTab) return null;
      if (!permissions.includes(UserPermission.BsdCanSignAcceptation))
        return null;
      return <SignReception bsffId={form.id} />;

    case BsffStatus.Received:
      if (siret !== destinationSiret || !isActTab) return null;
      if (!permissions.includes(UserPermission.BsdCanSignOperation))
        return null;
      if (form.packagings?.length === 1) {
        return <SignBsffAcceptationOnePackaging bsffId={form.id} />;
      }
      return <SignPackagings bsffId={form.id} />;

    case BsffStatus.Accepted:
      if (siret !== destinationSiret) return null;
      if (!permissions.includes(UserPermission.BsdCanSignOperation))
        return null;
      if (form.packagings?.length === 1) {
        return <SignBsffOperationOnePackaging bsffId={form.id} />;
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

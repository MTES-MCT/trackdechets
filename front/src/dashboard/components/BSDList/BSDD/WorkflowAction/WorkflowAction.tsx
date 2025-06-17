import React from "react";
import { EmitterType, Form, FormStatus, UserPermission } from "@td/codegen-ui";
import MarkAsSealed from "./MarkAsSealed";
import MarkAsResealed from "./MarkAsResealed";
import SignEmissionForm from "./SignEmissionForm";
import SignTransportForm from "./SignTransportForm";
import routes from "../../../../../Apps/routes";
import { useMatch } from "react-router-dom";
import { usePermissions } from "../../../../../common/contexts/PermissionsContext";
import { SignReception } from "../../../../../Apps/Dashboard/Validation/BSDD/SignReception";
import { SignOperation } from "../../../../../Apps/Dashboard/Validation/BSDD/SignOperation";

export interface WorkflowActionProps {
  form: Form;
  siret: string;
  options?: { canSkipEmission: boolean };
}

export function WorkflowAction(props: WorkflowActionProps) {
  // siret prop contains either SIRET or a VAT number
  const { form, siret } = props;
  const isActTab = !!useMatch(routes.dashboard.bsds.act);
  const { orgPermissions: { permissions } } = usePermissions(siret);

  const isTempStorage = form.recipient?.isTempStorage;
  const isAppendix1 = form.emitter?.type === EmitterType.Appendix1;
  const isAppendix1Producer =
    form.emitter?.type === EmitterType.Appendix1Producer;

  switch (form.status) {
    case FormStatus.Draft:
      if (!permissions.includes(UserPermission.BsdCanUpdate)) return null;
      return <MarkAsSealed {...props} />;
    case FormStatus.Sealed: {
      if (isAppendix1) {
        return null;
      }
      if (!permissions.includes(UserPermission.BsdCanSignEmission)) return null;

      if (isAppendix1Producer) {
        return (
          <>
            {props.options?.canSkipEmission &&
              form.transporter?.company?.orgId === siret && (
                <SignTransportForm {...props} />
              )}

            {[
              form.emitter?.company?.siret,
              form.ecoOrganisme?.siret,
              form.transporter?.company?.orgId
            ].includes(siret) &&
              !form.emitter?.isPrivateIndividual && (
                <SignEmissionForm {...props} />
              )}
          </>
        );
      }

      if (
        [
          form.emitter?.company?.siret,
          form.ecoOrganisme?.siret,
          form.transporter?.company?.orgId
        ].includes(siret)
      ) {
        return <SignEmissionForm {...props} />;
      }
      return null;
    }
    case FormStatus.SignedByProducer: {
      if (!permissions.includes(UserPermission.BsdCanSignTransport))
        return null;

      if (form.transporter?.company?.orgId === siret) {
        return <SignTransportForm {...props} />;
      }
      return null;
    }
    case FormStatus.Sent: {
      if (isAppendix1Producer) {
        return null;
      }

      if (siret === form.recipient?.company?.siret && isActTab) {
        if (!permissions.includes(UserPermission.BsdCanSignAcceptation))
          return null;

        let title = "Signer la réception et l'acceptation";
        if (isTempStorage) {
          title = "Signer la réception de l'entreposage provisoire";
        }

        return (
          <SignReception
            title={title}
            formId={form.id}
            displayActionButton={false}
          />
        );
      }

      if (form.transporters?.length > 1) {
        // Premier transporteur de la liste qui n'a pas encore pris en charge le déchet.
        const nextTransporter = (form.transporters ?? []).find(
          t => !t.takenOverAt
        );
        if (
          nextTransporter &&
          siret === nextTransporter.company?.orgId &&
          permissions.includes(UserPermission.BsdCanSignTransport)
        ) {
          return <SignTransportForm {...props} />;
        }
      }

      return null;
    }
    case FormStatus.TempStored: {
      if (
        siret === form.recipient?.company?.siret &&
        permissions.includes(UserPermission.BsdCanSignAcceptation)
      ) {
        return (
          <SignReception
            title={"Signer l'acceptation de l'entreposage provisoire"}
            formId={form.id}
            displayActionButton={false}
          />
        );
      }
      return null;
    }
    case FormStatus.TempStorerAccepted: {
      if (
        siret === form.recipient?.company?.siret &&
        permissions.includes(UserPermission.BsdCanSignOperation)
      ) {
        return (
          <div className="tw-flex tw-space-x-2">
            <SignOperation
              title={"Signer le traitement"}
              formId={form.id}
              displayActionButton={false}
            />

            <MarkAsResealed {...props} />
          </div>
        );
      }
      return null;
    }
    case FormStatus.Resealed: {
      if (
        [
          form.recipient?.company?.siret,
          form.temporaryStorageDetail?.transporter?.company?.orgId
        ].includes(siret) &&
        permissions.includes(UserPermission.BsdCanSignEmission)
      ) {
        return <SignEmissionForm {...props} />;
      }
      return null;
    }
    case FormStatus.SignedByTempStorer: {
      if (
        siret === form.temporaryStorageDetail?.transporter?.company?.orgId &&
        permissions.includes(UserPermission.BsdCanSignTransport)
      ) {
        return <SignTransportForm {...props} />;
      }
      return null;
    }
    case FormStatus.Resent: {
      if (
        siret === form.temporaryStorageDetail?.destination?.company?.siret &&
        permissions.includes(UserPermission.BsdCanSignAcceptation)
      ) {
        return (
          <SignReception
            title={"Signer la réception"}
            formId={form.id}
            displayActionButton={false}
          />
        );
      }
      return null;
    }
    case FormStatus.Received: {
      if (isAppendix1Producer) {
        return null;
      }

      if (
        ((isTempStorage &&
          siret === form.temporaryStorageDetail?.destination?.company?.siret) ||
          (!isTempStorage && siret === form.recipient?.company?.siret)) &&
        permissions.includes(UserPermission.BsdCanSignAcceptation)
      ) {
        return (
          <SignReception
            title={"Signer l'acceptation"}
            formId={form.id}
            displayActionButton={false}
          />
        );
      }
      return null;
    }
    case FormStatus.Accepted: {
      if (isAppendix1Producer) {
        return null;
      }

      if (
        !isTempStorage &&
        siret === form.recipient?.company?.siret &&
        permissions.includes(UserPermission.BsdCanSignOperation)
      ) {
        return (
          <div className="tw-flex tw-space-x-2">
            {!isAppendix1 && <MarkAsResealed {...props} />}
            <SignOperation
              title={"Signer le traitement"}
              formId={form.id}
              displayActionButton={false}
            />
          </div>
        );
      } else if (
        isTempStorage &&
        siret === form.temporaryStorageDetail?.destination?.company?.siret &&
        permissions.includes(UserPermission.BsdCanSignOperation)
      ) {
        return (
          <SignOperation
            title={"Signer le traitement"}
            formId={form.id}
            displayActionButton={false}
          />
        );
      }
      return null;
    }
    default:
      return null;
  }
}

import React from "react";
import {
  CompanyPrivate,
  Mutation,
  MutationUpdateEmailNotificationsArgs,
  UserNotification
} from "@td/codegen-ui";
import { useForm } from "react-hook-form";
import { authorizedNotifications as authorizedNotificationsByUserRole } from "@td/constants";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { UPDATE_EMAIL_NOTIFICATIONS } from "./queries";
import { MY_COMPANIES } from "../../Companies/common/queries";

type AccountCompanyNotificationsUpdateModalProps = {
  company: CompanyPrivate;
  close: () => void;
};

type FormValues = { [key in UserNotification]: boolean };

export default function AccountCompanyNotificationsUpdateModal({
  company,
  close
}: AccountCompanyNotificationsUpdateModalProps) {
  const [updateEmailNotifications, { loading, data, error }] = useMutation<
    Pick<Mutation, "updateEmailNotifications">,
    MutationUpdateEmailNotificationsArgs
  >(UPDATE_EMAIL_NOTIFICATIONS, { refetchQueries: [MY_COMPANIES] });

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      MEMBERSHIP_REQUEST: company.userNotifications.includes(
        UserNotification.MembershipRequest
      ),
      SIGNATURE_CODE_RENEWAL: company.userNotifications.includes(
        UserNotification.SignatureCodeRenewal
      ),
      BSD_REFUSAL: company.userNotifications.includes(
        UserNotification.BsdRefusal
      ),
      BSDA_FINAL_DESTINATION_UPDATE: company.userNotifications.includes(
        UserNotification.BsdaFinalDestinationUpdate
      ),
      REVISION_REQUEST: company.userNotifications.includes(
        UserNotification.RevisionRequest
      )
    }
  });

  const onSubmit = async (data: FormValues) => {
    const notifications = Object.keys(data).filter(k => data[k]);
    const { errors } = await updateEmailNotifications({
      variables: {
        input: {
          companyOrgId: company.orgId,
          emailNotifications: notifications as UserNotification[]
        }
      }
    });
    if (!errors) {
      close();
    }
  };

  const authorizedNotifications = company.userRole
    ? authorizedNotificationsByUserRole[company.userRole]
    : [];

  const rattachementIsAuthorized =
    authorizedNotifications.includes("MEMBERSHIP_REQUEST");

  const signatureCodeRenewalIsAuthorized = authorizedNotifications.includes(
    "SIGNATURE_CODE_RENEWAL"
  );

  const bsdRefusalIsAuthorized =
    authorizedNotifications.includes("BSD_REFUSAL");

  const bsdaFinalDestinationUpdateIsAuthorized =
    authorizedNotifications.includes("BSDA_FINAL_DESTINATION_UPDATE");

  const revisionRequestIsAuthorized =
    authorizedNotifications.includes("REVISION_REQUEST");

  const unauthorizedHintText =
    "Votre rôle au sein de l'établissement ne vous permet pas " +
    "de vous abonner à ce type d'alerte";

  let checkboxState: "default" | "error" | "success" = "default";

  if (error) {
    checkboxState = "error";
  } else if (data) {
    checkboxState = "success";
  }

  return (
    <>
      <div style={{ marginBottom: 10, marginTop: 10 }}>
        Je souhaite recevoir par courriel les notifications de l'établissement{" "}
        {company.name} ({company.siret}) relatives :
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Checkbox
          small
          state={checkboxState}
          stateRelatedMessage={error?.message}
          options={[
            {
              hintText: rattachementIsAuthorized
                ? "Seuls les membres avec le rôle Administrateur sont en mesure de recevoir " +
                  "et d'accepter / refuser / effectuer des demandes de rattachement à leur établissement. " +
                  "Nous vous conseillons donc vivement, pour chaque établissement de conserver au moins un " +
                  "administrateur abonné à ce type de notification."
                : unauthorizedHintText,
              label: "aux demandes de rattachement",
              nativeInputProps: {
                disabled: !rattachementIsAuthorized,
                ...register("MEMBERSHIP_REQUEST")
              }
            },
            {
              hintText: signatureCodeRenewalIsAuthorized
                ? "Un courriel sera envoyé à chaque renouvellement du code de signature"
                : unauthorizedHintText,
              label: "au renouvellement du code de signature",
              nativeInputProps: {
                disabled: !signatureCodeRenewalIsAuthorized,
                ...register("SIGNATURE_CODE_RENEWAL")
              }
            },
            {
              hintText: bsdRefusalIsAuthorized
                ? "un courriel sera envoyé à chaque refus total ou partiel d'un bordereau"
                : unauthorizedHintText,
              label: "au refus total et partiel des bordereaux",
              nativeInputProps: {
                disabled: !bsdRefusalIsAuthorized,
                ...register("BSD_REFUSAL")
              }
            },
            {
              hintText: bsdaFinalDestinationUpdateIsAuthorized
                ? "Un courriel sera envoyé lorsque le BSDA est envoyé à un exutoire" +
                  " différent de celui prévu lors de la signature producteur"
                : unauthorizedHintText,
              label: "à la modification de la destination finale amiante",
              nativeInputProps: {
                disabled: !bsdaFinalDestinationUpdateIsAuthorized,
                ...register("BSDA_FINAL_DESTINATION_UPDATE")
              }
            },
            {
              hintText:
                "Un courriel sera envoyé à chaque fois qu'une révision sera restée sans réponse 14 jours après sa demande",
              label: "aux demandes de révision",
              nativeInputProps: {
                disabled: !revisionRequestIsAuthorized,
                ...register("REVISION_REQUEST")
              }
            }
          ]}
        />

        <div style={{ display: "flex", justifyContent: "right", gap: 20 }}>
          <Button
            title="Annuler"
            priority="secondary"
            onClick={close}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button title="Valider" type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </>
  );
}

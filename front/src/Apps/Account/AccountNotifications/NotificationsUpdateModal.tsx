import React from "react";
import {
  CompanyPrivate,
  Mutation,
  MutationSetCompanyNotificationsArgs,
  UserNotification
} from "@td/codegen-ui";
import { useForm } from "react-hook-form";
import {
  ALL_NOTIFICATIONS,
  authorizedNotifications as authorizedNotificationsByUserRole
} from "@td/constants";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { SET_COMPANY_NOTIFICATIONS } from "./queries";

type AccountCompanyNotificationsUpdateModalProps = {
  company: CompanyPrivate;
  close: () => void;
};

type FormValues = { [key in UserNotification]: boolean };

// Ce texte s'affiche en texte d'informations quand une checkbox est
// grisée parce que le rôle de l'utilisateur ne l'autorise pas à
// s'abonner à un type d'alerte
const disabledHintText =
  "Votre rôle au sein de l'établissement ne vous permet pas " +
  "de vous abonner à ce type d'alerte";

export default function NotificationsUpdateModal({
  company,
  close
}: AccountCompanyNotificationsUpdateModalProps) {
  const [setCompanyNotifications, { loading, data, error }] = useMutation<
    Pick<Mutation, "setCompanyNotifications">,
    MutationSetCompanyNotificationsArgs
  >(SET_COMPANY_NOTIFICATIONS);

  const defaultValues: FormValues = ALL_NOTIFICATIONS.reduce(
    (values, notification) => ({
      ...values,
      [notification]: company.userNotifications.includes(
        notification as UserNotification
      )
    }),
    {} as FormValues
  );

  const authorizedNotifications = company.userRole
    ? authorizedNotificationsByUserRole[company.userRole]
    : [];

  // L'abonnement à certaines notifications est restreinte
  // en fonction du rôle de l'utilisateur au sein de l'établissement
  const disabled: { [key in UserNotification]: boolean } =
    ALL_NOTIFICATIONS.reduce(
      (acc, notification) => ({
        ...acc,
        [notification]: !authorizedNotifications.includes(notification)
      }),
      {} as { [key in UserNotification]: boolean }
    );

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues
  });

  const onSubmit = async (data: FormValues) => {
    const notifications = Object.keys(data).filter(k => data[k]);
    const { errors } = await setCompanyNotifications({
      variables: {
        input: {
          companyOrgId: company.orgId,
          notifications: notifications as UserNotification[]
        }
      }
    });
    if (!errors) {
      close();
    }
  };

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
              hintText: !disabled[UserNotification.MembershipRequest]
                ? "Seuls les membres avec le rôle Administrateur sont en mesure de recevoir " +
                  "et d'accepter / refuser / effectuer des demandes de rattachement à leur établissement. " +
                  "Nous vous conseillons donc vivement, pour chaque établissement de conserver au moins un " +
                  "administrateur abonné à ce type de notification."
                : disabledHintText,
              label: "aux demandes de rattachement",
              nativeInputProps: {
                disabled: disabled[UserNotification.MembershipRequest],
                ...register(UserNotification.MembershipRequest)
              }
            },
            {
              hintText: !disabled[UserNotification.SignatureCodeRenewal]
                ? "Un courriel sera envoyé à chaque renouvellement du code de signature"
                : disabledHintText,
              label: "au renouvellement du code de signature",
              nativeInputProps: {
                disabled: disabled[UserNotification.SignatureCodeRenewal],
                ...register(UserNotification.SignatureCodeRenewal)
              }
            },
            {
              hintText: !disabled[UserNotification.BsdRefusal]
                ? "un courriel sera envoyé à chaque refus total ou partiel d'un bordereau"
                : disabledHintText,
              label: "au refus total et partiel des bordereaux",
              nativeInputProps: {
                disabled: disabled[UserNotification.BsdRefusal],
                ...register(UserNotification.BsdRefusal)
              }
            },
            {
              hintText: !disabled[UserNotification.BsdaFinalDestinationUpdate]
                ? "Un courriel sera envoyé lorsque le BSDA est envoyé à un exutoire" +
                  " différent de celui prévu lors de la signature producteur"
                : disabledHintText,
              label: "à la modification de la destination finale amiante",
              nativeInputProps: {
                disabled: disabled[UserNotification.BsdaFinalDestinationUpdate],
                ...register(UserNotification.BsdaFinalDestinationUpdate)
              }
            },
            {
              hintText: !disabled[UserNotification.RevisionRequest]
                ? "Un courriel sera envoyé à chaque fois qu'une révision sera restée sans réponse 14 jours après sa demande"
                : disabledHintText,
              label: "aux demandes de révision",
              nativeInputProps: {
                disabled: disabled[UserNotification.RevisionRequest],
                ...register(UserNotification.RevisionRequest)
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

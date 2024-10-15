import React from "react";
import {
  CompanyPrivate,
  Mutation,
  MutationSetCompanyNotificationsArgs,
  UserNotification
} from "@td/codegen-ui";
import { useForm } from "react-hook-form";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { SET_COMPANY_NOTIFICATIONS } from "./queries";
import styles from "./NotificationsUpdateModal.module.scss";

export const ALL_NOTIFICATIONS = [
  "MEMBERSHIP_REQUEST",
  "REVISION_REQUEST",
  "BSD_REFUSAL",
  "SIGNATURE_CODE_RENEWAL",
  "BSDA_FINAL_DESTINATION_UPDATE"
];
export const authorizedNotificationsByUserRole = {
  ADMIN: [
    "MEMBERSHIP_REQUEST",
    "REVISION_REQUEST",
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ],
  MEMBER: [
    "REVISION_REQUEST",
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ],
  READER: [
    "REVISION_REQUEST",
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ],
  DRIVER: [
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ]
};
type AccountCompanyNotificationsUpdateModalProps = {
  company: CompanyPrivate;
  close: () => void;
};

type FormValues = { [key in UserNotification]: boolean };

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

  const optionsLabels = [
    {
      hintText:
        "Seuls les membres avec le rôle Administrateur sont en mesure de recevoir " +
        "et d'accepter / refuser / effectuer des demandes de rattachement à leur établissement. " +
        "Nous vous conseillons donc vivement, pour chaque établissement de conserver au moins un " +
        "administrateur abonné à ce type de notification.",
      label: "aux demandes de rattachement",
      notification: UserNotification.MembershipRequest
    },
    {
      hintText:
        "Un courriel sera envoyé à chaque renouvellement du code de signature",
      label: "au renouvellement du code de signature",
      notification: UserNotification.SignatureCodeRenewal
    },
    {
      hintText:
        "un courriel sera envoyé à chaque refus total ou partiel d'un bordereau",
      label: "au refus total et partiel des bordereaux",
      notification: UserNotification.BsdRefusal
    },
    {
      hintText:
        "Un courriel sera envoyé lorsque le BSDA est envoyé à un exutoire" +
        " différent de celui prévu lors de la signature producteur",
      label: "à la modification de la destination finale amiante",
      notification: UserNotification.BsdaFinalDestinationUpdate
    },
    {
      hintText:
        "Un courriel sera envoyé à chaque fois qu'une révision sera restée sans réponse 14 jours après sa demande",
      label: "aux demandes de révision",
      notification: UserNotification.RevisionRequest
    }
  ];

  const options = optionsLabels
    .filter(({ notification }) =>
      authorizedNotifications.includes(notification)
    )
    .map(({ label, hintText, notification }) => ({
      label,
      hintText,
      nativeInputProps: {
        ...register(notification)
      }
    }));

  return (
    <>
      <div className="fr-my-2w">
        Je souhaite recevoir par courriel les notifications de l'établissement{" "}
        {company.name} ({company.siret}) relatives :
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Checkbox
          small
          state={checkboxState}
          stateRelatedMessage={error?.message}
          options={options}
        />

        <div className={styles.buttons}>
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

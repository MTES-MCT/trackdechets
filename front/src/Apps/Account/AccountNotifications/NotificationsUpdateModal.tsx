import React from "react";
import {
  CompanyPrivate,
  Mutation,
  MutationSetCompanyNotificationsArgs,
  UserNotifications,
  UserRole
} from "@td/codegen-ui";
import { useForm } from "react-hook-form";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { SET_COMPANY_NOTIFICATIONS } from "./queries";
import styles from "./NotificationsUpdateModal.module.scss";

type AccountCompanyNotificationsUpdateModalProps = {
  company: CompanyPrivate;
  close: () => void;
};

type OptionLabel = {
  hintText: string;
  label: string;
  notification: keyof UserNotifications;
};

// if you modify this structure, please modify
// in back/src/users/notifications
export const authorizedNotificationsByUserRole: {
  [key in UserRole]: (keyof UserNotifications)[];
} = {
  [UserRole.Admin]: [],
  [UserRole.Member]: [
    "revisionRequest",
    "bsdRefusal",
    "signatureCodeRenewal",
    "bsdaFinalDestinationUpdate"
  ],
  [UserRole.Reader]: [
    "revisionRequest",
    "bsdRefusal",
    "signatureCodeRenewal",
    "bsdaFinalDestinationUpdate"
  ],
  [UserRole.Driver]: [
    "bsdRefusal",
    "signatureCodeRenewal",
    "bsdaFinalDestinationUpdate"
  ]
};

export default function NotificationsUpdateModal({
  company,
  close
}: AccountCompanyNotificationsUpdateModalProps) {
  const [setCompanyNotifications, { loading, data, error }] = useMutation<
    Pick<Mutation, "setCompanyNotifications">,
    MutationSetCompanyNotificationsArgs
  >(SET_COMPANY_NOTIFICATIONS);

  const authorizedNotifications = company.userRole
    ? authorizedNotificationsByUserRole[company.userRole]
    : [];

  const { register, handleSubmit } = useForm<UserNotifications>({
    defaultValues: company.userNotifications
  });

  const onSubmit = async (data: UserNotifications) => {
    const { errors } = await setCompanyNotifications({
      variables: {
        input: {
          companyOrgId: company.orgId,
          notifications: data
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

  const optionsLabels: OptionLabel[] = [
    {
      hintText:
        "Seuls les membres avec le rôle Administrateur sont en mesure de recevoir " +
        "et d'accepter / refuser / effectuer des demandes de rattachement à leur établissement. " +
        "Nous vous conseillons donc vivement, pour chaque établissement de conserver au moins un " +
        "administrateur abonné à ce type de notification.",
      label: "aux demandes de rattachement",
      notification: "membershipRequest"
    },
    {
      hintText:
        "Un courriel sera envoyé à chaque renouvellement du code de signature",
      label: "au renouvellement du code de signature",
      notification: "signatureCodeRenewal"
    },
    {
      hintText:
        "un courriel sera envoyé à chaque refus total ou partiel d'un bordereau",
      label: "au refus total et partiel des bordereaux",
      notification: "bsdRefusal"
    },
    {
      hintText:
        "Un courriel sera envoyé lorsque le BSDA est envoyé à un exutoire" +
        " différent de celui prévu lors de la signature producteur",
      label: "à la modification de la destination finale amiante",
      notification: "bsdaFinalDestinationUpdate"
    },
    {
      hintText:
        "Un courriel sera envoyé à chaque fois qu'une révision sera restée sans réponse 14 jours après sa demande",
      label: "aux demandes de révision",
      notification: "revisionRequest"
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

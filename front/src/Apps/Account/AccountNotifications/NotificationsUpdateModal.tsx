import React from "react";
import {
  CompanyPrivate,
  Mutation,
  MutationSubscribeToCompanyNotificationsArgs,
  UserNotifications,
  UserRole
} from "@td/codegen-ui";
import { useForm } from "react-hook-form";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { SUBSCRIBE_TO_COMPANY_NOTIFICATIONS } from "./queries";
import styles from "./NotificationsUpdateModal.module.scss";
import { hintTexts } from "./utils";
import { Modal } from "../../../common/components";

type AccountCompanyNotificationsUpdateModalProps = {
  company: CompanyPrivate;
  // état de la modale
  open: boolean;
  // action permettant de fermer la modale
  close: () => void;
};

type OptionLabel = {
  label: string;
  notification: keyof UserNotifications;
};

// if you modify this structure, please modify
// in back/src/users/notifications
export const authorizedNotificationsByUserRole: {
  [key in UserRole]: (keyof UserNotifications)[];
} = {
  [UserRole.Admin]: [
    "membershipRequest",
    "revisionRequest",
    "bsdRefusal",
    "signatureCodeRenewal",
    "bsdaFinalDestinationUpdate"
  ],
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
  open,
  close
}: AccountCompanyNotificationsUpdateModalProps) {
  const [subscribeToCompanyNotifications, { loading, data, error }] =
    useMutation<
      Pick<Mutation, "subscribeToCompanyNotifications">,
      MutationSubscribeToCompanyNotificationsArgs
    >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS);

  const authorizedNotifications = company.userRole
    ? authorizedNotificationsByUserRole[company.userRole]
    : [];

  const { register, handleSubmit } = useForm<UserNotifications>({
    defaultValues: company.userNotifications
  });

  const onSubmit = async (data: UserNotifications) => {
    const { errors } = await subscribeToCompanyNotifications({
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
      label: "aux demandes de rattachement",
      notification: "membershipRequest"
    },
    {
      label: "au renouvellement du code de signature",
      notification: "signatureCodeRenewal"
    },
    {
      label: "au refus total et partiel des bordereaux",
      notification: "bsdRefusal"
    },
    {
      label: "à la modification de la destination finale amiante",
      notification: "bsdaFinalDestinationUpdate"
    },
    {
      label: "aux demandes de révision",
      notification: "revisionRequest"
    }
  ];

  const options = optionsLabels
    .filter(({ notification }) =>
      authorizedNotifications.includes(notification)
    )
    .map(({ label, notification }) => ({
      label,
      hintText: hintTexts[notification],
      nativeInputProps: {
        ...register(notification)
      }
    }));

  const modalTitle = "Gérer les notifications";

  return (
    <Modal
      isOpen={open}
      title={modalTitle}
      ariaLabel={modalTitle}
      onClose={close}
      size="L"
    >
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
    </Modal>
  );
}

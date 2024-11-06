import React, { ReactNode, useMemo } from "react";
import {
  CompanyMember,
  CompanyPrivate,
  Mutation,
  MutationSubscribeToCompanyNotificationsArgs,
  User,
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
import SubscribersCountBadge from "./SubscribersCountBadge";

type AccountCompanyNotificationsUpdateModalProps = {
  company: CompanyPrivate;
  me: Pick<User, "email">;
  // état de la modale
  open: boolean;
  // action permettant de fermer la modale
  close: () => void;
};

type OptionLabel = {
  label: ReactNode;
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

type GetSubscribersOpts = {
  // Liste des membres de l'établissements différent de l'utilisateur connecté
  users: CompanyMember[];
  // Abonnement de l'utilisateur connecté
  notifications: UserNotifications;
};

function getSubscribersCount({ users, notifications }: GetSubscribersOpts) {
  // Initialise le comptage des abonnés à partir des notifications de l'utilisateur connexté
  const subscribersCount = {
    membershipRequest: notifications.membershipRequest ? 1 : 0,
    signatureCodeRenewal: notifications.signatureCodeRenewal ? 1 : 0,
    bsdRefusal: notifications.bsdRefusal ? 1 : 0,
    bsdaFinalDestinationUpdate: notifications.bsdaFinalDestinationUpdate
      ? 1
      : 0,
    revisionRequest: notifications.revisionRequest ? 1 : 0
  };

  // Incrémente le comptage à partir des abonnements des autres utilisateurs
  for (const user of users) {
    if (user.notifications.membershipRequest) {
      subscribersCount.membershipRequest =
        subscribersCount.membershipRequest + 1;
    }
    if (user.notifications.signatureCodeRenewal) {
      subscribersCount.signatureCodeRenewal =
        subscribersCount.signatureCodeRenewal + 1;
    }
    if (user.notifications.bsdRefusal) {
      subscribersCount.bsdRefusal = subscribersCount.bsdRefusal + 1;
    }
    if (user.notifications.bsdaFinalDestinationUpdate) {
      subscribersCount.bsdaFinalDestinationUpdate =
        subscribersCount.bsdaFinalDestinationUpdate + 1;
    }
    if (user.notifications.revisionRequest) {
      subscribersCount.revisionRequest = subscribersCount.revisionRequest + 1;
    }
  }

  return subscribersCount;
}

export default function NotificationsUpdateModal({
  company,
  me,
  open,
  close
}: AccountCompanyNotificationsUpdateModalProps) {
  const [
    subscribeToCompanyNotifications,
    { loading, data, error, reset: resetMutation }
  ] = useMutation<
    Pick<Mutation, "subscribeToCompanyNotifications">,
    MutationSubscribeToCompanyNotificationsArgs
  >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS);

  const authorizedNotifications = company.userRole
    ? authorizedNotificationsByUserRole[company.userRole]
    : [];

  const { register, handleSubmit, watch, reset } = useForm<UserNotifications>({
    defaultValues: company.userNotifications
  });

  function resetAndClose() {
    resetMutation();
    reset();
    close();
  }

  const notifications = watch();

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
      resetAndClose();
    }
  };

  let checkboxState: "default" | "error" | "success" = "default";

  if (error) {
    checkboxState = "error";
  } else if (data) {
    checkboxState = "success";
  }

  // liste des utilisateurs autres que l'utilisateur connecté
  const allMembersButMe = (company.users ?? []).filter(
    u => u.email !== me.email
  );

  const subscribersCount = useMemo(
    () => getSubscribersCount({ users: allMembersButMe, notifications }),
    [allMembersButMe, notifications]
  );

  const optionsLabels: OptionLabel[] = [
    {
      label: (
        <div>
          <span className="fr-mr-1w">aux demandes de rattachement</span>
          <SubscribersCountBadge count={subscribersCount.membershipRequest} />
        </div>
      ),
      notification: "membershipRequest"
    },
    {
      label: (
        <div>
          <span className="fr-mr-1w">
            au renouvellement du code de signature
          </span>
          <SubscribersCountBadge
            count={subscribersCount.signatureCodeRenewal}
          />
        </div>
      ),
      notification: "signatureCodeRenewal"
    },
    {
      label: (
        <div>
          <span className="fr-mr-1w">
            au refus total et partiel des bordereaux
          </span>
          <SubscribersCountBadge count={subscribersCount.bsdRefusal} />
        </div>
      ),
      notification: "bsdRefusal"
    },
    {
      label: (
        <div>
          <span className="fr-mr-1w">
            à la modification de la destination finale amiante
          </span>
          <SubscribersCountBadge
            count={subscribersCount.bsdaFinalDestinationUpdate}
          />
        </div>
      ),
      notification: "bsdaFinalDestinationUpdate"
    },
    {
      label: (
        <div>
          <span className="fr-mr-1w">aux demandes de révision</span>
          <SubscribersCountBadge count={subscribersCount.revisionRequest} />
        </div>
      ),
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
      onClose={resetAndClose}
      size="L"
    >
      <div className="fr-my-2w">
        Je souhaite recevoir par courriel les notifications de l'établissement{" "}
        {company.name} ({company.orgId}) relatives :
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
            onClick={resetAndClose}
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

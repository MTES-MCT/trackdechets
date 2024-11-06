import { useMutation } from "@apollo/client";
import {
  Mutation,
  MutationSubscribeToNotificationsArgs,
  UserNotifications,
  UserNotificationsInput
} from "@td/codegen-ui";
import React from "react";
import { SUBSCRIBE_TO_NOTIFICATIONS } from "./queries";
import { useForm } from "react-hook-form";
import Button from "@codegouvfr/react-dsfr/Button";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import styles from "./NotificationsUpdateAllModal.module.scss";
import { Modal } from "../../../common/components";
import Alert from "@codegouvfr/react-dsfr/Alert";

type AccountNotificationsUpdateAllModalProps = {
  // nombre total d'établissements
  totalCount: number;
  // état de la modale
  open: boolean;
  // action permettant de fermer la modale
  close: () => void;
};

enum SubscribeActions {
  DoNothing = "DoNothing",
  Subscribe = "Subscribe",
  Unsuscribe = "Unsubscribe"
}

type FormValues = {
  membershipRequest: SubscribeActions;
  signatureCodeRenewal: SubscribeActions;
  bsdRefusal: SubscribeActions;
  bsdaFinalDestinationUpdate: SubscribeActions;
  revisionRequest: SubscribeActions;
};

type RadioInput = {
  legend: string;
  notification: keyof Omit<UserNotifications, "__typename">;
  // message à afficher sous le label "Activer pour tous vo établissements"
  activateHint?: string;
};

export default function AccountNotificationsUpdateAllModal({
  totalCount,
  open,
  close
}: AccountNotificationsUpdateAllModalProps) {
  const [
    subscribeToNotifications,
    { loading, data, error, reset: resetMutation }
  ] = useMutation<
    Pick<Mutation, "subscribeToNotifications">,
    MutationSubscribeToNotificationsArgs
  >(SUBSCRIBE_TO_NOTIFICATIONS);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      membershipRequest: SubscribeActions.DoNothing,
      signatureCodeRenewal: SubscribeActions.DoNothing,
      bsdRefusal: SubscribeActions.DoNothing,
      bsdaFinalDestinationUpdate: SubscribeActions.DoNothing,
      revisionRequest: SubscribeActions.DoNothing
    }
  });

  function resetAndClose() {
    reset();
    resetMutation();
    close();
  }

  const onSubmit = async (data: FormValues) => {
    const notifications: UserNotificationsInput = Object.entries(data).reduce(
      (acc, [notification, action]) => {
        if (action === SubscribeActions.Subscribe) {
          return { ...acc, [notification]: true };
        } else if (action === SubscribeActions.Unsuscribe) {
          return { ...acc, [notification]: false };
        }
        return acc;
      },
      {}
    );
    if (Object.keys(notifications).length === 0) {
      resetAndClose();
      return;
    }

    const { errors } = await subscribeToNotifications({
      variables: {
        input: {
          notifications
        }
      }
    });
    if (!errors) {
      resetAndClose();
    }
  };

  const radioInputs: RadioInput[] = [
    {
      legend: "Demandes de rattachement",
      notification: "membershipRequest",
      activateHint:
        "S'applique uniquement aux établissements sur lesquelles vous avez le rôle administrateur"
    },
    {
      legend: "Renouvellement du code signature",
      notification: "signatureCodeRenewal"
    },
    {
      legend: "Refus total et partiel des bordereaux",
      notification: "bsdRefusal"
    },
    {
      legend: "Modification de la destination finale amiante",
      notification: "bsdaFinalDestinationUpdate"
    },
    {
      legend: "Demandes de révision",
      notification: "revisionRequest",
      activateHint:
        "Ne s'applique pas aux établissements sur lesquelles vous avez le rôle chauffeur"
    }
  ];

  let radioButtonState: "default" | "error" | "success" = "default";

  if (error) {
    radioButtonState = "error";
  } else if (data) {
    radioButtonState = "success";
  }

  const modaleTitle = "Gérer les notifications";

  const values = watch([
    "membershipRequest",
    "signatureCodeRenewal",
    "bsdRefusal",
    "bsdaFinalDestinationUpdate",
    "revisionRequest"
  ]);

  const saveButtonIsDisabled = values.every(
    v => v === SubscribeActions.DoNothing
  );

  return (
    <Modal
      isOpen={open}
      title={modaleTitle}
      ariaLabel={modaleTitle}
      onClose={resetAndClose}
      size="L"
    >
      <div className="fr-mb-2w">
        Le formulaire suivant permet de s'abonner ou se désabonner aux
        notifications de différents types pour l'ensemble de vos {totalCount}{" "}
        établissements.
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          {radioInputs.map(({ notification, legend, activateHint }) => (
            <RadioButtons
              legend={legend}
              name={notification}
              state={radioButtonState}
              stateRelatedMessage={error?.message}
              className={styles.radioButtons}
              options={[
                {
                  label: "Ne rien faire",
                  nativeInputProps: {
                    value: SubscribeActions.DoNothing,
                    ...register(notification)
                  }
                },
                {
                  label: "Activer pour tous les établissements",
                  hintText: activateHint,
                  nativeInputProps: {
                    value: SubscribeActions.Subscribe,
                    ...register(notification)
                  }
                },
                {
                  label: "Désactiver pour tous les établissements",
                  nativeInputProps: {
                    value: SubscribeActions.Unsuscribe,
                    ...register(notification)
                  }
                }
              ]}
              orientation="horizontal"
            />
          ))}
        </div>
        {!saveButtonIsDisabled && (
          <Alert
            className="fr-mb-5v"
            severity="warning"
            title="Attention"
            description={`Vous vous apprêtez à modifier les préférences de notifications de l'ensemble de vos ${totalCount} établissements`}
          />
        )}
        <div className={styles.buttons}>
          <Button
            title="Annuler"
            priority="secondary"
            onClick={() => {
              reset();
              close();
            }}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            title="Valider"
            type="submit"
            disabled={saveButtonIsDisabled || loading}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

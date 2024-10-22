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
import { hintTexts } from "./utils";

type AccountNotificationsUpdateAllModalProps = {
  // nombre total d'établissements
  totalCount: number;
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
};

export default function AccountNotificationsUpdateAllModal({
  totalCount,
  close
}: AccountNotificationsUpdateAllModalProps) {
  const [
    subscribeToNotifications,
    { loading, data, error, reset: resetMutation }
  ] = useMutation<
    Pick<Mutation, "subscribeToNotifications">,
    MutationSubscribeToNotificationsArgs
  >(SUBSCRIBE_TO_NOTIFICATIONS);

  const { register, handleSubmit, reset } = useForm<FormValues>({
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
      notification: "membershipRequest"
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
      notification: "revisionRequest"
    }
  ];

  let radioButtonState: "default" | "error" | "success" = "default";

  if (error) {
    radioButtonState = "error";
  } else if (data) {
    radioButtonState = "success";
  }

  return (
    <>
      <div className="fr-my-2w">
        Le formulaire suivant permet de s'abonner ou se désabonner aux
        notifications de différents types pour l'ensemble de vos {totalCount}{" "}
        établissements, à l'exception de ceux pour lesquelles votre rôle ne le
        permet pas
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          {radioInputs.map(({ notification, legend }) => (
            <RadioButtons
              legend={legend}
              hintText={hintTexts[notification]}
              name={notification}
              state={radioButtonState}
              stateRelatedMessage={error?.message}
              options={[
                {
                  label: "Ne rien faire",
                  nativeInputProps: {
                    value: SubscribeActions.DoNothing,
                    ...register(notification)
                  }
                },
                {
                  label: "S'abonner",
                  nativeInputProps: {
                    value: SubscribeActions.Subscribe,
                    ...register(notification)
                  }
                },
                {
                  label: "Se désabonner",
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
          <Button title="Valider" type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </>
  );
}

import { useMutation } from "@apollo/client";
import { Mutation, MutationSubscribeToNotificationsArgs } from "@td/codegen-ui";
import React from "react";
import { SUBSCRIBE_TO_NOTIFICATIONS } from "./queries";
import { useForm } from "react-hook-form";
import Button from "@codegouvfr/react-dsfr/Button";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import styles from "./NotificationsUpdateAllModal.module.scss";

type AccountNotificationsUpdateAllModalProps = {
  // nombre total d'établissements
  totalCount: number;
  close: () => void;
};

enum SubscribeAction {
  DoNothing = "DoNothing",
  Subscribe = "Subscribe",
  Unsuscribe = "Unsubscribe"
}

type FormValues = {
  membershipRequest: SubscribeAction;
};

export default function AccountNotificationsUpdateAllModal({
  totalCount,
  close
}: AccountNotificationsUpdateAllModalProps) {
  const [subscribeToNotifications, { loading, data, error }] = useMutation<
    Pick<Mutation, "subscribeToNotifications">,
    MutationSubscribeToNotificationsArgs
  >(SUBSCRIBE_TO_NOTIFICATIONS);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { membershipRequest: SubscribeAction.DoNothing }
  });

  const onSubmit = async (data: FormValues) => {
    console.log(data);
  };

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
          <RadioButtons
            legend="Demandes de rattachement"
            hintText="Texte de description additionnel"
            name="membership-request"
            options={[
              {
                label: "Ne rien faire",
                nativeInputProps: {
                  value: SubscribeAction.DoNothing,
                  ...register("membershipRequest")
                }
              },
              {
                label: "S'abonner",
                nativeInputProps: {
                  value: SubscribeAction.Subscribe,
                  ...register("membershipRequest")
                }
              },
              {
                label: "Se désabonner",
                nativeInputProps: {
                  value: SubscribeAction.Unsuscribe,
                  ...register("membershipRequest")
                }
              }
            ]}
            orientation="horizontal"
          />
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

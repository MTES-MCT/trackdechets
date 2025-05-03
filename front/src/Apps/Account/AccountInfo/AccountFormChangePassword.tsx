import { gql, useMutation } from "@apollo/client";
import PasswordInput from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mutation, MutationChangePasswordArgs } from "@td/codegen-ui";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { DsfrNotificationError } from "../../common/Components/Error/Error";
import { validationAccountPasswordSchema } from "../accountSchema";
import AccountInfoActionBar from "./AccountInfoActionBar";
import { getPasswordHint } from "../../../common/components/PasswordHelper";

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      id
    }
  }
`;

export default function AccountFormChangePassword() {
  const [changePassword, { loading, error }] = useMutation<
    Pick<Mutation, "changePassword">,
    MutationChangePasswordArgs
  >(CHANGE_PASSWORD);

  const defaultValues = {
    oldPassword: "",
    newPassword: ""
  };

  type ValidationSchema = z.infer<typeof validationAccountPasswordSchema>;

  const { handleSubmit, reset, register, formState, watch } =
    useForm<ValidationSchema>({
      defaultValues,
      resolver: zodResolver(validationAccountPasswordSchema)
    });

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    await changePassword({ variables: { ...data } });
    setIsEditing(false);
  };

  const [isEditing, setIsEditing] = useState<boolean>(false);

  const onReset = () => {
    setIsEditing(false);
    reset();
  };

  const onEditPassword = () => {
    setIsEditing(true);
  };

  const passwordNewValue = watch("newPassword");

  return (
    <>
      {!isEditing && (
        <>
          <AccountInfoActionBar
            title="Mot de passe"
            onEditInfo={onEditPassword}
            onReset={onReset}
            isEditing={isEditing}
          />
          <div
            style={{ margin: 0 }}
            className="fr-grid-row fr-grid-row--gutters"
          >
            <div className="fr-col-8">
              <p className="fr-text--bold">Mot de passe</p>
              <p className="fr-text fr-mb-2w" data-testid="password">
                **********
              </p>
            </div>
          </div>
        </>
      )}
      {isEditing && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <AccountInfoActionBar
            title="Mot de passe"
            onEditInfo={onEditPassword}
            onReset={onReset}
            isEditing={isEditing}
            isDisabled={formState.isSubmitting}
          />
          <div className="fr-col-md-8 fr-mb-2w">
            <PasswordInput
              label="Ancien mot de passe"
              nativeInputProps={{
                ...register("oldPassword"),
                ...{ "data-testid": "oldPassword" }
              }}
              messagesHint=""
              messages={
                formState.errors?.oldPassword?.message
                  ? [
                      {
                        message: formState.errors?.oldPassword?.message,
                        severity: "error"
                      }
                    ]
                  : []
              }
            />
          </div>
          <div className="fr-col-md-8 fr-mb-2w">
            <PasswordInput
              label="Nouveau mot de passe"
              nativeInputProps={{
                ...register("newPassword"),
                ...{ "data-testid": "newPassword" }
              }}
              hintText="Nous vous recommandons d'utiliser une phrase de passe (plusieurs mots accolés) ou un gestionnaire de mots de passe"
              messagesHint=""
              messages={
                !formState.isDirty
                  ? [
                      {
                        message: "contenir 10 caractères minimum",
                        severity: "info"
                      },
                      {
                        message: "avoir une complexité suffisante",
                        severity: "info"
                      }
                    ]
                  : [
                      {
                        message: getPasswordHint(passwordNewValue).message,
                        severity:
                          getPasswordHint(passwordNewValue).hintType ===
                          "success"
                            ? "valid"
                            : "error"
                      }
                    ]
              }
            />
          </div>

          <AccountInfoActionBar
            onEditInfo={onEditPassword}
            onReset={onReset}
            isEditing={isEditing}
            isDisabled={formState.isSubmitting}
          />
          {loading && <div>Envoi en cours...</div>}
          {error && (
            <div className="fr-mt-2w">
              <DsfrNotificationError apolloError={error} />
            </div>
          )}
        </form>
      )}
    </>
  );
}

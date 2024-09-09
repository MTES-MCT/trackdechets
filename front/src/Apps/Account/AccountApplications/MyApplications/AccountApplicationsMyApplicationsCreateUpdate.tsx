import * as React from "react";
import { Modal, RedErrorMessage } from "../../../../common/components";
import {
  Application,
  ApplicationGoal,
  CreateApplicationInput,
  Mutation,
  MutationCreateApplicationArgs,
  MutationUpdateApplicationArgs,
  UpdateApplicationInput
} from "@td/codegen-ui";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { useMutation } from "@apollo/client";
import {
  MY_APPLICATIONS,
  CREATE_APPLICATION,
  UPDATE_APPLICATION
} from "./queries";
import {
  NotificationError,
  SimpleNotificationError
} from "../../../common/Components/Error/Error";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";

export const validationApplicationSchema = z.object({
  name: z.string(),
  redirectUris: z.array(z.string()),
  logoUrl: z.string(),
  goal: z.enum(["PERSONNAL", "CLIENTS"])
});

type AccountApplicationsMyApplicationCreateUpdateProps = {
  application?: Application;
  onClose: () => void;
};

export default function AccountApplicationsMyApplicationCreateUpdate({
  application,
  onClose
}: AccountApplicationsMyApplicationCreateUpdateProps) {
  type ValidationSchema = z.infer<typeof validationApplicationSchema>;

  const [
    createApplication,
    { loading: createApplicationLoading, error: createApplicationError }
  ] = useMutation<
    Pick<Mutation, "createApplication">,
    MutationCreateApplicationArgs
  >(CREATE_APPLICATION, {
    refetchQueries: [MY_APPLICATIONS],
    update: cache => {
      // If there are no components currently observing the MY_APPLICATIONS query,
      // refetchQueries will not trigger a refetch.
      // We need to delete the cache to trigger a refetch the next time it's queried.
      // https://github.com/apollographql/apollo-client/issues/7878
      // https://github.com/apollographql/apollo-client/issues/7060
      cache.modify({
        fields: {
          myApplications(_, { DELETE }) {
            return DELETE;
          }
        }
      });
    }
  });

  const [
    updateApplication,
    { loading: updateApplicationLoading, error: updateApplicationError }
  ] = useMutation<
    Pick<Mutation, "updateApplication">,
    MutationUpdateApplicationArgs
  >(UPDATE_APPLICATION);

  const isCreating = !application;
  const isLoading = createApplicationLoading || updateApplicationLoading;
  const modalTitle = isCreating
    ? "Créer une application tierce"
    : "Modifier une application tierce";

  const { handleSubmit, formState, register, control } =
    useForm<ValidationSchema>({
      defaultValues: {
        name: application?.name || "",
        logoUrl: application?.logoUrl || "https://",
        redirectUris: application?.redirectUris || ["https://"],
        goal: application?.goal || ApplicationGoal.Personnal
      },
      resolver: zodResolver(validationApplicationSchema)
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "redirectUris"
  } as never);

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    if (application?.id) {
      await updateApplication({
        variables: {
          id: application.id,
          input: data as UpdateApplicationInput
        }
      });
    } else {
      await createApplication({
        variables: { input: data as CreateApplicationInput }
      });
    }

    onClose();
  };

  return (
    <Modal
      title={modalTitle}
      ariaLabel={modalTitle}
      onClose={onClose}
      isOpen
      size="L"
    >
      {isCreating && (
        <div className="fr-mb-2w">
          <CreateAlert></CreateAlert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="fr-container--fluid fr-pb-2w">
          <div className="fr-grid-row">
            <div className="fr-col-6">
              <Input
                label="Nom"
                state={formState.errors?.name && "error"}
                stateRelatedMessage={formState.errors?.name?.message}
                nativeInputProps={{
                  ...register("name")
                }}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-mt-2w">
            <div className="fr-col">
              <RadioButtons
                legend="Cette application gère les données de :"
                name="radio"
                state={formState.errors?.goal && "error"}
                stateRelatedMessage={formState.errors?.goal?.message}
                options={[
                  {
                    label: "Votre entreprise",
                    nativeInputProps: {
                      value: ApplicationGoal.Personnal,
                      ...register("goal")
                    }
                  },
                  {
                    label: "Vos clients",
                    nativeInputProps: {
                      value: ApplicationGoal.Clients,
                      ...register("goal")
                    }
                  }
                ]}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-9">
              <Input
                label="URL du logo"
                state={formState.errors?.logoUrl && "error"}
                stateRelatedMessage={formState.errors?.logoUrl?.message}
                nativeInputProps={{
                  ...register("logoUrl")
                }}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-mt-2w fr-grid-row--bottom fr-grid-row--gutters">
            {fields.map((field, index) => {
              return (
                <React.Fragment key={field.id}>
                  <div className="fr-col-9">
                    <Input
                      label={index === 0 ? "URL(s) de redirection" : ""}
                      nativeInputProps={{
                        ...register(`redirectUris.${index}`)
                      }}
                    />
                  </div>
                  {index === fields.length - 1 && (
                    <div className="fr-col-1">
                      <button
                        className="fr-btn fr-icon-add-line fr-btn--secondary"
                        title="Ajouter une URL de redirection"
                        onClick={_ => append("https://")}
                      >
                        Ajouter une URL de redirection
                      </button>
                    </div>
                  )}
                  {index !== 0 && (
                    <div className="fr-col-1">
                      <button
                        className="fr-btn fr-icon-delete-line fr-btn--secondary"
                        title="Supprimer une URL de redirection"
                        onClick={_ => remove(index)}
                      >
                        Supprimer une URL de redirection
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {formState.errors.redirectUris &&
            !Array.isArray(formState.errors.redirectUris) && (
              <RedErrorMessage name="redirectUris" />
            )}
        </div>
        <hr className="fr-mt-2w" />
        <div className="td-modal-actions fr-mt-0">
          <button
            className="fr-btn fr-btn--secondary"
            onClick={() => onClose()}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="fr-btn"
            disabled={createApplicationLoading || updateApplicationLoading}
          >
            {isLoading ? "Envoi..." : isCreating ? "Créer" : "Modifier"}
          </button>
        </div>
        {createApplicationError && createApplicationError?.networkError && (
          <SimpleNotificationError message="Pour des raisons de sécurité la création d'applications est limitée, merci de rééssayer dans une minute." />
        )}
        {createApplicationError && !createApplicationError?.networkError && (
          <NotificationError apolloError={createApplicationError} />
        )}
        {updateApplicationError && (
          <NotificationError apolloError={updateApplicationError} />
        )}
      </form>
    </Modal>
  );
}

function CreateAlert() {
  return (
    <div className="fr-alert fr-alert--info">
      <p>
        En créant une application tierce vous pouvez proposer aux utilisateurs
        de Trackdéchets d'utiliser votre application afin d'enrichir leur
        utilisation de Trackdéchets. Afin que les utilisateurs puissent
        autoriser votre application à utiliser leurs données Trackdéchets, nous
        utilisons le protocole OAuth2. Plus d'informations sur{" "}
        <a
          className="fr-link"
          href="https://developers.trackdechets.beta.gouv.fr/guides/oauth2"
        >
          https://developers.trackdechets.beta.gouv.fr/guides/oauth2
        </a>
      </p>
      <br />
      <p>
        Si vous développez une application pour le compte de clients, vous êtes
        soumis à la section 5.2.2 des{" "}
        <a
          className="fr-link"
          target="_blank"
          rel="noopener noreferrer"
          href="https://trackdechets.beta.gouv.fr/cgu/"
        >
          conditions générales d'utilisation
        </a>
        .
      </p>
    </div>
  );
}

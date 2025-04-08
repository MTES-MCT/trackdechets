import React, { useState } from "react";
import { Modal } from "../../../../common/components";
import { useMutation } from "@apollo/client";
import { CREATE_ACCESS_TOKEN, ACCESS_TOKENS } from "./queries";
import copyTextToClipboard from "copy-text-to-clipboard";
import { DEVELOPERS_DOCUMENTATION_URL } from "../../../../common/config";
import {
  NotificationError,
  SimpleNotificationError
} from "../../../common/Components/Error/Error";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@codegouvfr/react-dsfr/Input";

const validationSchema = z.object({
  description: z.string({
    required_error: "La description est requise"
  })
});

type AccountApplicationsAccessTokenCreateProps = {
  onClose: () => void;
};

export default function AccountApplicationsAccessTokenCreate({
  onClose
}: AccountApplicationsAccessTokenCreateProps) {
  const [accessToken, setAccessToken] = useState("");

  const [createAccessToken, { loading, error }] = useMutation(
    CREATE_ACCESS_TOKEN,
    {
      refetchQueries: [ACCESS_TOKENS],
      onCompleted: data => {
        setAccessToken(data.createAccessToken.token);
      }
    }
  );

  const onSubmit: SubmitHandler<
    z.infer<typeof validationSchema>
  > = async data => {
    const { description } = data;
    createAccessToken({ variables: { input: { description } } });
  };

  const { handleSubmit, formState, register } = useForm<
    z.infer<typeof validationSchema>
  >({ resolver: zodResolver(validationSchema) });

  return (
    <Modal
      ariaLabel="Créer un jeton d'accès à l'API"
      title="Créer un jeton d'accès à l'API"
      onClose={() => onClose()}
      size="L"
      isOpen
    >
      {accessToken.length > 0 ? (
        <>
          <div className="fr-alert fr-alert--success">
            <h3 className="fr-alert__title">Copiez le jeton d'accès</h3>
            <p>
              <b>Vous ne serez plus en mesure de le consulter ultérieurement</b>
            </p>
            <p>
              Ce jeton est confidentiel, ne le diffusez pas et consultez nos{" "}
              <a
                className="fr-link force-external-link-content force-underline-link"
                href={`${DEVELOPERS_DOCUMENTATION_URL}/tutoriels/quickstart/access-token`}
                target="_blank"
                rel="noreferrer"
              >
                recommandations de sécurité{" "}
              </a>{" "}
              dans la documentation.
            </p>
          </div>
          <div
            className="fr-mt-2w"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <p>
              Jeton d'accès : <b>{accessToken}</b>
            </p>
            <button
              className="fr-btn fr-btn--icon-right fr-icon-draft-line"
              onClick={() => {
                copyTextToClipboard(accessToken);
              }}
            >
              Copier
            </button>
          </div>
          <div className="td-modal-actions">
            <button className="fr-btn" onClick={() => onClose()}>
              Fermer
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              label="Description"
              className="fr-col-12 fr-mb-5v"
              state={formState.errors.description ? "error" : "default"}
              nativeInputProps={{
                ...register("description", { required: true })
              }}
              stateRelatedMessage={
                (formState?.errors?.description?.message as string) ?? ""
              }
            />
          </div>

          <div className="td-modal-actions">
            <button className="fr-btn" onClick={() => onClose()}>
              Annuler
            </button>
            <button
              className="fr-btn fr-btn--secondary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Création..." : "Générer un jeton d'accès"}
            </button>
          </div>
        </form>
      )}
      {error && error?.networkError && (
        <SimpleNotificationError message="Pour des raisons de sécurité la création de jetons est limitée, merci de rééssayer dans une minute." />
      )}
      {error && !error?.networkError && (
        <NotificationError apolloError={error} />
      )}
    </Modal>
  );
}

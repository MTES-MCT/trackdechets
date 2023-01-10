import React from "react";
import { IconCheckCircle1 } from "common/components/Icons";
import Loader from "../common/components/Loaders";
import styles from "./Dialog.module.scss";
import { useOIDC, AuthorizePayload } from "./use-oidc";

export default function OidcDialog() {
  const { VITE_API_ENDPOINT } = import.meta.env;
  const { loading, error, authorizePayload } = useOIDC();

  const authorizeDecisionUrl = `${VITE_API_ENDPOINT}/oidc/authorize/decision`;
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div>{error}</div>;
  }
  const { transactionID, redirectURI, client, user } =
    authorizePayload as AuthorizePayload;

  return (
    <div className={styles["dialog-container"]}>
      <div className={styles.flex}>
        <img
          src={client.logoUrl || "/logo-placeholder.png"}
          alt="application logo"
          width="100px"
        />
        <IconCheckCircle1 size="40px" />
        <img src="/trackdechets.png" alt="trackdechets" width="100px" />
      </div>
      <h4 className="text-center">S'identifier sur {client.name}</h4>
      <div className="panel tw-mt-2">
        <p className="text-center">
          {user.name}, l'application {client.name} souhaite accéder à votre
          compte Trackdéchets pour vous authentifier.
        </p>
        <p className="text-center notification success tw-mt-2">
          L'application pourra avoir accès en lecture à votre nom, email et aux
          entreprises dont vous êtes membre.
        </p>
        <div className={styles.hr} />
        <form className="tw-mt-5" action={authorizeDecisionUrl} method="post">
          <input
            name="transaction_id"
            type="hidden"
            value={transactionID as string}
          ></input>
          <div className={styles.flex}>
            <input
              className="btn btn--primary"
              type="submit"
              value="Autoriser"
              id="allow"
            ></input>
            <input
              className="btn btn--outline-primary"
              type="submit"
              value="Refuser"
              name="cancel"
              id="deny"
            ></input>
          </div>
          <div className={`text-center text-grey-dark ${styles.redirect}`}>
            L'autorisation vous redirigera vers {redirectURI}
          </div>
        </form>
      </div>
    </div>
  );
}

import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import "whatwg-fetch";
import Loader from "../common/Loader";
import styles from "./Dialog.module.scss";
import { useOAuth2, AuthorizePayload } from "../use-oauth2";

export default function Dialog() {
  const { REACT_APP_API_ENDPOINT } = process.env;

  const { loading, error, authorizePayload } = useOAuth2();

  const authorizeDecisionUrl = `${REACT_APP_API_ENDPOINT}/oauth2/authorize/decision`;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const {
    transactionID,
    redirectURI,
    client,
    user
  } = authorizePayload as AuthorizePayload;

  return (
    <div className={styles["dialog-container"]}>
      <div className={styles.flex}>
        <img
          src={client.logoUrl || "/logo-placeholder.png"}
          alt="application logo"
          width="100px"
        />
        <FaCheckCircle color="var(--green)" size="40px" />
        <img src="/trackdechets.png" alt="trackdechets" width="100px" />
      </div>
      <h4 className="text-center">Autoriser {client.name}</h4>
      <div className="panel">
        <p className="text-center">{user.name}</p>
        <p className="text-center">
          {client.name} souhaite accéder à votre compte Trackdéchets
        </p>
        <div className={styles.hr} />
        <form action={authorizeDecisionUrl} method="post">
          <input
            name="transaction_id"
            type="hidden"
            value={transactionID as string}
          ></input>
          <div className={styles.flex}>
            <input
              className="button"
              type="submit"
              value="Autoriser"
              id="allow"
            ></input>
            <input
              className="button warning"
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

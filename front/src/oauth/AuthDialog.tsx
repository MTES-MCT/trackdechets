import React from "react";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { useOAuth2, AuthorizePayload } from "./use-oauth2";
import { useOIDC } from "./use-oidc";
import { localAuthService } from "../login/auth.service";
import { useLocation } from "react-router-dom";
import * as queryString from "query-string";
import Header from "@codegouvfr/react-dsfr/Header";
import Button from "@codegouvfr/react-dsfr/Button";

export function Oauth2Dialog() {
  const { VITE_API_ENDPOINT } = import.meta.env;
  const { loading, error, authorizePayload } = useOAuth2();

  return (
    <AuthDialog
      authorizeDecisionUrl={`${VITE_API_ENDPOINT}/oauth2/authorize/decision`}
      authorizePayload={authorizePayload}
      loading={loading}
      error={error}
    ></AuthDialog>
  );
}

export function OidcDialog() {
  const { VITE_API_ENDPOINT } = import.meta.env;
  const { loading, error, authorizePayload } = useOIDC();

  const location = useLocation();
  const { nonce } = queryString.parse(location.search);

  return (
    <AuthDialog
      authorizeDecisionUrl={`${VITE_API_ENDPOINT}/oidc/authorize/decision`}
      authorizePayload={authorizePayload}
      loading={loading}
      error={error}
      nonce={nonce}
    ></AuthDialog>
  );
}

type AuthDialogProps = {
  authorizeDecisionUrl: string;
  authorizePayload: AuthorizePayload | null;
  loading: boolean;
  error: string | null;
  nonce?: string | string[] | null;
};

function AuthDialog({
  authorizeDecisionUrl,
  authorizePayload,
  loading,
  error,
  nonce
}: AuthDialogProps) {
  const { VITE_API_ENDPOINT } = import.meta.env;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const { transactionID, redirectURI, client, user } =
    authorizePayload as AuthorizePayload;

  return (
    <>
      <Header
        brandTop={
          <>
            Ministère
            <br />
            de la transition
            <br />
            écologique
          </>
        }
        homeLinkProps={{
          href: "/",
          title: "Accueil - Trackdéchets"
        }}
        id="fr-header-with-horizontal-operator-logo"
        operatorLogo={{
          alt: "Trackdéchets",
          imgUrl: "../../trackdechets-small.png",
          orientation: "horizontal"
        }}
        quickAccessItems={[
          <form
            name="logout"
            action={`${VITE_API_ENDPOINT}/logout`}
            method="post"
          >
            <Button
              iconId="fr-icon-account-circle-line"
              onClick={() => {
                localAuthService.locallySignOut();
                document.forms["logout"].submit();
                return false;
              }}
              priority="secondary"
              title="Se déconnecter"
            >
              Se déconnecter
            </Button>
          </form>
        ]}
        serviceTagline="Gérer la traçabilité des déchets en toute sécurité"
        serviceTitle="Trackdéchets"
      />

      <div
        className="fr-container fr-mt-8w fr-p-4w"
        style={{
          background:
            "var(--light-decisions-background-background-lifted-grey, #FFF)",
          boxShadow: "0px 6px 18px 0px rgba(0, 0, 18, 0.16)"
        }}
      >
        <div className="fr-grid-row">
          <div className="fr-col">
            <h1 className="fr-h4">
              Autoriser l'application {client.name} à accéder à votre compte
              Trackdéchets ?
            </h1>
          </div>
        </div>
        <div className="fr-grid-row">
          <div className="fr-col">
            <p className="fr-mb-2w">
              {user.name}, l'application {client.name} souhaite accéder à votre
              compte Trackdéchets.
            </p>
            <p className="fr-mb-2w">L'application pourra :</p>
            <ul
              className="fr-mb-2w"
              style={{ listStyle: "disc", padding: "0 24px" }}
            >
              <li>
                <b>
                  Accéder à tous les établissements dont vous faites partie.
                </b>
              </li>
              <li>
                <b>Créer et signer des bordereaux de suivi de déchets.</b>
              </li>
            </ul>
            <p>{`Vous pourrez révoquer cet accès depuis Mon compte > Application et API dans l'onglet Applications autorisées.`}</p>
            <p>Vous serez redirigé vers : {redirectURI}</p>
          </div>
        </div>
        <div className="fr-grid-row fr-mt-2w">
          <div className="fr-col">
            <form action={authorizeDecisionUrl} method="post">
              <input
                name="transaction_id"
                type="hidden"
                value={transactionID as string}
              ></input>
              {!!nonce && (
                <input name="nonce" type="hidden" value={nonce}></input>
              )}
              <ul className="fr-btns-group fr-btns-group--inline-md fr-btns-group--right ">
                <li>
                  <input
                    className="fr-btn fr-btn--secondary"
                    type="submit"
                    value="Refuser"
                    name="cancel"
                    id="deny"
                  ></input>
                </li>
                <li>
                  <input
                    className="fr-btn"
                    type="submit"
                    value="Autoriser"
                    id="allow"
                  ></input>
                </li>
              </ul>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

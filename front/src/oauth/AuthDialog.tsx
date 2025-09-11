import React from "react";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { useOAuth2, AuthorizePayload } from "./use-oauth2";

import { localAuthService } from "../login/auth.service";

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
      <header
        role="banner"
        id="fr-header-with-horizontal-operator-logo"
        className="fr-header"
      >
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      Ministère
                      <br />
                      de la transition
                      <br />
                      écologique,
                      <br />
                      de la biodiversité,
                      <br />
                      de la forêt, de la mer
                      <br />
                      et de la pêche
                    </p>
                  </div>
                  <div className="fr-header__operator">
                    <img
                      className="fr-responsive-img"
                      style={{ width: "70px", height: "70px" }}
                      src="/trackdechets.png"
                      alt="Trackdéchets"
                      data-fr-js-ratio="true"
                    />
                  </div>
                  <div className="fr-header__navbar">
                    <button
                      className="fr-btn--menu fr-btn"
                      data-fr-opened="false"
                      aria-controls="header-menu-modal-fr-header-with-horizontal-operator-logo"
                      aria-haspopup="menu"
                      id="fr-header-with-horizontal-operator-logo-menu-button"
                      title="Menu"
                      data-fr-js-modal-button="true"
                    >
                      Menu
                    </button>
                  </div>
                </div>
                <div className="fr-header__service">
                  <a href="/" title="Accueil - Trackdéchets">
                    <p className="fr-header__service-title">Trackdéchets</p>
                  </a>
                  <p className="fr-header__service-tagline">
                    Gérer la traçabilité des déchets en toute sécurité
                  </p>
                </div>
              </div>
              <div className="fr-header__tools">
                <div
                  className="fr-header__tools-links"
                  data-fr-js-header-links="true"
                >
                  <ul className="fr-btns-group">
                    <li>
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
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="fr-header__menu fr-modal"
          id="header-menu-modal-fr-header-with-horizontal-operator-logo"
          aria-labelledby="fr-header-with-horizontal-operator-logo-menu-button"
          data-fr-js-modal="true"
          data-fr-js-header-modal="true"
        >
          <div className="fr-container">
            <button
              id="fr-header-with-horizontal-operator-logo-mobile-overlay-button-close"
              className="fr-btn--close fr-btn"
              aria-controls="header-menu-modal-fr-header-with-horizontal-operator-logo"
              title="Fermer"
              data-fr-js-modal-button="true"
            >
              Fermer
            </button>
            <div className="fr-header__menu-links">
              <ul className="fr-btns-group">
                <li>
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
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

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
                  Accéder en lecture à votre nom, courriel et aux établissements
                  dont vous êtes membres.
                </b>
              </li>
              <li>
                <b>Créer et signer des bordereaux de suivi de déchets.</b>
              </li>
            </ul>
            <p>{`Vous pourrez révoquer cet accès depuis Mon compte > Applications et API.`}</p>
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

import React, { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import TotpSetupWizard from "./TotpSetupWizard";
import { useApolloClient } from "@apollo/client";
import { GET_ME } from "../Account";

const LockClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ marginLeft: "0.5rem", flexShrink: 0 }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19 10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9C5 6.49914 6.33419 4.18825 8.5 2.93782C10.6658 1.68739 13.3342 1.68739 15.5 2.93782C17.6658 4.18825 19 6.49914 19 9V10ZM5 12V20H19V12H5ZM11 14H13V18H11V14ZM17 10V9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9V10H17Z"
      fill="#F5F5FE"
    />
  </svg>
);

const LockOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ marginLeft: "0.5rem", flexShrink: 0 }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.262 5.86904L16.473 6.76304C15.4364 4.68779 13.1085 3.59808 10.8509 4.13121C8.59323 4.66435 6.99876 6.68029 7 9.00004V10H20C20.5523 10 21 10.4478 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4478 3.44772 10 4 10H5V9.00004C4.99883 5.7527 7.23115 2.93094 10.3916 2.1848C13.5521 1.43865 16.8107 2.96406 18.262 5.86904ZM19 12H5V20H19V12ZM14 15V17H10V15H14Z"
      fill="#000091"
    />
  </svg>
);

type Props = {
  totpEnabled: boolean;
};

export default function AccountAuthentication({ totpEnabled }: Props) {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const client = useApolloClient();

  const handleSetupSuccess = () => {
    setShowSetupWizard(false);
    client.refetchQueries({ include: [GET_ME] });
  };

  return (
    <div>
      {totpEnabled ? (
        <>
          <p className="fr-text--bold fr-mb-3w">
            L'authentification TOTP est activée sur votre compte
          </p>

          <Button priority="secondary">
            Désactiver l'authentification TOTP
            <LockOpenIcon />
          </Button>
        </>
      ) : (
        <>
          <p className="fr-text--bold fr-mb-3w">
            L'authentification TOTP n'est pas activée sur votre compte
          </p>

          <Button onClick={() => setShowSetupWizard(true)} className="fr-mb-3w">
            Activer l'authentification TOTP
            <LockClosedIcon />
          </Button>
          <p className="fr-mb-3w">
            Sécurisez votre compte avec la double authentification !
          </p>
          <p className="fr-mb-3w">
            Protégez votre compte est primordial, et la sécurité apportée par un
            simple mot de passe n'est pas toujours suffisante.
          </p>
          <p className="fr-mb-3w">
            En activant la double authentification, vous augmentez votre niveau
            de sécurité : votre mot de passe seul ne suffira plus à compromettre
            votre compte, il faudra en plus être en possession de votre
            téléphone ou de votre clé de sécurité.
          </p>
          <a
            href="https://faq.trackdechets.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="fr-link"
          >
            En savoir plus
          </a>
        </>
      )}

      {showSetupWizard && (
        <TotpSetupWizard
          onSuccess={handleSetupSuccess}
          onClose={() => setShowSetupWizard(false)}
        />
      )}
    </div>
  );
}

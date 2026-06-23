import React, { useEffect, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useLocation, useNavigate } from "react-router-dom";
import * as queryString from "query-string";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import Loader from "../Apps/common/Components/Loader/Loaders";
import routes from "../Apps/routes";
import { useAuth } from "../common/contexts/AuthContext";

const EXCHANGE_MFA_RECONFIG_TOKEN = gql`
  mutation ExchangeMfaReconfigToken($token: String!, $password: String!) {
    exchangeMfaReconfigToken(token: $token, password: $password) {
      id
      mustReconfigureMfa
    }
  }
`;

const SUPPORT_LINK = "https://faq.trackdechets.fr/contact";

/**
 * Page /mfa-reconfiguration?token=...
 *
 * Vérifie le token sécurisé reçu par e-mail et le mot de passe du compte.
 * En cas de succès, établit la session sans second facteur et redirige vers l'app :
 * RequireAuth affichera alors ForcedMfaReconfigurationModal (mustReconfigureMfa=true).
 */
export default function MfaReconfiguration() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const { token } = queryString.parse(location.search) as { token?: string };

  const [exchangeToken] = useMutation(EXCHANGE_MFA_RECONFIG_TOKEN);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        "Lien de reconfiguration invalide. Vérifiez le lien reçu par e-mail."
      );
    }
    setLoading(false);
  }, [token]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    exchangeToken({ variables: { token, password } })
      .then(async () => {
        // Rafraîchit le contexte auth pour que RequireAuth lise mustReconfigureMfa=true.
        await refreshUser();
        navigate(routes.dashboard.default, { replace: true });
      })
      .catch(err => {
        const message: string =
          err?.graphQLErrors?.[0]?.message ?? err?.message ?? "";
        setError(
          message ||
            "Une erreur est survenue. Veuillez réessayer ou contacter le support."
        );
        setSubmitting(false);
      });
  };

  if (loading) {
    return <Loader />;
  }

  const isPasswordError = error?.toLowerCase().includes("mot de passe");

  return (
    <section className="section section-white">
      <div className="container-narrow">
        <h1 className="fr-h3 fr-mb-4w">
          Reconfiguration de votre double authentification
        </h1>

        {token && (
          <>
            <p className="fr-text fr-mb-4w">
              Saisissez votre mot de passe pour accéder au parcours de
              reconfiguration de votre double authentification.
            </p>

            <form onSubmit={handleSubmit}>
              <PasswordInput
                nativeInputProps={{
                  name: "password",
                  value: password,
                  required: true,
                  autoComplete: "current-password",
                  onChange: e => setPassword(e.target.value)
                }}
                label="Mot de passe"
              />

              <Button
                priority="primary"
                nativeButtonProps={{ type: "submit", disabled: submitting }}
              >
                Continuer
              </Button>
            </form>
          </>
        )}

        {error && (
          <>
            <Alert
              title={
                isPasswordError
                  ? "Mot de passe incorrect"
                  : "Lien invalide ou expiré"
              }
              description={error}
              severity="error"
              className="fr-mb-4w"
            />

            {!isPasswordError && (
              <>
                <p className="fr-text fr-mb-4w">
                  Si votre lien est expiré, perdu ou déjà utilisé, vous devez
                  contacter notre support pour obtenir un nouveau lien de
                  reconfiguration.
                </p>

                <Button
                  priority="primary"
                  linkProps={{
                    href: SUPPORT_LINK,
                    target: "_blank",
                    rel: "noopener noreferrer"
                  }}
                >
                  Contacter l'Assistance Trackdéchets
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

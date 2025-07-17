import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_TRACKING_CONSENT } from "../../queries/user/userQueries";
import { DsfrNotificationError } from "../Error/Error";
import { useAuth } from "../../../../common/contexts/AuthContext";

export const ConsentBanner = () => {
  const { refreshUser, user } = useAuth();

  const trackingConsentUntil = user?.trackingConsentUntil;
  const [updateTrackingConsent, { loading, error }] = useMutation(
    UPDATE_TRACKING_CONSENT
  );
  const handleClick = async (trackingConsent: Boolean) => {
    setDisplay(false);
    await updateTrackingConsent({
      variables: { trackingConsent }
    });
    await refreshUser();
  };
  const initialDisplay = trackingConsentUntil
    ? new Date(trackingConsentUntil) < new Date()
    : true;
  const [display, setDisplay] = useState(initialDisplay);
  useEffect(() => {
    setDisplay(initialDisplay);
  }, [initialDisplay]);
  if (!user) return null;
  if (!display) return null;
  return (
    <div className="fr-consent-banner">
      <h2 className="fr-h6">Analyse et amélioration</h2>
      <div className="fr-consent-banner__content">
        <p className="fr-text--sm">
          Aidez Trackdéchets à améliorer son service en permettant le recueil
          automatique des données d’utilisation. Ces données sont, par exemple,
          le parcours entre le différents écrans et les champs sélectionnés et
          l’ordre de remplissage de ceux-ci. Vous pouvez modifier votre choix
          dans “Mon compte”.
        </p>
      </div>
      <ul className="fr-consent-banner__buttons fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-sm">
        <li>
          <button
            className="fr-btn"
            title="Autoriser tous les cookies"
            onClick={async () => handleClick(true)}
            disabled={loading}
          >
            Accepter
          </button>
        </li>
        <li>
          <button
            className="fr-btn"
            title="Refuser tous les cookies"
            onClick={async () => handleClick(false)}
            disabled={loading}
          >
            Refuser
          </button>
        </li>
      </ul>
      {loading && <div>Envoi en cours...</div>}

      {error && <DsfrNotificationError apolloError={error} />}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import {useCrisp} from "../../hooks/useCrisp";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";

/**
 * ========================
 * TYPES
 * ========================
 */
type Consent = {
  crisp: boolean;
  matomo: boolean;
};

const DEFAULT_CONSENT: Consent = {
  crisp: false,
  matomo: false
};

const STORAGE_KEY = "cookie-consent";

export default function AppFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [consent, setConsent] = useState<Consent>(DEFAULT_CONSENT);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<Consent>(DEFAULT_CONSENT);
  const openModal = () => {
    setDraft(consent);
    setIsOpen(true);
  };
  /**
   * ========================
   * LOAD CONSENT
   * ========================
   */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      setConsent(DEFAULT_CONSENT);
      setHydrated(true);
      return;
    }

    try {
      const parsed: Consent = JSON.parse(saved);
      setConsent(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setConsent(DEFAULT_CONSENT);
    }

    setHydrated(true);
  }, []);

  /**
   * ========================
   * SAVE CONSENT
   * ========================
   */
  const saveConsent = (newConsent: Consent) => {
      const crispChanged = newConsent.crisp !== consent.crisp;
    setConsent(newConsent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
    setIsOpen(false);
  if (crispChanged) {
      // 🔥 approche GéoRisques
  window.location.reload();
  }
  };

  /**
   * ========================
   * CRISP ACTIVATION
   * ========================
   */
  useCrisp(hydrated && consent.crisp);

  return (
    <>
      {/* ================= FOOTER ================= */}
      <footer className="fr-footer" role="contentinfo">
        <div className="fr-container">
          {/* ===== BODY ===== */}
          <div className="fr-footer__body">
            {/* BRAND */}
            <div className="fr-footer__brand">
              <p className="fr-logo">
                République
                <br />
                Française
              </p>

              <p className="fr-footer__logo">
                <img
                  alt="Logo du Bureau de Recherches Géologiques et Minières"
                  className="fr-ml-5w td-brgm"
                  src="/brgm.svg"
                  loading="lazy"
                />
              </p>
            </div>

            {/* CONTENT */}
            <div className="fr-footer__content">
              <p className="fr-footer__content-desc">
                Trackdéchets est un service numérique de l'Etat incubé à la
                Fabrique Numérique du Ministère de la Transition écologique,
                membre du réseau d’incubateurs beta.gouv.fr
              </p>

              <ul className="fr-footer__content-list">
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://assistance.trackdechets.beta.gouv.fr/"
                    rel="noopener external"
                    target="_blank"
                  >
                    Nous contacter
                    <img
                      src="/icons/system/external-link-line.svg"
                      alt=""
                      aria-hidden="true"
                      className="fr-ml-1v"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        verticalAlign: "text-bottom",
                        display: "inline-block"
                      }}
                    />
                  </a>
                </li>

                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="//trackdechets.beta.gouv.fr/partenaires/"
                  >
                    Nos partenaires
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* ===== BOTTOM ===== */}
          <div className="fr-footer__bottom">
            <ul className="fr-footer__bottom-list">
              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="//trackdechets.beta.gouv.fr/accessibilite/"
                >
                  Accessibilité : non conforme
                </a>
              </li>

              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="/homologation.pdf"
                  target="_blank"
                  rel="noopener"
                >
                  Homologation
                </a>
              </li>

              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="/Mentions-legales.pdf"
                  target="_blank"
                  rel="noopener"
                >
                  Mentions légales
                </a>
              </li>

              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="/Politique-de-confidentialite.pdf"
                  target="_blank"
                  rel="noopener"
                >
                  Politique de confidentialité
                </a>
              </li>

              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="//trackdechets.beta.gouv.fr/cgu/"
                >
                  Conditions générales d’utilisation
                </a>
              </li>

              {/* 🍪 COOKIE MANAGEMENT */}
              <li className="fr-footer__bottom-item">
                <button
                  type="button"
                  className="fr-footer__bottom-link"
                  onClick={openModal}
                >
                  Gestion des cookies
                </button>
              </li>

              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="https://status.trackdechets.beta.gouv.fr/"
                >
                  Disponibilité de l'API
                </a>
              </li>
            </ul>

            <div className="fr-footer__bottom-copy">
              <p>
                Sauf mention explicite de propriété intellectuelle détenue par
                des tiers, les contenus de ce site sont proposés sous{" "}
                <a
                  href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                  target="_blank"
                  rel="noopener"
                >
                  licence etalab-2.0
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
      {/* ================= MODALE COOKIES ================= */}
      <Modal
        ariaLabel="Gestion des cookies"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="XL"
        hasFooter
      >
        <div className="dsfr-Modal">
          {/* ================= HEADER ================= */}
          <div className="dsfr-Modal-header">
            <h1 className="dsfr-Modal-title">
              Les informations que nous collectons
            </h1>

            <p className="dsfr-Modal-description">
              Ici, vous pouvez voir et personnaliser les informations que nous
              collectons sur vous.{" "}
              <a
                href="/politique-de-confidentialite.pdf"
                target="_blank"
                rel="noopener"
              >
                Politique de confidentialité
              </a>
            </p>
          </div>

          {/* ================= BODY ================= */}
          <div className="dsfr-Modal-body">
            {/* ACTIONS GLOBAL */}
            <div className="dsfr-AppToggles fr-mb-2w">
              <button
                type="button"
                className="fr-btn fr-btn--secondary dsfr-AppToggles-button"
                onClick={() =>
                  setDraft({
                    crisp: true,
                    matomo: true
                  })
                }
              >
                Tout accepter
              </button>

              <button
                type="button"
                className="fr-btn fr-btn--secondary dsfr-AppToggles-button"
                onClick={() =>
                  setDraft({
                    crisp: false,
                    matomo: false
                  })
                }
              >
                Tout refuser
              </button>
            </div>

            {/* ================= LIST ================= */}
            <ul className="dsfr-AppList">
              {/* CRISP */}
              <li className="dsfr-AppList-item dsfr-AppList-item--crisp-chatbot">
                <div className="dsfr-AppItem">
                  <ToggleSwitch
                    label="Chatbox Crisp"
                    checked={draft.crisp}
                    onChange={() => setDraft({ ...draft, crisp: !draft.crisp })}
                  />

                  <div className="dsfr-AppItem-fullDescription">
                    <p>
                      Le Crisp chatbox, qui opère sur le site web Géorisques,
                      utilise des cookies. Ce dépôt est soumis à votre
                      consentement pour l’utilisation du service. Les cookies
                      sont uniquement utilisés conformément à ses éléments : Ces
                      cookies sont nécessaires aux fonctionnalités du chatbox et
                      ont une durée d’expiration de 6 mois. Ces cookies lient un
                      utilisateur à une seule session, détruite après 30 minutes
                      après leur dernier accès au site. Les cookies ne sont pas
                      utilisés à des fins de traçage. L'adresse IP de
                      l'utilisateur est stockée dans un serveur mémorisant les
                      données de la session de navigation lié au cookie. La
                      durée de conservation est à minima d’un an. Vous pouvez
                      consulter le détail des informations sur la page
                    </p>
                  </div>
                </div>
              </li>

              {/* MATOMO */}

              <li className="dsfr-AppList-item dsfr-AppList-item--crisp-chatbot">
                <div className="dsfr-AppItem">
                  <ToggleSwitch
                    label="Matomo"
                    checked={draft.matomo}
                    onChange={() =>
                      setDraft({ ...draft, matomo: !draft.matomo })
                    }
                  />

                  <div className="dsfr-AppItem-fullDescription">
                    <p>
                      Ces cookies nous permettent de réaliser des statistiques
                      sur les visites sur le site de manière totalement anonyme.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="dsfr-Modal-footer">
            <button
              type="button"
              className="fr-btn dsfr-Modal-saveButton"
              onClick={() => saveConsent(draft)}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

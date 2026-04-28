import React, { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import { useCrisp } from "../../hooks/useCrisp";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import styles from "./Footer.module.scss";
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

  const [bannerVisible, setBannerVisible] = useState(false);

  const allAccepted = draft.crisp && draft.matomo;
  const allRefused = !draft.crisp && !draft.matomo;

  const acceptAll = () => {
    saveConsent({ crisp: true, matomo: true });
    setBannerVisible(false);
  };

  const refuseAll = () => {
    saveConsent({ crisp: false, matomo: false });
    setBannerVisible(false);
  };

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
      setBannerVisible(true); // afficher banner
      return;
    }

    try {
      const parsed: Consent = JSON.parse(saved);
      setConsent(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setConsent(DEFAULT_CONSENT);
      setBannerVisible(true);
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
    setBannerVisible(false); // important
    if (crispChanged) {
      // reload
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
                Trackdéchets est un service numérique du Ministère en charge de
                l'environnement.
              </p>

              <ul className="fr-footer__content-list">
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://faq.trackdechets.fr/"
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

              {/* COOKIE MANAGEMENT */}
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
        <div className="fr-mb-3w">
          {/* ================= HEADER ================= */}
          <div className="fr-mb-2w">
            <h1 className="fr-h3 fr-mb-1w">
              Les informations que nous collectons
            </h1>

            <p className="fr-text--md fr-mb-0">
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

          {/* ACTIONS GLOBAL */}
          <div className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mb-4w">
            <button
              type="button"
              className="fr-btn"
              disabled={allAccepted}
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
              className="fr-btn fr-btn--secondary"
              disabled={allRefused}
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

          <hr className="fr-mb-3w" />
          {/* ================= LIST ================= */}

          {/* CRISP */}

          <section className="fr-mb-4w">
            <ToggleSwitch
              label="Chatbox Crisp"
              checked={draft.crisp}
              onChange={() => setDraft({ ...draft, crisp: !draft.crisp })}
              classes={{
                label: styles.label
              }}
            />

            <p className="fr-text--sm fr-mt-2w fr-ml-9w">
              Le Crisp chatbox, qui opère sur le site web Géorisques, utilise
              des cookies. Ce dépôt est soumis à votre consentement pour
              l’utilisation du service. Les cookies sont uniquement utilisés
              conformément à ses éléments : Ces cookies sont nécessaires aux
              fonctionnalités du chatbox et ont une durée d’expiration de 6
              mois. Ces cookies lient un utilisateur à une seule session,
              détruite après 30 minutes après leur dernier accès au site. Les
              cookies ne sont pas utilisés à des fins de traçage. L'adresse IP
              de l'utilisateur est stockée dans un serveur mémorisant les
              données de la session de navigation lié au cookie. La durée de
              conservation est à minima d’un an. Vous pouvez consulter le détail
              des informations sur la page
            </p>
          </section>

          <hr className="fr-mb-4w" />
          {/* MATOMO */}

          <section className="fr-mb-4w">
            <ToggleSwitch
              label="Matomo"
              checked={draft.matomo}
              onChange={() => setDraft({ ...draft, matomo: !draft.matomo })}
              classes={{
                label: styles.label
              }}
            />

            <p className="fr-text--sm fr-mt-2w fr-ml-9w">
              Ces cookies nous permettent de réaliser des statistiques sur les
              visites sur le site de manière totalement anonyme.
            </p>
          </section>

          <hr className="fr-mb-4w" />

          {/* ================= FOOTER ================= */}
          <div className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mb-4w">
            <button className="fr-btn" onClick={() => saveConsent(draft)}>
              Sauvegarder
            </button>
          </div>
        </div>
      </Modal>

      {bannerVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "2.5rem",
            left: "2.5rem",
            maxHeight: "calc(100% - 5rem)",
            maxWidth: "40rem",
            width: "calc(100% - 5rem)",
            padding: "2rem",
            background: "white",
            zIndex: 100,
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: "1px solid #E5E5E5",
            overflowY: "auto"
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "0.5rem"
            }}
          >
            Nous utilisons des cookies
          </h3>

          <p
            style={{
              fontSize: "0.875rem",
              marginBottom: "1rem",
              color: "var(--text-default-grey)"
            }}
          >
            En poursuivant votre navigation sur ce site, vous acceptez
            l’utilisation de cookies pour collecter des statistiques afin
            d’optimiser les services du site.
          </p>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "row-reverse",
              gap: "8px"
            }}
          >
            <button className="fr-btn" onClick={acceptAll}>
              Accepter
            </button>

            <button className="fr-btn" onClick={refuseAll}>
              Refuser
            </button>

            <button className="fr-btn fr-btn--tertiary" onClick={openModal}>
              En savoir plus
            </button>
          </div>
        </div>
      )}
    </>
  );
}

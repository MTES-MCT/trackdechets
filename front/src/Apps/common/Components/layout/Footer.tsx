import React from "react";

import { useCrisp } from "../../hooks/useCrisp";

export default function AppFooter() {
  useCrisp();

  return (
    <footer className="fr-footer" role="contentinfo">
      <div className="fr-container">
        <div className="fr-footer__body">
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
                href="//trackdechets.beta.gouv.fr/mentions-legales/"
              >
                Mentions légales
              </a>
            </li>

            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="//trackdechets.beta.gouv.fr/politiques-confidentialites/"
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
  );
}

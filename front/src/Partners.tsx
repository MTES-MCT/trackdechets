import React from "react";
import "./Partners.scss";

export default function Partners() {
  return (
    <>
      <section className="section section-grey">
        <div className="container">
          <h2 className="section__title">Le Partenariat avec Trackdéchets</h2>

          <p>
            Trackdéchets est un outil de la Fabrique Numérique du MTES soutenu
            par la direction générale de la prévention des risques (DGPR)
          </p>

          <p>
            Trackdéchets a vocation à permettre la dématérialisation complète de
            la chaine du BSD, y compris pour les transporteurs. Le produit est
            en constante évolution et pourra permettre techniquement cette
            dématérialisation plus rapidement que le pas de temps nécessaire à
            une évolution de la réglementation.
          </p>

          <p>
            Ce partenariat acte l’engagement fort d’entreprises dans la démarche
            d’amélioration, de test et de déploiement de Trackdéchets. A ce
            titre, les organisations partenaires référencées sur cette page,
            seront soutenues par la DGPR en cas de contrôle du transporteur et
            comprend toute la phase de tests et de montée en puissance de
            Trackdéchets, jusqu'à l'évolution juridique.
          </p>
        </div>
      </section>

      <section className="section section-white">
        <div className="container Partners__engagements_benefices">
          <div className="row">
            <div>
              <h3>Devenir partenaires : quels engagements ?</h3>
              <ul>
                <li>
                  La chaine des BSD que vous gérez est 100% dématérialisée
                </li>
                <li>
                  Votre outil de gestion des BSD (ERP, etc.) est connecté à
                  l'API de Trackdéchets
                </li>
                <li>
                  Vous invitez vos clients et partenaires à devenir utilisateurs
                  de Trackdéchets, en utilisant les supports et documents mis à
                  votre disposition
                </li>
                <li>
                  Vous vérifiez et validez les données de la "fiche entreprise"
                  qui sera proposée sur le produit (fin 2019)
                </li>
              </ul>

              <h3>Devenir partenaires : quels bénéfices ?</h3>
              <ul>
                <li>
                  Mise en visibilité lors des diverses communication
                  Trackdéchets (newsletter, présentations) et via le
                  référencement sur le site Trackdéchets via la page
                  "Partenaires"
                </li>
                <li>
                  Appui de la DGPR pendant la phase de transition (contrôle
                  routiers des BSD)
                </li>
                <li>
                  Participation à des ateliers exclusifs sur le produit à
                  travers notre comité produit restreint
                </li>
                <li>
                  Accès à des informations privilégiées sur l'avancement et les
                  évolutions autour du produit
                </li>
              </ul>
            </div>

            <div>
              <h3>Nos partenaires actuels</h3>
              <div className="Partners__logos">
                <figure>
                  <img src="/partners-logos/kerlog.svg" alt="Kerlog" />
                </figure>
                <figure>
                  <img src="/partners-logos/chimirec.png" alt="Chimirec" />
                </figure>
                <figure>
                  <img
                    className="sarpi-veolia"
                    src="/partners-logos/sarpi.png"
                    alt="Sarpi-Veolia"
                  />
                </figure>
                <figure>
                  <img
                    className="seche"
                    src="/partners-logos/seche.png"
                    alt="Séché Environnement"
                  />
                </figure>
                     <figure>
                  <img
                    className="trinov"
                    src="/partners-logos/trinov.png"
                    alt="Trinov"
                  />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-grey">
        <div className="container">
          <h2>
            Envie de devenir partenaire ?{" "}
            <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
              Contactez-nous !
            </a>
          </h2>
        </div>
      </section>
    </>
  );
}

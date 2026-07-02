import React from "react";

export default function MentionsLegales() {
  return (
    <main id="content" role="main" tabIndex={-1}>
      <div className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <h1 className="fr-h1 fr-mb-4w">Mentions légales de Trackdéchets</h1>

            <h2 className="fr-h2 fr-mt-4w fr-mb-2w">
              Éditeur de la Plateforme
            </h2>
            <p>La Plateforme TrackDéchets est éditée par :</p>
            <p>
              <strong>Ministère de la Transition écologique</strong>
              <br />
              Hôtel de Roquelaure
              <br />
              246 boulevard Saint-Germain
              <br />
              75007 Paris
            </p>

            <h2 className="fr-h2 fr-mt-4w fr-mb-2w">
              Directeur de la publication
            </h2>
            <p>
              Cédric Bourillet, Directeur Général à la Prévention des Risques
            </p>

            <h2 className="fr-h2 fr-mt-4w fr-mb-2w">
              Hébergement de la Plateforme
            </h2>
            <p>Ce site est hébergé par :</p>
            <p>
              <strong>
                Scalingo SAS 15 avenue du Rhin 67100 Strasbourg France SIRET
                80866548300018
              </strong>
            </p>

            <h2 className="fr-h2 fr-mt-4w fr-mb-2w">Accessibilité</h2>
            <p>
              La conformité aux normes d'accessibilité numérique est un objectif
              ultérieur mais nous tâchons de rendre ce site accessible à toutes
              et à tous.
            </p>

            <h3 className="fr-h3 fr-mt-3w fr-mb-2w">
              Signaler un dysfonctionnement
            </h3>
            <p>
              Si vous rencontrez un défaut d'accessibilité vous empêchant
              d'accéder à un contenu ou une fonctionnalité du site, merci de
              nous en faire part (par mail, le tchat ou par courrier). Si vous
              n'obtenez pas de réponse rapide de notre part, vous êtes en droit
              de faire parvenir vos doléances ou une demande de saisine au
              Défenseur des droits.
            </p>

            <h3 className="fr-h3 fr-mt-3w fr-mb-2w">En savoir plus</h3>
            <p>
              Pour en savoir plus sur la politique d'accessibilité numérique de
              l'État :{" "}
              <a
                href="http://references.modernisation.gouv.fr/accessibilite-numerique"
                target="_blank"
                rel="noopener noreferrer"
              >
                http://references.modernisation.gouv.fr/accessibilite-numerique
              </a>
            </p>

            <h2 className="fr-h2 fr-mt-4w fr-mb-2w">Sécurité</h2>
            <p>
              Le site est protégé par un certificat électronique, matérialisé
              pour la grande majorité des navigateurs par un cadenas. Cette
              protection participe à la confidentialité des échanges. En aucun
              cas les services associés à la plateforme ne seront à l'origine
              d'envoi de courriels pour demander la saisie d'informations
              personnelles.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

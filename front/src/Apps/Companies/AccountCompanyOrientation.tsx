import React from "react";
import { useNavigate } from "react-router-dom";
import routes from "../routes";

import { CallOut } from "@codegouvfr/react-dsfr/CallOut";

export default function AccountCompanyOrientation() {
  const navigate = useNavigate();

  return (
    <div className="fr-container-fluid">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <CallOut
            title="Vous produisez des déchets dans le cadre de votre activité."
            buttonProps={{
              title: "Créer votre établissement producteur",
              children: "Créer votre établissement producteur",
              onClick: () => {
                navigate(routes.companies.create.simple);
              }
            }}
          >
            Vous produisez des déchets dangereux dans le cadre de votre activité
            et vous les faites traiter par un professionnel des déchets.
            <br />
            Exemples : ateliers de réparation de véhicules, laboratoires,
            ateliers de traitement de surfaces, détenteurs d'équipements
            contenant des fluides frigorigènes et les opérateurs, producteurs de
            déchets infectieux (hôpitaux, EHPAD, médecins, infirmier(e)s,
            tatoueurs, dentistes, etc.) maître d'ouvrage d'amiante,
            intermédiaires, etc.
          </CallOut>
        </div>
        {/* <div className="fr-col-12">
          <CallOut
            title="Votre établissement est déjà sur Trackdéchets."
            buttonProps={{
              title: "Rejoindre votre établissement",
              children: "Rejoindre votre établissement",
              iconId: "ri-arrow-right-line",
              iconPosition: "right",
              onClick: () => {
                navigate(routes.companies.join);
              },
            }}
          >
            Votre entreprise existe déjà sur Trackdéchets. Vous demandez à
            l'administrateur de le rejoindre.
          </CallOut>
        </div> */}
        <div className="fr-col-12">
          <CallOut
            title="La gestion des déchets fait partie de votre activité."
            buttonProps={{
              title: "Créer un établissement",
              children: "Créer un établissement",
              onClick: () => {
                navigate(routes.companies.create.pro);
              }
            }}
          >
            Vous exploitez une entreprise de collecte et/ou tri et/ou transit
            et/ou regroupement et/ou traitement de déchets. Vous êtes négociant
            et/ou courtier de déchets et/ou eco-organisme. Exemples:
            Déchetterie, collecteur de déchets, casse automobile, entreprise de
            travaux amiante, transporteur, centre d'enfouissement, installation
            de traitement de déchets, incinérateur, crématorium.
          </CallOut>
        </div>
        <div className="fr-col-12">
          <CallOut
            title="Transporteur hors France, Non-French carrier"
            buttonProps={{
              title: "Créer un établissement transporteur hors France",
              children: "Créer un établissement transporteur hors France",
              onClick: () => {
                navigate(routes.companies.create.foreign);
              }
            }}
          >
            Votre entreprise n'est pas immatriculée en France, mais vous
            transportez des déchets dangereux sur le territoire français.
            <br />
            Your company is not registered in France, but you transport
            hazardous waste on the French territory.
          </CallOut>
        </div>
      </div>
    </div>
  );
}

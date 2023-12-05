import React from "react";
import { useNavigate } from "react-router-dom";
import routes from "../Apps/routes";

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
              title: "Créer votre établissement",
              children: "Créer votre établissement",
              iconId: "ri-arrow-right-line",
              iconPosition: "right",
              onClick: () => {
                navigate(routes.account.companies.create.simple);
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
                navigate(routes.account.companies.join);
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
              title: "Créer votre établissement",
              children: "Créer votre établissement",
              iconId: "ri-arrow-right-line",
              iconPosition: "right",
              onClick: () => {
                navigate(routes.account.companies.create.pro);
              }
            }}
          >
            Votre entreprise gère une grande quantité de déchets. Vous souhaitez
            créer un établissement avec les diverses options possibles : profils
            de l'entreprise, récépissés, agréments, GEREP, etc.
            <br />
            Exemples : transporteur, incinérateur, déchetterie, casse
            automobile, collecteur de déchets, etc.
          </CallOut>
        </div>
        <div className="fr-col-12">
          <CallOut
            title="Transporteur hors France, Non-French carrier"
            buttonProps={{
              title: "Créer votre établissement",
              children: "Créer votre établissement",
              iconId: "ri-arrow-right-line",
              iconPosition: "right",
              onClick: () => {
                navigate(routes.account.companies.create.foreign);
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

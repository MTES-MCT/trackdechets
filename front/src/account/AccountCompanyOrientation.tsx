import React from "react";
import { useHistory } from "react-router-dom";
import routes from "common/routes";

import {
  Container,
  Row,
  Col,
  Callout,
  CalloutTitle,
  CalloutText,
  Button,
} from "@dataesr/react-dsfr";

export default function AccountCompanyOrientation() {
  const history = useHistory();

  return (
    <Container fluid>
      <Row>
        <Col n="12">
          <Callout hasInfoIcon={false}>
            <CalloutTitle as="h2" size="lg">
              Vous produisez des déchets dans le cadre de votre activité.
            </CalloutTitle>
            <CalloutText size="sm">
              Vous produisez des déchets dangereux dans le cadre de votre
              activité et vous les faites traiter par un professionnel des
              déchets.
              <br />
              Exemples : ateliers de réparation de véhicules, laboratoires,
              ateliers de traitement de surfaces, détenteurs d'équipements
              contenant des fluides frigorigènes et les opérateurs, producteurs
              de déchets infectieux (hôpitaux, EHPAD, médecins, infirmier(e)s,
              tatoueurs, dentistes, etc.) maître d'ouvrage d'amiante,
              intermédiaires, etc.
            </CalloutText>
            <Button
              title="Créer votre établissement"
              icon="ri-arrow-right-line"
              iconPosition="right"
              onClick={() => {
                history.push({
                  pathname: routes.account.companies.create.simple,
                });
              }}
            >
              Créer votre établissement
            </Button>
          </Callout>
        </Col>
        {/* <Col n="12">
          <Callout hasInfoIcon={false}>
            <CalloutTitle as="h2" size="lg">
              Votre établissement est déjà sur Trackdéchets.
            </CalloutTitle>
            <CalloutText size="sm">
              Votre entreprise existe déjà sur Trackdéchets. Vous demandez à
              l'administrateur de le rejoindre.
            </CalloutText>
            <Button
              title="Rejoindre votre établissement"
              icon="ri-arrow-right-line"
              iconPosition="right"
              onClick={() => {
                history.push({
                  pathname: routes.account.companies.join,
                });
              }}
            >
              Rejoindre votre établissement
            </Button>
          </Callout>
        </Col> */}
        <Col n="12">
          <Callout hasInfoIcon={false}>
            <CalloutTitle as="h2" size="lg">
              La gestion des déchets fait partie de votre activité.
            </CalloutTitle>
            <CalloutText size="sm">
              Votre entreprise gère une grande quantité de déchets. Vous
              souhaitez créer un établissement avec les diverses options
              possibles : profils de l'entreprise, récépissés, agréments, GEREP,
              etc.
              <br />
              Exemples : transporteur, incinérateur, déchetterie, casse
              automobile, collecteur de déchets, etc.
            </CalloutText>
            <Button
              title="Créer votre établissement"
              icon="ri-arrow-right-line"
              iconPosition="right"
              onClick={() => {
                history.push({
                  pathname: routes.account.companies.create.pro,
                });
              }}
            >
              Créer votre établissement
            </Button>
          </Callout>
        </Col>
        {/* <Col n="12">
          <Callout hasInfoIcon={false}>
            <CalloutTitle as="h2" size="lg">
              Transporteur hors France, Non-French carrier
            </CalloutTitle>
            <CalloutText size="sm">
              Votre entreprise n'est pas immatriculée en France, mais vous
              transportez des déchets dangereux sur le territoire français.
              <br />
              Your company is not registered in France, but you transport
              hazardous waste on the french territory.
            </CalloutText>
            <Button
              title="Créer votre établissement"
              icon="ri-arrow-right-line"
              iconPosition="right"
              onClick={() => {
                history.push({
                  pathname: routes.account.companies.create.foreign,
                });
              }}
            >
              Créer votre établissement
            </Button>
          </Callout>
        </Col> */}
      </Row>
    </Container>
  );
}

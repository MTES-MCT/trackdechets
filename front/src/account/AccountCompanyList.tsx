import React from "react";
import { gql, useQuery } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountCompany from "./AccountCompany";
import { useHistory } from "react-router-dom";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
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

export const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: ID) {
    myCompanies(first: $first, after: $after) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          ...AccountCompanyFragment
        }
      }
    }
  }
  ${AccountCompany.fragments.company}
`;

export default function AccountCompanyList() {
  const history = useHistory();

  const { data, loading, error, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { variables: { first: 10 } });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (data) {
    const companies = data.myCompanies?.edges.map(({ node }) => node);
    return (
      <>
        {companies && companies.length > 0 ? (
          <>
            <div className="tw-mb-3">
              Vous êtes membre de {data.myCompanies?.totalCount}{" "}
              {(data.myCompanies?.totalCount ?? 0) > 1
                ? "établissements"
                : "établissement"}
            </div>
            {companies.map(company => (
              <AccountCompany
                key={company.siret}
                company={filter(AccountCompany.fragments.company, company)}
              />
            ))}
            {data.myCompanies?.pageInfo.hasNextPage && (
              <div style={{ textAlign: "center" }}>
                <button
                  className="center btn btn--primary small"
                  onClick={() =>
                    fetchMore({
                      variables: {
                        first: 10,
                        after: data.myCompanies?.pageInfo.endCursor,
                      },
                    })
                  }
                >
                  Charger plus d'établissements
                </button>
              </div>
            )}
          </>
        ) : (
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
                    Exemples : ateliers de réparation de véhicules,
                    laboratoires, ateliers de traitement de surfaces, détenteurs
                    d'équipements contenant des fluides frigorigènes et les
                    opérateurs, producteurs de déchets infectieux (hôpitaux,
                    EHPAD, médecins, infirmier(e)s, tatoueurs, dentistes, etc.)
                    maître d'ouvrage d'amiante, intermédiaires, etc.
                  </CalloutText>
                  <Button
                    title="Créer votre établissement"
                    icon="ri-arrow-right-line"
                    iconPosition="right"
                    onClick={() => {
                      history.push({
                        pathname: routes.account.companies.join,
                      });
                    }}
                  >
                    Créer votre établissement
                  </Button>
                </Callout>
              </Col>
              <Col n="12">
                <Callout hasInfoIcon={false}>
                  <CalloutTitle as="h2" size="lg">
                    Votre établissement est déjà sur Trackdéchets.
                  </CalloutTitle>
                  <CalloutText size="sm">
                    Votre entreprise existe déjà sur Trackdéchets. Vous demandez
                    à l'administrateur de le rejoindre.
                  </CalloutText>
                  <Button
                    title="Rejoindre votre établissement"
                    icon="ri-arrow-right-line"
                    iconPosition="right"
                    onClick={() => {
                      history.push({
                        pathname: routes.account.companies.create.simple,
                      });
                    }}
                  >
                    Rejoindre votre établissement
                  </Button>
                </Callout>
              </Col>
              <Col n="12">
                <Callout hasInfoIcon={false}>
                  <CalloutTitle as="h2" size="lg">
                    La gestion des déchets fait partie de votre activité.
                  </CalloutTitle>
                  <CalloutText size="sm">
                    Votre entreprise gère une grande quantité de déchets. Vous
                    souhaitez créer un établissement avec les diverses options
                    possibles : profils de l'entreprise, récépissés, agréments,
                    GEREP, etc.
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
              <Col n="12">
                <Callout hasInfoIcon={false}>
                  <CalloutTitle as="h2" size="lg">
                    Transporteur hors France, Non-French carrier
                  </CalloutTitle>
                  <CalloutText size="sm">
                    Votre entreprise n'est pas immatriculée en France, mais vous
                    transportez des déchets dangereux sur le territoire
                    français.
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
              </Col>
            </Row>
          </Container>
          // <div className="notification success">
          //   <h5 className="h4 tw-mb-4">
          //     Vous n'avez pas encore d'établissement
          //   </h5>
          //   <p>
          //     Pour commencer à utiliser Trackdéchets vous devez appartenir à un
          //     établissement.
          //   </p>

          //   <p> Pour ce faire, 2 possibilités:</p>
          //   <ul className="bullets">
          //     <li>
          //       Votre entreprise n'existe pas encore sur Trackdéchets et vous en
          //       êtes responsable.{" "}
          //       <Link to={`${url}/new`} className="link">
          //         Créez un établissement
          //       </Link>
          //     </li>
          //     <li>
          //       Votre entreprise existe déjà sur Trackdéchets. Demandez à
          //       l'administrateur du compte au sein de votre entreprise de vous
          //       inviter.
          //     </li>
          //   </ul>

          //   <p className="tw-mt-4">
          //     Dès que vous aurez rejoint un établissement, vous pourrez créer et
          //     consulter les bordereaux de votre entreprise.
          //   </p>
          // </div>
        )}
      </>
    );
  }

  return null;
}

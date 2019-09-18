import React from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { RouteComponentProps } from "react-router";
import "./CompanyInfo.scss";

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
      naf
      installation {
        urlFiche
        rubriques {
          rubrique
        }
      }
      isRegistered
    }
  }
`;

export default function CompanyInfo({
  match
}: RouteComponentProps<{ siret: string }>) {
  return (
    <Query query={COMPANY_INFOS} variables={{ siret: match.params.siret }}>
      {({ loading, error, data }) => {
        if (loading) return "Loading...";
        if (error) return `Error!: ${error}`;
        const company = data.companyInfos;

        return (
          <div className="container">
            <h3>{`${company.name} (${company.siret})`}</h3>

            {company.isRegistered ? (
              <h4 className="card is-ligh-green-background">
                Cette entreprise est inscrite sur Trackdéchets
              </h4>
            ) : (
              <h4> Cette entreprise n'est pas inscrite sur TD</h4>
            )}
            <div className="row">
              <div className="card">
                <h3>Contact</h3>
                <div>{company.address}</div>
              </div>
              <div id="map"></div>
            </div>
          </div>
        );
      }}
    </Query>
  );
}

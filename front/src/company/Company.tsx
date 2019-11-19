import React from "react";
import gql from "graphql-tag";
import { Query } from "@apollo/react-components";
import { RouteComponentProps } from "react-router";
import CompanyHeader from "./CompanyHeader";
import CompanyMap from "./CompanyMap";
import "./Company.scss";
import CompanyRegistration from "./CompanyRegistration";
import CompanyDisclaimer from "./CompanyDisclaimer";
import CompanyContact from "./CompanyContact";
import { Company, Declaration } from "./companyTypes";
import CompanyActivity from "./CompanyActivity";

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
      longitude
      latitude
      naf
      libelleNaf
      isRegistered
      installation {
        codeS3ic
        urlFiche
        rubriques {
          rubrique
          alinea
          etatActivite
          regimeAutorise
          category
          activite
          volume
          unite
        }
        declarations {
          codeDechet
          libDechet
          gerepType
        }
      }
    }
  }
`;

export default function CompanyInfo({
  match
}: RouteComponentProps<{ siret: string }>) {
  return (
    <Query
      query={COMPANY_INFOS}
      variables={{ siret: match.params.siret }}
      fetchPolicy="no-cache"
    >
      {({ loading, error, data }) => {
        if (loading) return <p>"Loading..."</p>;
        if (error) return <p>{`Error!: ${error}`}</p>;

        const company: Company = data.companyInfos;

        if (!company.siret) {
          return <p>"Entreprise inconnue"</p>;
        }

        return (
          <div className="section">
            <div className="container">
              <CompanyHeader
                name={company.name}
                siret={company.siret}
                naf={company.naf}
                libelleNaf={company.libelleNaf}
              />

              <CompanyRegistration isRegistered={company.isRegistered} />

              <CompanyDisclaimer />

              <div className="columns">
                <CompanyContact address={company.address} />
                {company.longitude && company.latitude && (
                  <CompanyMap lng={company.longitude} lat={company.latitude} />
                )}
              </div>

              {company.installation && (
                <CompanyActivity installation={company.installation} />
              )}
            </div>
          </div>
        );
      }}
    </Query>
  );
}

import React from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { RouteComponentProps } from "react-router";
import CompanyHeader from "./CompanyHeader";
import CompanyMap from "./CompanyMap";
import "./Company.scss";
import CompanyRegistration from "./CompanyRegistration";
import CompanyDisclaimer from "./CompanyDisclaimer";
import CompanyContact from "./CompanyContact";
import { Company, Declaration } from "./companyTypes";
import CompanyActivity from "./CompanyActivity";
import CompanyWaste from "./CompanyWaste";

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
    <Query query={COMPANY_INFOS} variables={{ siret: match.params.siret }}>
      {({ loading, error, data }) => {
        if (loading) return "Loading...";
        if (error) return `Error!: ${error}`;
        const company: Company = data.companyInfos;

        let wastes = [];

        if (company.installation) {
          company.installation.declarations.forEach((d: Declaration) => {
            if (d.gerepType == "Traiteur") {
            }
          });
        }

        return (
          <div className="section">
            <div className="container">
              <CompanyHeader
                name={company.name}
                siret={company.siret}
                libelleNaf={company.libelleNaf}
              />

              <CompanyRegistration isRegistered={company.isRegistered} />

              <CompanyDisclaimer />

              <div className="columns">
                <CompanyContact address={company.address} />
                <CompanyMap lng={company.longitude} lat={company.latitude} />
              </div>

              {company.installation && (
                <>
                  <CompanyActivity installation={company.installation} />
                  <CompanyWaste installation={company.installation} />
                </>
              )}
            </div>
          </div>
        );
      }}
    </Query>
  );
}

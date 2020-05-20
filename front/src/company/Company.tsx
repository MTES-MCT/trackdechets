import { useQuery } from "@apollo/react-hooks/lib/useQuery";
import gql from "graphql-tag";
import React from "react";
import { useParams } from "react-router";
import { InlineError } from "../common/Error";
import "./Company.scss";
import CompanyActivity from "./CompanyActivity";
import CompanyContact from "./CompanyContact";
import CompanyDisclaimer from "./CompanyDisclaimer";
import CompanyHeader from "./CompanyHeader";
import CompanyMap from "./CompanyMap";
import CompanyRegistration from "./CompanyRegistration";
import { Query, QueryCompanyInfosArgs } from "../generated/graphql/types";

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
      contactEmail
      contactPhone
      website
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
      }
    }
  }
`;

export default function CompanyInfo() {
  const { siret } = useParams<{ siret: string }>();
  const { data, loading, error } = useQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(COMPANY_INFOS, {
    variables: { siret },
    fetchPolicy: "no-cache",
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <InlineError apolloError={error} />;

  if (data) {
    const company = data.companyInfos;

    if (!company.siret) {
      return <p>Entreprise inconnue</p>;
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
            <CompanyContact company={company} />
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
  }

  return null;
}

import { useQuery } from "@apollo/react-hooks/lib/useQuery";
import gql from "graphql-tag";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { InlineError } from "src/common/components/Error";
import "./Company.scss";
import CompanyActivity from "./CompanyActivity";
import CompanyContact from "./CompanyContact";
import CompanyDisclaimer from "./CompanyDisclaimer";
import CompanyHeader from "./CompanyHeader";
import CompanyMap from "./CompanyMap";
import CompanyRegistration from "./CompanyRegistration";
import { Query, QueryCompanyInfosArgs } from "src/generated/graphql/types";

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
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

interface GeoInfo {
  latitude: number;
  longitude: number;
}

export default function CompanyInfo() {
  const { siret } = useParams<{ siret: string }>();
  const { data, loading, error } = useQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(COMPANY_INFOS, {
    variables: { siret },
    fetchPolicy: "no-cache",
  });

  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);

  // Retrieves geo information from api-adresse.data.gouv.fr
  useEffect(() => {
    if (data?.companyInfos?.address) {
      fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${data.companyInfos.address}`
      )
        .then(res => res.json())
        .then(search => {
          if (search.features && search.features.length >= 1) {
            const featureCandidate = search.features[0];
            if (featureCandidate.properties?.score > 0.75) {
              const coordinates = featureCandidate.geometry?.coordinates;
              if (coordinates && coordinates.length === 2) {
                setGeoInfo({
                  longitude: coordinates[0],
                  latitude: coordinates[1],
                });
              }
            }
          }
        });
    }
  }, [data]);

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
            {geoInfo && (
              <CompanyMap lng={geoInfo.longitude} lat={geoInfo.latitude} />
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

import { useQuery, gql } from "@apollo/client";
import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/browser";
import { useParams } from "react-router-dom";
import { InlineError } from "Apps/common/Components/Error/Error";
import "./Company.scss";
import CompanyContact from "./CompanyContact";
import CompanyDisclaimer from "./CompanyDisclaimer";
import CompanyHeader from "./CompanyHeader";
import CompanyMap from "./CompanyMap";
import CompanyRegistration from "./CompanyRegistration";
import { Query, QueryCompanyInfosArgs } from "generated/graphql/types";

const COMPANY_INFOS = gql`
  query CompanyInfos($clue: String!) {
    companyInfos(clue: $clue) {
      siret
      vatNumber
      orgId
      name
      address
      naf
      libelleNaf
      isRegistered
      companyTypes
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
      ecoOrganismeAgreements
      statutDiffusionEtablissement
      etatAdministratif
    }
  }
`;

interface GeoInfo {
  latitude: number;
  longitude: number;
}
/**
 * Public company page component
 */
export default function CompanyInfo() {
  const { orgId } = useParams<{ orgId: string }>();
  const { data, loading, error } = useQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(COMPANY_INFOS, {
    variables: { clue: orgId },
    fetchPolicy: "no-cache",
  });

  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [nonDiffusible, setNonDiffusible] = useState<true | false>(false);

  // Retrieves geo information from api-adresse.data.gouv.fr
  useEffect(() => {
    if (
      data?.companyInfos.statutDiffusionEtablissement === "P" ||
      data?.companyInfos.name === ""
    ) {
      setNonDiffusible(true);
    }
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
        })
        .catch(error => {
          // it just doesn't display the map if there is an error.
          Sentry.captureException(error);
        });
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <InlineError apolloError={error} />;

  if (data) {
    const company = data.companyInfos;

    if (!company || (!company.siret && !company.vatNumber)) {
      return (
        <div className="section">
          <div className="container">
            <p>Entreprise inconnue</p>
          </div>
        </div>
      );
    }

    return (
      <div className="section">
        <div className="container">
          <CompanyHeader
            name={!nonDiffusible ? company.name : "non diffusible"}
            siret={company.orgId}
            naf={!nonDiffusible ? company.naf : "non diffusible"}
            libelleNaf={!nonDiffusible ? company.libelleNaf : "non diffusible"}
          />

          <CompanyRegistration
            isRegistered={company.isRegistered}
            etatAdministratif={company.etatAdministratif}
            companyTypes={company.companyTypes}
          />

          <CompanyDisclaimer />

          <div className="columns">
            {!nonDiffusible && <CompanyContact company={company} />}
            {geoInfo && !nonDiffusible && (
              <CompanyMap lng={geoInfo.longitude} lat={geoInfo.latitude} />
            )}
          </div>

          {/* disabled until ICPE data is up to date
          {company.installation && (
            <CompanyActivity installation={company.installation} />
          )} */}
        </div>
      </div>
    );
  }

  return null;
}

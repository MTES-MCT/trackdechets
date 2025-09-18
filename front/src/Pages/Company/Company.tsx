import { useQuery, gql } from "@apollo/client";
import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/browser";
import { useParams } from "react-router-dom";
import { Query, QueryCompanyInfosArgs } from "@td/codegen-ui";
import { Loader } from "../../Apps/common/Components";
import routes from "../../Apps/routes";
import { COMPANY_TYPE_OPTIONS } from "../../Apps/Companies/common/utils";
import { DsfrNotificationError } from "../../Apps/common/Components/Error/Error";
import CompanyMap from "./CompanyMap";

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
    fetchPolicy: "no-cache"
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
                  latitude: coordinates[1]
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

  const company = data?.companyInfos;

  return (
    <div className="container fr-pt-4w">
      <div className="fr-container--fluid">
        {loading && <Loader />}

        {error && <DsfrNotificationError apolloError={error} />}

        {!loading && (!company || (!company.siret && !company.vatNumber)) && (
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12">
              <div className="fr-alert fr-alert--error">
                <h3 className="fr-alert__title">
                  Cet établissement est inconnu.
                </h3>
              </div>
            </div>
          </div>
        )}

        {!loading && company && (
          <>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12">
                <h1 className="fr-h3">
                  {!nonDiffusible ? company.name : "Non diffusible"} (
                  {company.orgId})
                </h1>

                {company.naf && !nonDiffusible && (
                  <h2 className="fr-text--lead">
                    {company.naf} - {company.libelleNaf}
                  </h2>
                )}

                {company.isRegistered ? (
                  <div className="fr-highlight">
                    <p>
                      Cet établissement est inscrit sur Trackdéchets en tant que
                      :
                    </p>
                    <br />
                    <ul>
                      {company.companyTypes?.map((companyType, idx) => (
                        <li key={idx}>
                          -{" "}
                          {
                            COMPANY_TYPE_OPTIONS.find(
                              t => t.value === companyType
                            )?.label
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="fr-alert fr-alert--error">
                    <h3 className="fr-alert__title">
                      Cet établissement n'est pas encore inscrit sur
                      Trackdéchets
                    </h3>
                    <p>
                      Il s'agit de votre établissement ? Mettez à jour vos
                      informations en{" "}
                      <a
                        className="fr-link force-underline-link"
                        href={routes.signup.index}
                      >
                        vous inscrivant
                      </a>
                      .
                    </p>
                  </div>
                )}

                {company.etatAdministratif?.toUpperCase() === "F" && (
                  <div className="fr-alert fr-alert--error">
                    <h3 className="fr-alert__title">
                      Cet établissement est fermé selon l'INSEE.
                    </h3>
                  </div>
                )}
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-pt-2w">
              <div className="fr-col-12 fr-col-lg-6">
                <h4 className="fr-h4">Contact</h4>
                {company.address && (
                  <p className="fr-pb-2w">
                    Adresse : <strong>{company.address}</strong>
                  </p>
                )}

                {company.contactEmail && (
                  <p className="fr-pb-2w">
                    Courriel : <strong>{company.contactEmail}</strong>
                  </p>
                )}

                {company.contactPhone && (
                  <p className="fr-pb-2w">
                    Téléphone : <strong>{company.contactPhone}</strong>
                  </p>
                )}

                {company.website && (
                  <p className="fr-pb-2w">
                    Site internet : <strong>{company.website}</strong>
                  </p>
                )}

                {company.ecoOrganismeAgreements &&
                  company.ecoOrganismeAgreements.length > 0 && (
                    <>
                      <p className="fr-pb-2w">Agrément(s) éco-organisme :</p>
                      <ul>
                        {company.ecoOrganismeAgreements.map(
                          (agreement, index) => (
                            <li key={index} className="url-ellipsis">
                              <a
                                href={agreement}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fr-link force-underline-link force-external-link-content"
                              >
                                {agreement}
                              </a>
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  )}

                <div className="fr-notice fr-notice--info fr-mt-2w">
                  <div className="fr-container">
                    <p>
                      <span className="fr-notice__title">
                        Une information vous semble erronée ? Faites-le nous
                        savoir via
                      </span>
                      <a
                        href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                        target="_blank"
                        rel="noopener noreferrer external"
                        className="fr-notice__link force-external-link-content force-underline-link"
                      >
                        le formulaire d'assistance Trackdéchets
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
              {geoInfo && !nonDiffusible && (
                <div className="fr-col-12 fr-col-lg-6">
                  <CompanyMap lng={geoInfo.longitude} lat={geoInfo.latitude} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

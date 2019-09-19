import React from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { RouteComponentProps } from "react-router";
import CompanyMap from "./CompanyMap";
import "./Company.scss";

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
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

type Installation = {
  codeS3ic: string;
  urlFiche: string;
  rubriques: [Rubrique];
  declarations: [Declaration];
};

type Company = {
  siret: string;
  name: string;
  address: string;
  naf: string;
  libelleNaf: string;
  isRegistered: boolean;
  installation: Installation;
};

type Rubrique = {
  rubrique: string;
  alinea: string;
  category: string;
  activite: string;
};

type Declaration = {
  codeDechet: string;
  libDechet: string;
  gerepType: string;
};

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
              <div
                className="columns"
                style={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div className="company__info">
                  <h3>{`${company.name} (${company.siret})`}</h3>
                  <h4>{company.libelleNaf}</h4>
                </div>
                <div>
                  <img
                    className="company__logo"
                    src="/logo-placeholder.png"
                    alt="logo-placeholder"
                  ></img>
                </div>
              </div>

              {company.isRegistered && (
                <div className="columns">
                  <div
                    className="notification success"
                    style={{ width: "100%" }}
                  >
                    Cette entreprise est inscrite sur Trackdéchets
                  </div>
                </div>
              )}

              {!company.isRegistered && (
                <div className="columns">
                  <div
                    className="notification warning"
                    style={{ width: "100%" }}
                  >
                    Cette entreprise n'est pas encore inscrite sur Trackdéchets
                    <br />
                    <span style={{ fontStyle: "italic" }}>
                      Il s'agit de votre entreprise ? Mettez à jour vos
                      informations en <a href="/signup">vous inscrivant</a>
                    </span>
                  </div>
                </div>
              )}

              <div className="columns">
                <div className="notification" style={{ width: "100%" }}>
                  Une information vous semble erronée,{" "}
                  <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
                    faites nous le savoir
                  </a>
                </div>
              </div>

              <div className="columns">
                <div className="box">
                  <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                    Contact
                  </p>
                  <p>{company.address}</p>
                </div>
                <CompanyMap lng={3.896853} lat={43.598493} />
              </div>

              {company.installation && (
                <div className="columns">
                  <div className="box">
                    <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                      Activité
                    </p>
                    <p>
                      Installation classée pour la protection de l'environnement{" "}
                      <a href={company.installation.urlFiche}>
                        n°{company.installation.codeS3ic}
                      </a>
                    </p>

                    {[
                      ...new Set(
                        company.installation.rubriques.map(
                          (r: Rubrique) => r.category
                        )
                      )
                    ].map((category, idx) => {
                      switch (category) {
                        case "COLLECTOR":
                          return (
                            <div className="label" key={idx}>
                              Tri transit regroupement
                            </div>
                          );
                        case "WASTE_CENTER":
                          return (
                            <div className="label" key={idx}>
                              Collecte de déchets apportés par le producteur
                              initial
                            </div>
                          );
                        case "WASTE_VEHICLES":
                          return (
                            <div className="label" key={idx}>
                              Véhicules hors d'usage
                            </div>
                          );
                        case "WASTEPROCESSOR":
                          return (
                            <div className="label" key={idx}>
                              Traitement
                            </div>
                          );
                      }
                    })}
                    {company.installation.rubriques.map((rubrique, idx) => {
                      return (
                        <div key={idx}>
                          <p>{rubrique.rubrique}</p>
                          <p>{rubrique.alinea}</p>
                          <p>{rubrique.activite}</p>
                        </div>
                      );
                    })}
                    <p></p>
                  </div>
                </div>
              )}
              {company.installation && (
                <div className="columns">
                  <div className="box">
                    <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                      Déchets
                    </p>
                    {[
                      ...new Set(
                        company.installation.declarations.map(
                          (d: Declaration) => d.codeDechet
                        )
                      )
                    ].map((codeDechet: string, idx) => {
                      let libDechet = company.installation.declarations.find(
                        (d: Declaration) => d.codeDechet === codeDechet
                      );
                      return <div key={idx}>{codeDechet}</div>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </Query>
  );
}

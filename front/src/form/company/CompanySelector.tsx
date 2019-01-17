import ApolloClient from "apollo-client";
import { connect, Field, FieldProps } from "formik";
import React, { useEffect, useState } from "react";
import { ApolloConsumer, Query } from "react-apollo";
import { FaSearch, FaCheck } from "react-icons/fa";
import "./CompanySelector.scss";
import { COMPANY_INFOS, FAVORITES } from "./query";
import RedErrorMessage from "../RedErrorMessage";

type Company = { siret: string; name: string; address: string };

export default connect<FieldProps>(function CompanySelector(props) {
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<Company>(props.field
    .value as Company);

  const searchCompanies = async (
    client: ApolloClient<Company>,
    clue: string
  ) => {
    if (clue.length < 14) {
      return;
    }

    setIsLoading(true);
    const { data } = await client.query<{ companyInfos: Company }>({
      query: COMPANY_INFOS,
      variables: { siret: clue }
    });

    setSearchResults([data.companyInfos]);
    setIsLoading(false);
  };

  useEffect(
    () => {
      props.formik.setFieldValue(
        `${props.field.name}.siret`,
        selectedCompany ? selectedCompany.siret : ""
      );
      props.formik.setFieldValue(
        `${props.field.name}.name`,
        selectedCompany ? selectedCompany.name : ""
      );
      props.formik.setFieldValue(
        `${props.field.name}.address`,
        selectedCompany ? selectedCompany.address : ""
      );
    },
    [selectedCompany]
  );

  // Load different favorites depending on the object we are filling
  const type = props.field.name.split(".")[0].toUpperCase();

  return (
    <Query query={FAVORITES} variables={{ type }}>
      {({ loading, error, data }) => {
        if (loading) return <p>Chargement...</p>;
        if (error) return <p>Erreur :(</p>;

        return (
          <div className="CompanySelector">
            <ApolloConsumer>
              {client => (
                <div className="search__group">
                  <input
                    type="text"
                    placeholder="Recherche par numéro de SIRET"
                    onChange={e => searchCompanies(client, e.target.value)}
                  />
                  <button className="overlay-button" aria-label="Recherche">
                    <FaSearch />
                  </button>
                </div>
              )}
            </ApolloConsumer>

            {isLoading && <span>Chargement...</span>}
            <ul className="company-bookmarks">
              {[...searchResults, ...data.favorites].map(c => (
                <li
                  className={`company-bookmarks__item  ${
                    selectedCompany.name === c.name ? "is-selected" : ""
                  }`}
                  key={c.siret}
                  onClick={() => setSelectedCompany(c)}
                >
                  <div className="content">
                    <h6>{c.name}</h6>
                    <p>
                      {c.siret} - {c.address}
                    </p>
                  </div>
                  <div className="icon">
                    {selectedCompany.siret === c.siret && <FaCheck />}
                  </div>
                </li>
              ))}
            </ul>

            <div className="form__group">
              <label>
                Personne à contacter
                <Field
                  type="text"
                  name={`${props.field.name}.contact`}
                  placeholder="NOM Prénom"
                />
              </label>

              <RedErrorMessage name={`${props.field.name}.contact`} />

              <label>
                Téléphone ou Fax
                <Field
                  type="text"
                  name={`${props.field.name}.phone`}
                  placeholder="Numéro"
                />
              </label>

              <RedErrorMessage name={`${props.field.name}.phone`} />

              <label>
                Mail
                <Field type="email" name={`${props.field.name}.mail`} />
              </label>

              <RedErrorMessage name={`${props.field.name}.mail`} />
            </div>
          </div>
        );
      }}
    </Query>
  );
});

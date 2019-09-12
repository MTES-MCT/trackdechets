import { connect, Field, FieldProps } from "formik";
import React, { useEffect, useState } from "react";
import { Query } from "react-apollo";
import { FaSearch, FaCheck, FaRegCircle } from "react-icons/fa";
import "./CompanySelector.scss";
import { FAVORITES, SEARCH_COMPANIES } from "./query";
import RedErrorMessage from "../RedErrorMessage";
import useDebounce from "../../utils/use-debounce";
import client from "../../graphql-client";


export type Rubrique = {
  rubrique: string;
  alinea: string;
  regime_autorise: string;
  activite: string;
  category: string;
}

export type Company = {
  address: string;
  name: string;
  siret: string;
  contact: string;
  phone: string;
  mail: string;
  codeS3ic: string;
  urlFiche: string;
  naf: string;
  rubriques: Rubrique[];
};

export default connect<FieldProps>(function CompanySelector(props) {
  const [searchTerm, setSearchTerm] = useState<any>({
    clue: "",
    department: undefined
  });
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayDepartment, setDisplayDepartment] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<Company>(props.field
    .value as Company);

  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.clue.length < 1) {
      return;
    }
    searchCompanies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const searchCompanies = async ({
    clue,
    department
  }: {
    clue: string;
    department: number | undefined;
  }) => {
    const isNumber = /^[0-9\s]+$/.test(clue);
    if (isNumber && clue.length < 14) {
      return;
    }

    setIsLoading(true);
    const { data } = await client.query<{ searchCompanies: Company[] }>({
      query: SEARCH_COMPANIES,
      variables: { clue, department }
    });

    if (data.searchCompanies) {
      setSearchResults(data.searchCompanies);
      if (data.searchCompanies.length === 1) {
        setSelectedCompany(data.searchCompanies[0]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    ["siret", "name", "address", "contact", "phone", "mail"].forEach(field => {
      if (!selectedCompany || !selectedCompany[field as keyof Company]) {
        return;
      }
      props.formik.setFieldValue(
        `${props.field.name}.${field}`,
        selectedCompany[field as keyof Company]
      );
    });
  }, [selectedCompany]);

  // Load different favorites depending on the object we are filling
  const type = props.field.name.split(".")[0].toUpperCase();

  return (
    <Query
      query={FAVORITES}
      variables={{ type }}
      onCompleted={data =>
        selectedCompany.siret == ""
          ? setSelectedCompany(data.favorites[0])
          : null
      }
    >
      {({ loading, error, data }) => {
        if (loading) return <p>Chargement...</p>;
        if (error) return <p>Erreur :(</p>;

        return (
          <div className="CompanySelector">
            <div className="search__group">
              <input
                type="text"
                placeholder="Recherche par numéro de SIRET ou nom de l'entreprise"
                onChange={e =>
                  setSearchTerm({ ...searchTerm, clue: e.target.value })
                }
              />
              <button className="overlay-button search-icon" aria-label="Recherche" disabled={true}>
                <FaSearch />
              </button>
            </div>
            <a onClick={e => setDisplayDepartment(!displayDepartment)}>
              Affiner la recherche par département?
            </a>
            {displayDepartment && (
              <div className="form__group">
                <label>
                  Département
                  <input
                    type="text"
                    placeholder="Département ou code postal"
                    onChange={e =>
                      setSearchTerm({
                        ...searchTerm,
                        department: parseInt(e.target.value, 10)
                      })
                    }
                  />
                </label>
              </div>
            )}

            {isLoading && <span>Chargement...</span>}
            <ul className="company-bookmarks">
              {[...searchResults, ...data.favorites].map(c => (
                <li
                  className={`company-bookmarks__item  ${
                    selectedCompany.siret === c.siret ? "is-selected" : ""
                  }`}
                  key={c.siret}
                  onClick={() => setSelectedCompany(c)}
                >
                  <div className="content">
                    <h6>{c.name}</h6>
                    <p>
                      {c.siret} - {c.address}
                    </p>
                    <p>
                      {c.codeS3ic && c.urlFiche &&
                        <a href={c.urlFiche} target="_blank">Installation classée n° {c.codeS3ic}</a>
                      }
                    </p>
                  </div>
                  <div className="icon">
                    {selectedCompany.siret === c.siret ? (
                      <FaCheck />
                    ) : (
                      <FaRegCircle />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <RedErrorMessage name={`${props.field.name}.siret`} />

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

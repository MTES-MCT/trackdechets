import React, { useState, useEffect } from "react";
import { Field, connect } from "formik";
import "./CompanySelector.scss";
import useDebounce from "../../utils/use-debounce";

const bookmarkCompanies = [
  {
    siret: "XXX XXX XXX 0001",
    name: "Ma propre compagnie en premier choix",
    address: "6 boulevard de la Maison"
  },
  {
    siret: "XXX XXX XXX 0002",
    name: "A company 2",
    address: "8 rue du Général de Gaulle"
  },
  {
    siret: "XXX XXX XXX 0003",
    name: "A company 3",
    address: "8 rue du Général de Gaulle"
  },
  {
    siret: "XXX XXX XXX 0004",
    name: "A company 4",
    address: "8 rue du Général de Gaulle"
  }
];

// TODO query INSEE API
function fakeSearch(clue: string) {
  return new Promise(res => {
    const response = [
      {
        siret: "111 XXX XXX 0004",
        name: "A search result",
        address: "42 rue d'Autre Part"
      }
    ];
    setTimeout(() => res(response), 1000);
  });
}

type Company = { siret: string; name: string; address: string };
interface IProps {
  name: string;
}

export default connect<IProps>(function CompanySelector(props) {
  const [clue, setClue] = useState("");
  const debouncedClue = useDebounce(clue, 200);

  const [searchResults, setSearchResults] = useState(bookmarkCompanies);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const searchCompanies = async (clue: string) => {
    setIsLoading(true);
    const apiResults = clue ? await fakeSearch(clue) : [];
    const filteredBookmarks = bookmarkCompanies.filter(
      c => c.name.includes(clue) || c.siret.includes(clue)
    );
    setSearchResults(filteredBookmarks.concat(apiResults as any));
    setIsLoading(false);
  };

  useEffect(
    () => {
      searchCompanies(debouncedClue);
    },
    [debouncedClue]
  );
  useEffect(
    () => {
      props.formik.setFieldValue(
        `${props.name}.siret`,
        selectedCompany ? selectedCompany.siret : ""
      );
      props.formik.setFieldValue(
        `${props.name}.name`,
        selectedCompany ? selectedCompany.name : ""
      );
      props.formik.setFieldValue(
        `${props.name}.address`,
        selectedCompany ? selectedCompany.address : ""
      );
    },
    [selectedCompany]
  );

  return (
    <div className="CompanySelector">
      <div className="search__group">
        <input
          type="text"
          className=""
          placeholder="Recherche par numéro de SIRET"
          value={clue}
          onChange={e => setClue(e.target.value)}
        />
        <button className="overlay-button" aria-label="Recherche">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            version="1.1"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.41v.01zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z"
            />
          </svg>
        </button>
      </div>

      {isLoading && <span>Chargement...</span>}
      <ul className="company-bookmarks">
        {searchResults.map(c => (
          <li
            className={`company-bookmarks__item  ${
              selectedCompany === c ? "is-selected" : ""
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
              <svg
                width="30"
                height="30"
                viewBox="0 0 16 16"
                version="1.1"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z"
                />
              </svg>
            </div>
          </li>
        ))}
      </ul>

      <div className="form__group">
        <label>
          Personne à contacter
          <Field type="text" name={`${props.name}.contact`} placeholder="NOM Prénom" />
        </label>

        <label>
          Téléphone ou Fax
          <Field type="number" name={`${props.name}.phone`} placeholder="Numéro" />
        </label>

        <label>
          Mail
          <Field type="email" name={`${props.name}.mail`} />
        </label>
      </div>
    </div>
  );
});

import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountCompany, { Company } from "./AccountCompany";
import { FaPlusCircle } from "react-icons/fa";
import styles from "./AccountCompanyList.module.scss";
import { useHistory, useRouteMatch, Link } from "react-router-dom";

type Props = {
  companies: [Company];
};

AccountCompanyList.fragments = {
  company: gql`
    fragment AccountCompaniesFragment on CompanyPrivate {
      ...AccountCompanyFragment
    }
    ${AccountCompany.fragments.company}
  `,
};

export default function AccountCompanyList({ companies }: Props) {
  const history = useHistory();
  const { url } = useRouteMatch();

  return (
    <>
      {companies.length ? (
        companies.map((company) => (
          <AccountCompany
            key={company.siret}
            company={filter(AccountCompany.fragments.company, company)}
          />
        ))
      ) : (
        <div className="notification success">
          <h5>Vous n'avez pas encore d'établissement</h5>
          <p>
            Pour commencer à utiliser Trackdéchets vous devez appartenir à un
            établissement.
          </p>

          <p> Pour ce faire, 2 possibilités:</p>
          <ul>
            <li>
              Votre entreprise n'existe pas encore sur Trackdéchets et vous en
              êtes responsable.{" "}
              <Link to={`${url}/new`}>Créez un établissement</Link>
            </li>
            <li>
              Votre entreprise existe déjà sur Trackdéchets. Demandez à
              l'administrateur du compte au sein de votre entreprise de vous
              inviter
            </li>
          </ul>

          <p>
            Dès que vous aurez rejoint un établissement, vous pourrez créer et
            consulter les bordereaux de votre entreprise.
          </p>
        </div>
      )}

      <div
        className={["panel", styles.addCompany].join(" ")}
        onClick={() => history.push(`${url}/new`)}
      >
        <FaPlusCircle /> <h6>Créer un nouvel établissement</h6>
      </div>
    </>
  );
}

import gql from "graphql-tag";
import React from "react";
import { CompanyPrivate } from "../../generated/graphql/types";
import ExportsForm from "./ExportsForm";
import { filter } from "graphql-anywhere";

interface IProps {
  companies: CompanyPrivate[];
}

Exports.fragments = {
  company: gql`
    fragment ExportsCompanyFragment on CompanyPrivate {
      ...ExportsFormCompanyFragment
    }
    ${ExportsForm.fragments.company}
  `,
};

export default function Exports({ companies }: IProps) {
  return (
    <div className="tw-p-6">
      <h2>Exporter un registre</h2>
      <p className="notification success">
        Vous avez la possibilité de télécharger un registre des déchets entrants
        et sortants de votre entreprise. Cet export est un document CSV au
        format UTF-8. Assurez vous que vous l'ouvrez dans le bon format pour
        éviter les problèmes d'accents.
      </p>
      <ExportsForm
        companies={filter(ExportsForm.fragments.company, companies)}
      />
    </div>
  );
}

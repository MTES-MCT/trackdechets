import React from "react";
import "./companyRegistryDelegation.scss";
import { CompanyPrivate } from "@td/codegen-ui";
import { RegistryDelegationsTable } from "./RegistryDelegationsTable";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRegistryDelegationAsDelegate = ({ company }: Props) => {
  return (
    <>
      <h4>Délégataires</h4>
      <div>
        Les entreprises ci-dessous m'autorisent à faire leurs déclarations au
        Registre National des Déchets, Terres Excavées et Sédiments (RNDTS)
      </div>
      <div>
        <RegistryDelegationsTable as="delegate" company={company} />
      </div>
    </>
  );
};

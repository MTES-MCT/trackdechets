import React from "react";
import "./CompanyRegistry.scss";
import { CompanyPrivate } from "@td/codegen-ui";
import { RegistryDelegationsTable } from "./RegistryDelegationsTable";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRegistryDelegationAsDelegate = ({ company }: Props) => {
  return (
    <>
      <h3 className="fr-h4">Délégataires</h3>
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

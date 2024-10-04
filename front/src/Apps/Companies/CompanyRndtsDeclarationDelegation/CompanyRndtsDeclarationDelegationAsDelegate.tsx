import React from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate } from "@td/codegen-ui";
import { RndtsDeclarationDelegationsTable } from "./RndtsDeclarationDelegationsTable";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRndtsDeclarationDelegationAsDelegate = ({
  company
}: Props) => {
  return (
    <>
      <h4>Délégataires</h4>
      <div>
        Les entreprises ci-dessous m'autorisent à faire leurs déclarations des
        registres RNDTS
      </div>
      <div>
        <RndtsDeclarationDelegationsTable as="delegate" company={company} />
      </div>
    </>
  );
};

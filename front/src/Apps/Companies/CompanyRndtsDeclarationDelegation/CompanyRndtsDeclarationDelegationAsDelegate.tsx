import React from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRndtsDeclarationDelegationAsDelegate = ({
  company
}: Props) => {
  return (
    <>
      <h4>Délégataires</h4>
      <p>
        Les entreprises ci-dessous m'autorisent à faire leurs déclarations des
        registres RNDTS
      </p>
      <p>TODO: tableau</p>
    </>
  );
};

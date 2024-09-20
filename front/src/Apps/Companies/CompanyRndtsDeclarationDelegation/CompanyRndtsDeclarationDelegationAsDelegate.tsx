import React from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate, Query, UserRole } from "@td/codegen-ui";
import { RndtsDeclarationDelegationsTable } from "./RndtsDeclarationDelegationsTable";
import { useQuery } from "@apollo/client";
import { RNDTS_DECLARATION_DELEGATIONS } from "../../common/queries/rndtsDeclarationDelegation/queries";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRndtsDeclarationDelegationAsDelegate = ({
  company
}: Props) => {
  const { data, loading } = useQuery<
    Pick<Query, "rndtsDeclarationDelegations">
  >(RNDTS_DECLARATION_DELEGATIONS, {
    skip: !company?.orgId,
    variables: {
      where: { delegateOrgId: company.orgId }
    }
  });

  const delegations =
    data?.rndtsDeclarationDelegations.edges.map(edge => edge.node) ?? [];

  return (
    <>
      <h4>Délégataires</h4>
      <div>
        Les entreprises ci-dessous m'autorisent à faire leurs déclarations des
        registres RNDTS
      </div>
      <div>
        <RndtsDeclarationDelegationsTable
          loading={loading}
          delegations={delegations}
        />
      </div>
    </>
  );
};

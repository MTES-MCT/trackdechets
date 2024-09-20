import React, { useState } from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate, Query, UserRole } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { CreateRndtsDeclarationDelegationModal } from "./CreateRndtsDeclarationDelegationModal";
import { RndtsDeclarationDelegationsTable } from "./RndtsDeclarationDelegationsTable";
import { useQuery } from "@apollo/client";
import { RNDTS_DECLARATION_DELEGATIONS } from "../../common/queries/rndtsDeclarationDelegation/queries";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRndtsDeclarationDelegationAsDelegator = ({
  company
}: Props) => {
  const isAdmin = company.userRole === UserRole.Admin;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading } = useQuery<
    Pick<Query, "rndtsDeclarationDelegations">
  >(RNDTS_DECLARATION_DELEGATIONS, {
    skip: !company?.orgId,
    variables: {
      where: { delegatorOrgId: company.orgId }
    }
  });

  const delegations =
    data?.rndtsDeclarationDelegations.edges.map(edge => edge.node) ?? [];

  return (
    <>
      <h4>Délégations</h4>
      <div>
        J'autorise les entreprises ci-dessous à faire mes déclarations des
        registres RNDTS
      </div>

      {isAdmin && (
        <div>
          <Button
            priority="primary"
            size="small"
            className="fr-my-4v"
            nativeButtonProps={{
              type: "button",
              "data-testid": "company-add-rndtsDeclarationDelegation"
            }}
            disabled={false}
            onClick={() => setIsModalOpen(true)}
          >
            Créer une délégation
          </Button>
        </div>
      )}

      <div>
        <RndtsDeclarationDelegationsTable
          loading={loading}
          delegations={delegations}
        />
      </div>

      <CreateRndtsDeclarationDelegationModal
        company={company}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

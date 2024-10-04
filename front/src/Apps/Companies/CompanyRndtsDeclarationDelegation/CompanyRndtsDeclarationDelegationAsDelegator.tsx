import React, { useState } from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { CreateRndtsDeclarationDelegationModal } from "./CreateRndtsDeclarationDelegationModal";
import { RndtsDeclarationDelegationsTable } from "./RndtsDeclarationDelegationsTable";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRndtsDeclarationDelegationAsDelegator = ({
  company
}: Props) => {
  const isAdmin = company.userRole === UserRole.Admin;

  const [isModalOpen, setIsModalOpen] = useState(false);

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
            disabled={isModalOpen}
            onClick={() => setIsModalOpen(true)}
          >
            Créer une délégation
          </Button>
        </div>
      )}

      <div>
        <RndtsDeclarationDelegationsTable as="delegator" company={company} />
      </div>

      <CreateRndtsDeclarationDelegationModal
        company={company}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

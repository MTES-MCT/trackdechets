import React, { useState } from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { CreateRndtsDeclarationDelegationModal } from "./CreateRndtsDeclarationDelegationModal";

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
      <p>
        J'autorise les entreprises ci-dessous à faire mes déclarations des
        registres RNDTS
      </p>

      {isAdmin && (
        <p>
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
        </p>
      )}

      <p>TODO: tableau</p>

      <CreateRndtsDeclarationDelegationModal
        company={company}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

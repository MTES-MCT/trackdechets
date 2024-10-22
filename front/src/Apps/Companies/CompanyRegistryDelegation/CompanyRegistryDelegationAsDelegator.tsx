import React, { useState } from "react";
import "./companyRegistryDelegation.scss";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { CreateRegistryDelegationModal } from "./CreateRegistryDelegationModal";
import { RegistryDelegationsTable } from "./RegistryDelegationsTable";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRegistryDelegationAsDelegator = ({ company }: Props) => {
  const isAdmin = company.userRole === UserRole.Admin;

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <h3 className="fr-h4">Délégations</h3>
      <div>
        J'autorise les entreprises ci-dessous à faire mes déclarations au
        Registre National des Déchets, Terres Excavées et Sédiments (RNDTS)
      </div>

      {isAdmin && (
        <div>
          <Button
            priority="primary"
            size="small"
            className="fr-my-4v"
            nativeButtonProps={{
              type: "button",
              "data-testid": "company-add-registryDelegation"
            }}
            disabled={isModalOpen}
            onClick={() => setIsModalOpen(true)}
          >
            Créer une délégation
          </Button>
        </div>
      )}

      <div>
        <RegistryDelegationsTable as="delegator" company={company} />
      </div>

      <CreateRegistryDelegationModal
        company={company}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

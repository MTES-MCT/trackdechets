import React, { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  CompanyPrivate,
  Mutation,
  MutationDeleteCompanyArgs
} from "@td/codegen-ui";
import { DELETE_COMPANY, MY_COMPANIES, GET_ME } from "../common/queries";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import routes from "../../routes";
import { Modal } from "../../../common/components";
import "./advanced.scss";
import { NotificationError } from "../../common/Components/Error/Error";

interface AdvancedProps {
  company: CompanyPrivate;
}
const CompanyAdvanced = ({ company }: AdvancedProps) => {
  const navigate = useNavigate();
  const [isModalOpened, setIsModalOpened] = useState<boolean>(false);

  const [deleteCompany, { loading, error }] = useMutation<
    Pick<Mutation, "deleteCompany">,
    MutationDeleteCompanyArgs
  >(DELETE_COMPANY, {
    variables: { id: company.id },
    refetchQueries: [GET_ME, { query: MY_COMPANIES, variables: { first: 10 } }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      navigate(routes.companies.index);
    }
  });
  const companyFullname = `${company?.name} - ${company?.givenName}`;

  const onClick = () => {
    setIsModalOpened(true);
  };
  const onCloseModal = () => {
    setIsModalOpened(false);
  };
  const onRemoveCompany = () => deleteCompany();

  return (
    <div className="company-advanced">
      <h4 className="company-advanced__title">
        Suppression de l'établissement
      </h4>
      <p className="company-advanced__description">
        En supprimant cet établissement, vous supprimez les accès de tous les
        administrateurs et collaborateurs et vous ne pourrez plus accéder ni au
        suivi des bordereaux, ni au registre.
      </p>

      <Button
        size="small"
        onClick={onClick}
        disabled={isModalOpened}
        nativeButtonProps={{ className: "btn-red" }}
      >
        Supprimer
      </Button>

      <Modal
        ariaLabel="Suppression de l'établissement"
        onClose={onCloseModal}
        isOpen={isModalOpened}
      >
        <h4 className="company-advanced__modal-title">
          Supprimer {company?.name} - {company?.givenName}
        </h4>

        <p className="company-advanced__modal-description">
          Êtes vous sur de vouloir supprimer l'établissement {companyFullname} ?
          En supprimant cet établissement, vous supprimez les accès de tous les
          administrateurs et collaborateurs et vous ne pourrez plus accéder ni
          au suivi des bordereaux, ni au registre.
        </p>

        {error && <NotificationError apolloError={error} />}

        <div className="company-advanced__modal-cta">
          <Button
            size="small"
            onClick={onRemoveCompany}
            disabled={loading}
            nativeButtonProps={{ className: "btn-red" }}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
          <Button size="small" onClick={onCloseModal} disabled={loading}>
            Ne pas supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyAdvanced;

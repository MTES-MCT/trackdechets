import React from "react";
import { useMutation } from "@apollo/client";
import { GET_ME } from "../Account/Account";
import {
  CompanyPrivate,
  Mutation,
  MutationDeleteCompanyArgs
} from "@td/codegen-ui";
import AccountField from "../Account/fields/AccountField";
import { MY_COMPANIES, DELETE_COMPANY } from "./common/queries";
import routes from "../routes";
import { useNavigate } from "react-router-dom";

interface AccountCompanyAdvancedProps {
  company: Pick<CompanyPrivate, "id">;
}

export default function AccountCompanyAdvanced({
  company
}: AccountCompanyAdvancedProps) {
  const navigate = useNavigate();

  const [deleteCompany, { loading }] = useMutation<
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

  return (
    <AccountField
      name="delete"
      label="Supprimer l'établissement"
      value
      renderForm={() => (
        <>
          <div className="notification notification--warning">
            En supprimant cet établissement, vous supprimez les accès de tous
            les administrateurs et collaborateurs et vous ne pourrez plus
            accéder ni au suivi des bordereaux, ni au registre.
            <br />
            Pour retirer les droits d'un membre, allez sur l'onglet « Membres ».
            <br />
            <br />
            Êtes-vous sûr de vouloir le supprimer ?
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => deleteCompany()}
            disabled={loading}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </>
      )}
      modifier="Supprimer"
    />
  );
}

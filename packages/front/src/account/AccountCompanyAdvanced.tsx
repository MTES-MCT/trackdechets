import React from "react";
import { gql, useMutation } from "@apollo/client";
import { GET_ME } from "./Account";
import {
  CompanyPrivate,
  Mutation,
  MutationDeleteCompanyArgs
} from "@trackdechets/codegen/src/front.gen";
import AccountField from "./fields/AccountField";
import { MY_COMPANIES } from "./AccountCompanyList";
import routes from "common/routes";
import { useHistory } from "react-router-dom";

AccountCompanyAdvanced.fragments = {
  company: gql`
    fragment AccountCompanyAdvancedFragment on CompanyPrivate {
      id
    }
  `
};

interface AccountCompanyAdvancedProps {
  company: Pick<CompanyPrivate, "id">;
}

const DELETE_COMPANY = gql`
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id) {
      id
    }
  }
`;

export default function AccountCompanyAdvanced({
  company
}: AccountCompanyAdvancedProps) {
  const history = useHistory();

  const [deleteCompany, { loading }] = useMutation<
    Pick<Mutation, "deleteCompany">,
    MutationDeleteCompanyArgs
  >(DELETE_COMPANY, {
    variables: { id: company.id },
    refetchQueries: [GET_ME, { query: MY_COMPANIES, variables: { first: 10 } }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      history.push(routes.account.companies.list);
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
            Pour retirer les droits d'un membre, allez sur l'onglet « Membres ».
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

import React from "react";
import { gql, useMutation } from "@apollo/client";
import { GET_ME } from "./Account";
import {
  CompanyPrivate,
  Mutation,
  MutationDeleteCompanyArgs,
} from "../generated/graphql/types";
import AccountField from "./fields/AccountField";

AccountCompanyAdvanced.fragments = {
  company: gql`
    fragment AccountCompanyAdvancedFragment on CompanyPrivate {
      id
    }
  `,
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
  company,
}: AccountCompanyAdvancedProps) {
  const [deleteCompany, { loading }] = useMutation<
    Pick<Mutation, "deleteCompany">,
    MutationDeleteCompanyArgs
  >(DELETE_COMPANY, {
    variables: { id: company.id },
    refetchQueries: [GET_ME],
  });

  return (
    <AccountField
      name="delete"
      label="Supprimer l'établissement"
      value
      renderForm={() => (
        <>
          <div className="notification warning">
            En supprimant cet établissement vous ne pourrez plus accéder au
            suivi des bordereaux qui le concerne.
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

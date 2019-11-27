import React from "react";
import gql from "graphql-tag";
import AccountField from "../AccountField";
import AccountSimpleFieldForm from "./forms/AccountSimpleFieldForm";
import { useMutation } from "@apollo/react-hooks";

type Me = {
  name: string;
};

type Props = {
  me: Me;
};

AccountFieldName.fragments = {
  me: gql`
    fragment AccountFieldNameFragment on User {
      id
      name
    }
  `
};

const UPDATE_NAME = gql`
  mutation UpdateName($name: String!) {
    editProfile(name: $name) {
      id
      name
    }
  }
`;

export default function AccountFieldName({ me }: Props) {
  return (
    <AccountField
      name="name"
      label="Nom utilisateur"
      value={me.name}
      renderForm={toggleEdition => (
        <AccountSimpleFieldForm<Me>
          name="name"
          type="text"
          value={me.name}
          mutationTuple={useMutation(UPDATE_NAME)}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
      modifier="Modifier"
    />
  );
}

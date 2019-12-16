import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";

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
        <AccountFormSimpleInput<Me>
          name="name"
          type="text"
          value={me.name}
          placeHolder="Nom utilisateur"
          mutation={UPDATE_NAME}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}

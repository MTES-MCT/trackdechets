import React from "react";
import gql from "graphql-tag";
import AccountField from "../AccountField";
import AccountSimpleFieldForm from "./forms/AccountSimpleFieldForm";

type Me = {
  email: string;
};

type Props = {
  me: Me;
};

AccountFieldEmail.fragments = {
  me: gql`
    fragment AccountFieldEmailFragment on User {
      id
      email
    }
  `
};

const UPDATE_EMAIL = gql`
  mutation UpdateEmail($email: String!) {
    editProfile(email: $email) {
      id
      email
    }
  }
`;

export default function AccountFieldEmail({ me }: Props) {
  return (
    <AccountField
      name="email"
      label="Email"
      value={me.email}
      renderForm={toggleEdition => (
        <AccountSimpleFieldForm<{ email: string }>
          name="email"
          type="email"
          value={me.email}
          mutation={UPDATE_EMAIL}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
      modifier="Modifier"
    />
  );
}

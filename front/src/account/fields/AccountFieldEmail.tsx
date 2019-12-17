import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import * as Yup from "yup";

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

const yupSchema = Yup.object().shape({
  email: Yup.string()
    .required()
    .email()
});

export default function AccountFieldEmail({ me }: Props) {
  return (
    <AccountField
      name="email"
      label="Email"
      value={me.email}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<{ email: string }>
          name="email"
          type="email"
          value={me.email}
          placeHolder="Email"
          mutation={UPDATE_EMAIL}
          yupSchema={yupSchema}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}

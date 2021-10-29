import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import { User, MutationEditProfileArgs } from "generated/graphql/types";

AccountFieldEmail.fragments = {
  me: gql`
    fragment AccountFieldNameFragment on User {
      id
      email
    }
  `,
};

const UPDATE_EMAIL = gql`
  mutation UpdateEmail($email: String!) {
    editProfile(email: $email) {
      id
      email
    }
  }
`;

const yupSchema = object().shape({
  email: string().email().required(),
});

interface AccountFieldEmailProps {
  me: Pick<User, "email">;
}

export default function AccountFieldEmail({ me }: AccountFieldEmailProps) {
  return (
    <AccountField
      name="email"
      label="Email"
      value={me.email}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationEditProfileArgs>>
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

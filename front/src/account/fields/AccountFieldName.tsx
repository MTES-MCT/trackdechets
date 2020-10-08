import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import { User, MutationEditProfileArgs } from "generated/graphql/types";

type Me = Pick<User, "name">;

type Props = {
  me: Me;
};

AccountFieldName.fragments = {
  me: gql`
    fragment AccountFieldNameFragment on User {
      id
      name
    }
  `,
};

const UPDATE_NAME = gql`
  mutation UpdateName($name: String!) {
    editProfile(name: $name) {
      id
      name
    }
  }
`;

const yupSchema = object().shape({
  name: string().required(),
});

export default function AccountFieldName({ me }: Props) {
  return (
    <AccountField
      name="name"
      label="Nom utilisateur"
      value={me.name}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationEditProfileArgs>>
          name="name"
          type="text"
          value={me.name}
          placeHolder="Nom utilisateur"
          mutation={UPDATE_NAME}
          yupSchema={yupSchema}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}

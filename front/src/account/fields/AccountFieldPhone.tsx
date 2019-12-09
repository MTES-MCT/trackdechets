import React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import AccountField from "../AccountField";
import AccountSimpleFieldForm from "./forms/AccountSimpleFieldForm";

type Me = {
  phone: string;
};

type Props = {
  me: Me;
};

AccountFieldPhone.fragments = {
  me: gql`
    fragment AccountFieldPhoneFragment on User {
      id
      phone
    }
  `
};

const UPDATE_PHONE = gql`
  mutation UpdatePhone($phone: String!) {
    editProfile(phone: $phone) {
      id
      phone
    }
  }
`;

export default function AccountFieldPhone({ me }: Props) {
  return (
    <AccountField
      name="phone"
      label="Téléphone"
      value={me.phone}
      renderForm={toggleEdition => (
        <AccountSimpleFieldForm<Me>
          name="phone"
          type="tel"
          value={me.phone}
          mutation={UPDATE_PHONE}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
      modifier="Modifier"
    />
  );
}

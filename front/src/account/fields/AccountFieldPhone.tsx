import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";

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
  `,
};

const UPDATE_PHONE = gql`
  mutation UpdatePhone($phone: String!) {
    editProfile(phone: $phone) {
      id
      phone
    }
  }
`;

const yupSchema = object().shape({
  phone: string()
    .trim()
    .matches(/^(0[1-9])(?:[ _.-]?(\d{2})){4}$/, {
      message: "Le numéro de téléphone est invalide",
      excludeEmptyString: true,
    }),
});

export default function AccountFieldPhone({ me }: Props) {
  return (
    <AccountField
      name="phone"
      label="Téléphone"
      value={me.phone}
      renderForm={(toggleEdition) => (
        <AccountFormSimpleInput<Me>
          name="phone"
          type="tel"
          value={me.phone}
          placeHolder="Téléphone"
          mutation={UPDATE_PHONE}
          yupSchema={yupSchema}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}

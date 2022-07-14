import React from "react";
import { gql } from "@apollo/client";
import { getCountries, isValidPhoneNumber } from "libphonenumber-js";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import { User, MutationEditProfileArgs } from "generated/graphql/types";

type Me = Pick<User, "phone">;

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

const countries = getCountries().map(country => country);

const yupSchema = object().shape({
  phone: string()
    .trim()
    .test(
      "is-valid-phone",
      "Merci de renseigner un numéro de téléphone valide",
      value =>
        !!value &&
        ((!value.startsWith("0") &&
          countries.some(country => isValidPhoneNumber(value!, country))) ||
          (value.startsWith("0") &&
            /^(0[1-9])(?:[ _.-]?(\d{2})){4}$/.test(value)))
    ),
});

export default function AccountFieldPhone({ me }: Props) {
  return (
    <AccountField
      name="phone"
      label="Téléphone"
      value={me.phone}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationEditProfileArgs>>
          name="phone"
          type="tel"
          value={me.phone}
          placeHolder="Téléphone"
          mutation={UPDATE_PHONE}
          mutationArgs={{}}
          yupSchema={yupSchema}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}

import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountFieldEmail from "./fields/AccountFieldEmail";
import AccountFieldPhone from "./fields/AccountFieldPhone";

type Props = {
  me: {
    email: string;
    phone: string;
  };
};

AccountInfo.fragments = {
  me: gql`
    fragment AccountInfoFragment on User {
      ...AccountFieldEmailFragment
      ...AccountFieldPhoneFragment
    }
    ${AccountFieldEmail.fragments.me},
    ${AccountFieldPhone.fragments.me}
  `
};

export default function AccountInfo({ me }: Props) {
  return (
    <>
      <AccountFieldEmail me={filter(AccountFieldEmail.fragments.me, me)} />
      <AccountFieldPhone me={filter(AccountFieldPhone.fragments.me, me)} />
    </>
  );
}

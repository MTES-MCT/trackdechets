import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountFieldName from "./fields/AccountFieldName";
import AccountFieldEmail from "./fields/AccountFieldEmail";
import AccountFieldPhone from "./fields/AccountFieldPhone";
import AccountFieldPassword from "./fields/AccountFieldPassword";

type Props = {
  me: {
    email: string;
    phone: string;
    name: string;
  };
};

AccountInfo.fragments = {
  me: gql`
    fragment AccountInfoFragment on User {
      ...AccountFieldEmailFragment
      ...AccountFieldPhoneFragment
      ...AccountFieldNameFragment
    }
    ${AccountFieldEmail.fragments.me},
    ${AccountFieldPhone.fragments.me},
    ${AccountFieldName.fragments.me}
  `
};

export default function AccountInfo({ me }: Props) {
  return (
    <>
      <AccountFieldName me={filter(AccountFieldName.fragments.me, me)} />
      <AccountFieldEmail me={filter(AccountFieldEmail.fragments.me, me)} />
      <AccountFieldPhone me={filter(AccountFieldPhone.fragments.me, me)} />
      <AccountFieldPassword />
    </>
  );
}
